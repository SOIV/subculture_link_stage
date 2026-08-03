[← 목차](README.md)

# 10. 인프라, 데이터 보관, 보안, 운영 모니터링

## 10.1 인프라 및 기술 스택

### 10.1.1 권장 기술 스택

| 영역 | 권장안 | 비고 |
|---|---|---|
| Backend | Node.js + TypeScript | Express, Fastify 또는 NestJS 검토 |
| Web | Next.js + React | 공개 웹과 관리자 UI 분리 가능 |
| DB | PostgreSQL | Supabase, Neon, 자체 호스팅 등 |
| ORM | Prisma 또는 Drizzle | Migration 관리 필수 |
| Queue | Redis + BullMQ | 수집·번역·알림 Worker |
| Storage | Cloudflare R2 / S3 | 원본 및 이미지 |
| Search | PostgreSQL FTS | 초기 |
| Vector | pgvector | 데이터 축적 후 도입 |
| ICS | ical-generator | Node.js 기준 |
| Monitoring | Sentry + Metrics | 초기 무료/저비용 플랜 |
| CDN/DNS | Cloudflare | 기존 환경 활용 |

### 10.1.2 배포 구조 예시

```text
Cloudflare
- DNS
- CDN
- R2
- WAF / Rate Limit

Web Hosting
- Cloudflare Pages 또는 Vercel

API / Worker
- Render, Railway, Fly.io, VPS 등

Database
- Supabase / Neon / Managed PostgreSQL

Queue
- Managed Redis 또는 소형 자체 Redis
```

### 10.1.3 무료 운영 원칙 수정

v2의 완전 무료 운영은 장기 목표와 맞지 않는다. 확정된 운영 형태는 무료 + 부분 유료화(F2P)이며, 유료화 수익의 사용처(개발·운영 유지비 우선, 잉여는 행사 관련 투자·참여 비용)는 [01-overview-and-principles.md §1.6.2](01-overview-and-principles.md#162-운영-형태) 참고.

초기에는 무료 티어와 저비용 서비스를 활용하되 다음 비용을 고려한다.

- PostgreSQL 저장 용량
- R2/S3 저장 용량
- 수집 Worker 실행 시간
- 번역 API 또는 LLM 비용
- 임베딩 생성 비용
- Redis 및 Queue
- 외부 SNS API 비용

비용 절감을 위해 번역 전 필터링, 변경 부분만 재처리, 이미지 선별 보관, 데이터 압축 및 보관 정책을 적용한다.

> **미결 사항 — 비용 상한선**: 현재 문서에는 "비용을 고려한다"는 방향만 있고, 월 예산 상한이나 "이 이상 넘으면 번역/수집 빈도를 줄인다" 같은 구체적인 트리거는 없다. 1인 운영 초기 단계에서는 실제 청구서를 몇 달 지켜본 뒤 상한을 정하는 편이 현실적이므로, 별도로 값을 정하기 전까지는 의도적인 미결 상태로 둔다.

## 10.2 데이터 용량 및 보관 정책

### 10.2.1 용량 증가 요인

- 행사 및 개별 일정
- 관계형 태그와 연결 테이블
- 수집 문서 원문
- HTML/JSON 스냅샷
- 이미지 및 포스터
- 3개 언어 번역문
- 언어별 검색 인덱스
- 임베딩 벡터
- 분석 및 검수 이력
- 알림 발송 기록

### 10.2.2 보관 등급

#### 영구 보관

- 확정 행사 및 일정
- 공식 출처 URL
- 상태 및 변경 이력
- 관리자 검수 결과
- 공개 번역 리비전
- 용어집
- 원문 해시 및 핵심 메타데이터

#### 장기 보관

- 승인 근거가 된 공식 HTML/JSON 스냅샷
- 공식 포스터
- 취소·연기 공지

#### 기간제 보관

- 파싱 실패 원본
- 제외된 수집 문서 전체 원본
- 디버그 로그
- 실패한 번역 응답

#### 선별 또는 미보관

- SNS 일반 이미지 전체
- 영상 원본
- 행사와 무관한 첨부파일
- 반복된 동일 스냅샷

### 10.2.3 압축 및 중복 제거

- 콘텐츠 해시 기반 중복 제거
- HTML, JSON, XML 압축 저장
- 이미지 원본과 썸네일 분리
- 동일 포스터 재사용 시 Storage Object 참조 공유
- 변경 없는 페이지는 새 파일을 만들지 않고 확인 시각만 갱신

## 10.3 보안 및 권한

### 10.3.1 역할

전역 역할(내부 운영자 대상):

```text
ADMIN
DATA_REVIEWER
TRANSLATION_REVIEWER
TRUSTED_CONTRIBUTOR
USER
SERVICE_CLIENT
```

event_id 단위로 스코프되는 권한(행사 측 담당자 대상, 전역 역할과 별도 매핑 테이블로 관리):

```text
EVENT_ORGANIZER_REP  (행사 관리자 대표 — 하위 계정 조회·제거만 가능, 등록 불가)
EVENT_ORGANIZER      (행사 관리자 하위 계정)
```

### 10.3.2 기본 정책

- 관리자 API 인증 필수
- 공개 API Rate Limit 적용
- 수집 Worker와 API의 DB 권한 분리
- 오브젝트 스토리지 비공개 Bucket 기본
- 공개 이미지에만 서명 URL 또는 CDN 경로 제공
- 모든 수정·승인 작업 감사 로그 기록 — 단, 루트 관리자는 1인 운영 및 공유 계정 특성상 계정 단위 기록에 그치고, 행사 관리자(대표/하위)는 event_id 스코프 권한 특성상 계정별로 구분 기록됨
- 사용자 제안에 스팸 방지 및 신고 기능 적용

관리자 로그인의 구체적인 인증 방식과 3단계 권한 구조(루트 관리자 / 행사 관리자 대표 / 행사 관리자 하위 계정)는 [07-admin-dashboard.md §7.6 인증 및 권한 구조](07-admin-dashboard.md#76-인증-및-권한-구조)에 정리되어 있다.

## 10.4 운영 및 모니터링

### 10.4.1 필수 지표

- 출처별 수집 성공률
- 문서 중복률
- 후보 승인·거절 비율
- 잘못된 행사 매칭률
- 번역 실패율
- 번역 수정 요청 수
- 용어집 적용률
- API 응답 시간 및 오류율
- Worker Queue 대기량
- DB 및 스토리지 사용량
- 알림 발송 성공률

### 10.4.2 오류 처리

- 네트워크 오류: 지수 백오프 재시도
- 파싱 오류: 원본 보존 및 검수 작업 생성
- 번역 오류: FAILED 상태 및 재시도 가능
- 날짜 충돌: 자동 반영 금지 및 관리자 검수
- 행사 매칭 불확실: 신규 행사 후보와 기존 행사 후보를 함께 제시
- 공식 페이지 삭제: 기존 데이터 삭제 금지, 출처 상태만 변경

### 10.4.3 백업

- PostgreSQL 자동 백업
- 정기 복구 테스트
- 주요 스토리지 오브젝트 버전 또는 별도 백업 검토
- 용어집·검수 이력·행사 기준 데이터 우선 복구
- 단순 Worker 로그와 캐시는 복구 우선순위에서 제외

---

[← 목차](README.md) · 이전: [09. 검색 및 알림](09-search-and-notifications.md) · 다음: [11. 개발 단계 및 성공 기준](11-roadmap-and-success.md)
