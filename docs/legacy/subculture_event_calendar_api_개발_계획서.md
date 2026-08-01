# Subculture / Game Event Calendar API

> 개인 사용 목적의 공식 행사 일정 캘린더 인프라 구축 계획서

---

## 1. 프로젝트 개요

### 1.1 목적
- 서브컬처 및 게임 관련 **공식 행사 일정**을 한 곳에서 관리
- Google Calendar 등 외부 캘린더에 **ICS 피드로 연동**
- 디스코드 봇, 개인 프로젝트에서 재사용 가능한 **읽기 전용 API** 제공
- 수익화 목적 ❌ / 개인 인프라 목적 ⭕

### 1.2 핵심 원칙
- **공식 정보만 등록** (공식 사이트 / 공식 X 계정)
- 자동화는 *후보 생성까지만*
- 최종 등록은 수동 승인
- 관리 부담 최소화

---

## 2. 전체 시스템 구조

```
[공식 사이트 / 공식 X]
        ↓ (자동 수집)
[수집기 (Crawler / Scraper)]
        ↓ (후보 일정)
[관리 대시보드 (승인/거절)]
        ↓ (확정 이벤트)
[이벤트 DB]
     ↓            ↓
 [ICS 피드]   [REST API]
                  ↓
            [디스코드 봇]
```

---

## 3. 기능 범위 정의 (Scope)

### 3.1 포함 기능
- 공식 사이트 / X 일정 자동 수집
- 후보 일정 저장
- 관리자 승인/거절
- 확정 이벤트 관리
- ICS 캘린더 생성
- 읽기 전용 이벤트 API

### 3.2 외부 서비스 사용 가능 기능
- 커뮤니티 제보 시스템
- 수정 요청 워크플로우

### 3.3 제외 기능
- 일반 사용자 로그인
- 수익화 / 광고

---

## 4. 데이터 설계

### 4.1 Event (확정 이벤트)
```json
{
  "id": "tgs-2026",
  "title": "Tokyo Game Show 2026",
  "start_date": "2026-09-24",
  "end_date": "2026-09-27",
  "timezone": "Asia/Tokyo",
  "location": "Makuhari Messe",
  "category": ["game", "expo"],
  "official_url": "https://...",
  "source": "official_site",
  "last_verified": "2026-02-01"
}
```

### 4.2 Event Candidate (후보 이벤트)
```json
{
  "id": "candidate-001",
  "title_guess": "Tokyo Game Show 2026",
  "date_guess": "2026-09",
  "official_url": "https://...",
  "source": "twitter",
  "status": "pending",
  "detected_at": "2026-01-10"
}
```

---

## 5. 자동 수집 설계

### 5.1 수집 대상
- 공식 웹사이트 일정 / 공지 페이지
- 공식 X 계정 (트위터)

### 5.2 수집 방식
- 날짜 패턴 탐지 기반
- 키워드 기반 탐색
  - 개최 / 일정 / event / schedule / 開催

### 5.3 자동화 원칙
- 정확한 파싱 ❌
- 일정 *추정*만 수행
- DB에는 **후보로만 저장**

---

## 6. 관리 대시보드

### 6.1 목적
- 자동 수집된 후보 일정 검토
- 최소한의 클릭으로 이벤트 등록

### 6.2 필수 기능
- 후보 일정 리스트
- 공식 링크 바로가기
- 승인 / 거절 버튼
- 날짜 및 제목 간단 수정

### 6.3 비필수 요소
- 디자인 완성도
- 사용자 권한 관리
- 로그 기록 UI

---

## 7. API 설계

### 7.1 REST API (읽기 전용)

```
GET /events
GET /events/upcoming
GET /events?from=YYYY-MM-DD&to=YYYY-MM-DD
GET /events?category=game
```

### 7.2 응답 특징
- JSON 포맷
- 인증 없음
- 개인 사용 기준

---

## 8. ICS 캘린더 설계

### 8.1 제공 엔드포인트

```
/calendar/all.ics
/calendar/game.ics
/calendar/doujin.ics
/calendar/jp.ics
```

### 8.2 특징
- Google Calendar 연동
- 자동 동기화
- 읽기 전용

---

## 9. 기술 스택 (권장)

| 영역 | 선택지 |
|----|------|
| Backend | Node.js |
| DB | SQLite 또는 Supabase |
| Crawler | node-cron + cheerio |
| Dashboard | React / Next.js |
| ICS | ical-generator |
| Bot | discord.js |

---

## 10. 개발 일정 (예상)

### Phase 1 – 최소 동작 버전 (0.5~1일)
- 이벤트 DB
- 수동 이벤트 등록
- ICS 생성

### Phase 2 – 실사용 버전 (1~2일)
- 자동 수집기
- 후보 테이블
- 승인 대시보드
- API 제공

### Phase 3 – 확장 (선택)
- 디스코드 봇
- 수집 소스 추가
- 에러 알림

---

## 11. 유지보수 전략

- 과거 일정 삭제 ❌
- 공식 URL 없는 데이터 등록 ❌
- 수정 요청 대응 ❌
- 검증일(last_verified) 갱신만 수행

---

## 12. 최종 목표 정의

> 본 프로젝트는 서비스가 아닌 **개인 인프라**이며,
> 다른 프로젝트 및 자동화 시스템에서 재사용 가능한
> **공식 행사 일정 기준 데이터 소스**를 만드는 것을 목표로 한다.

---

### 상태
- [ ] 기획 완료
- [ ] MVP 구현
- [ ] 실사용
