[← 목차](README.md)

# 09. 검색 및 유사도 시스템, 알림 설계

## 9.1 기본 검색

- PostgreSQL 전문 검색
- 행사명, 행사 시리즈, 작품, 인물, 장소, 태그 검색
- 한국어·일본어·영어 번역문 검색
- 이름 변형 및 별칭 검색

## 9.2 유사 문서 검색

pgvector 또는 별도 벡터 DB를 사용한다.

활용 목적:

- 신규 문서와 과거 승인 공지 비교
- 신규 문서와 과거 거절 공지 비교
- 중복 행사 탐지
- 기존 행사 자동 매칭
- 번역 수정 사례 검색

초기에는 임베딩을 모든 언어별 번역문에 생성하지 않고 원문 또는 기준 언어 중심으로 운영한다.

## 9.3 알림 유형

```text
NEW_EVENT
TICKET_OPEN
TICKET_CLOSING
LOTTERY_OPEN
LOTTERY_CLOSING
LOTTERY_RESULT
EVENT_REMINDER
STREAM_START
ARCHIVE_CLOSING
EVENT_CANCELLED
EVENT_POSTPONED
VENUE_CHANGED
PARTICIPANT_CHANGED
```

## 9.4 알림 콘텐츠

행사 상세 번역문과 알림 문구를 완전히 중복 저장하지 않는다.

언어별 템플릿을 사용한다.

```text
[티켓 판매 시작]
{행사명}의 일반 티켓 판매가 시작되었습니다.
판매 기간: {시작일}~{종료일}
```

중요한 발송 이력은 보존하고, 일반 알림 본문은 템플릿과 행사 데이터를 통해 생성한다.

## 9.5 발송 구조

```text
공개 데이터 변경
    ↓
notification_job 생성
    ↓
구독자 및 외부 클라이언트 대상 계산
    ↓
Discord / Webhook / Web Push 발송
    ↓
notification_delivery 결과 저장
```

Discord Bot으로 직접 전송할지, Bot이 API를 폴링 또는 변경 Feed를 구독할지는 구현 단계에서 결정한다. 기본 방향은 Bot이 API를 소비하도록 한다.

인앱 알림함(로그인한 사용자가 Web App에서 자신의 알림 목록을 확인하는 UI)은 이 발송 파이프라인의 Push 대상이 아니라, Web App이 REST API로 자신의 `notification_delivery` 이력을 조회하는 Pull 방식으로 동작한다. 즉 별도 발송 채널이 아니라 §8.1.1의 Web App(API 소비 클라이언트)에 속한다.

---

[← 목차](README.md) · 이전: [08. SCLS API 및 ICS 설계](08-api-and-ics.md) · 다음: [10. 인프라, 데이터 보관, 보안, 운영](10-infra-ops-security.md)
