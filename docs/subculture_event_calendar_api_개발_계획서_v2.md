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
- **완전 무료 운영** (호스팅 외 비용 0원)

---

## 2. 전체 시스템 구조

```
[공식 사이트 / RSS 피드]
        ↓ (자동 수집)
[수집기 (Crawler / RSS Parser)]
        ↓ (후보 일정)
[관리 대시보드 (승인/거절)]
        ↓ (확정 이벤트)
[MongoDB Atlas]
     ↓            ↓
 [ICS 피드]   [REST API]
                  ↓
            [디스코드 봇]
```

---

## 3. 기능 범위 정의 (Scope)

### 3.1 포함 기능
- 공식 사이트 HTML 크롤링
- nitter RSS 피드 파싱
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
- Twitter API 사용 (비용 문제)

---

## 4. 데이터 설계

### 4.1 카테고리 체계

#### 대분류 (region)
- `jp`: 일본 (Tokyo Game Show, 코미케 등)
- `kr`: 한국 (G-Star, 예대제 등)
- `global`: 온라인 이벤트 또는 지역 무관

#### 소분류 (category)
- `game`: 게임 관련 (TGS, G-Star 등)
- `anime`: 애니메이션 행사
- `doujin`: 동인 이벤트 (코미케, 예대제 등)
- `expo`: 일반 전시회
- `concert`: 콘서트/라이브

#### 태그 (tags) - 선택사항
- `offline` / `online` / `hybrid`
- `indie`, `corporate`, `fan-event`
- `exhibition`, `competition` 등

### 4.2 Event (확정 이벤트) - MongoDB Schema

```javascript
{
  eventId: "tgs-2026",  // unique
  title: "Tokyo Game Show 2026",
  description: "일본 최대 게임 전시회",  // 선택
  
  dates: {
    start: ISODate("2026-09-24"),
    end: ISODate("2026-09-27"),
    timezone: "Asia/Tokyo"
  },
  
  region: "jp",
  category: "game",
  tags: ["offline", "exhibition", "corporate"],
  
  location: {
    name: "Makuhari Messe",
    address: "千葉県千葉市美浜区...",
    isOnline: false
  },
  
  urls: {
    official: "https://tgs.nikkeibp.co.jp/",
    registration: "https://...",
    ticket: "https://..."
  },
  
  verification: {
    lastVerified: ISODate("2026-02-01"),
    source: "official_site"  // official_site, rss, manual
  },
  
  createdAt: ISODate("2026-01-10"),
  updatedAt: ISODate("2026-02-01")
}
```

### 4.3 EventCandidate (후보 이벤트) - MongoDB Schema

```javascript
{
  titleGuess: "Tokyo Game Show 2026",
  dateGuess: "2026-09",
  rawText: "2026年9月24日～27日開催決定！",  // 원본 텍스트
  
  sourceUrl: "https://...",
  sourceType: "rss",  // official_site, rss
  
  confidence: 0.8,  // 0.0 ~ 1.0
  
  // 매칭된 사전 정보
  matchedEventTemplate: "tgs",  // EventTemplate._id
  matchedVenue: "makuhari-messe",  // Venue._id
  
  status: "pending",  // pending, approved, rejected
  
  detectedAt: ISODate("2026-01-10"),
  reviewedAt: null,
  reviewedBy: null,
  
  createdAt: ISODate("2026-01-10"),
  updatedAt: ISODate("2026-01-10")
}
```

### 4.4 EventTemplate (행사 템플릿) - MongoDB Schema

```javascript
{
  _id: "tgs",
  name: "Tokyo Game Show",
  nameVariants: [
    "TGS",
    "東京ゲームショウ",
    "Tokyo Game Show"
  ],
  description: "일본 최대 규모의 게임 전시회",
  
  region: "jp",
  category: "game",
  defaultTags: ["offline", "exhibition", "corporate"],
  
  defaultVenue: "makuhari-messe",  // Venue._id
  
  urls: {
    official: "https://tgs.nikkeibp.co.jp/",
    twitter: "https://twitter.com/Tokyo_Game_Show"
  },
  
  // 자동 수집 소스
  sources: [
    {
      type: "official_site",
      url: "https://tgs.nikkeibp.co.jp/",
      selector: ".schedule-info"
    },
    {
      type: "rss",
      url: "https://nitter.poast.org/Tokyo_Game_Show/rss"
    }
  ],
  
  isActive: true,  // 수집 활성화 여부
  
  createdAt: ISODate("2026-01-10"),
  updatedAt: ISODate("2026-01-10")
}
```

### 4.5 Venue (장소) - MongoDB Schema

```javascript
{
  _id: "makuhari-messe",
  name: "Makuhari Messe",
  nameVariants: [
    "幕張メッセ",
    "makuhari messe",
    "Makuhari"
  ],
  
  address: "千葉県千葉市美浜区中瀬2-1",
  city: "Chiba",
  country: "JP",
  
  timezone: "Asia/Tokyo",
  
  isActive: true,
  
  createdAt: ISODate("2026-01-10"),
  updatedAt: ISODate("2026-01-10")
}
```

---

## 5. 자동 수집 설계

### 5.1 수집 대상 (우선순위)

**0순위: 사전 등록 정보** ⭐⭐ (자동 수집 정확도 향상)
- EventTemplate: 행사 이름, 일반 개최 시기, 공식 URL 등
- Venue: 장소 이름, 주소, 타임존 등
→ 자동 수집 시 매칭 및 자동 완성에 활용

**1순위: 공식 웹사이트** ⭐ (무료, 안정적)
- Tokyo Game Show 일정 페이지
- G-Star 공식 공지사항
- 코미케 공식 일정
- 각 게임사/출판사 공식 사이트
→ cheerio로 HTML 파싱
→ EventTemplate의 sources 정보 활용

**2순위: RSS 피드** (무료, Twitter API 대체)
- nitter를 통한 공식 X 계정 모니터링
- 일부 사이트의 공식 RSS
→ rss-parser 라이브러리 사용
→ EventTemplate의 sources에서 RSS URL 가져오기

**3순위: 수동 수집** (초기 데이터)
- 분기별로 주요 일정 검색 후 수동 등록
- 실제로 가장 확실한 방법

### 5.2 수집 방식

#### 사전 정보 매칭 (핵심 ⭐)
```javascript
// 1. 텍스트에서 행사명 찾기
const templates = await EventTemplate.find({ isActive: true });
const matchedTemplate = templates.find(t => 
  t.nameVariants.some(variant => 
    rawText.includes(variant)
  )
);

// 2. 장소명 찾기
const venues = await Venue.find({ isActive: true });
const matchedVenue = venues.find(v =>
  v.nameVariants.some(variant =>
    rawText.includes(variant)
  )
);

// 3. 신뢰도 계산
let confidence = 0.5;
if (matchedTemplate) confidence += 0.3;
if (matchedVenue) confidence += 0.1;
if (dateFound) confidence += 0.1;

// 4. 후보 생성 시 자동 완성
const candidate = {
  titleGuess: matchedTemplate ? matchedTemplate.name : extractedTitle,
  matchedEventTemplate: matchedTemplate?._id,
  matchedVenue: matchedVenue?._id,
  confidence
};
```

#### 공식 사이트 크롤링
```javascript
// EventTemplate의 sources 정보 활용
const template = await EventTemplate.findById('tgs');
const source = template.sources.find(s => s.type === 'official_site');

const $ = cheerio.load(html);
const scheduleText = $(source.selector).text();
const datePattern = /\d{4}年\d{1,2}月\d{1,2}日/;
```

#### nitter RSS 파싱 (Twitter API 대체)
```javascript
// EventTemplate의 RSS URL 사용
const template = await EventTemplate.findById('tgs');
const rssSource = template.sources.find(s => s.type === 'rss');

const feed = await parser.parseURL(rssSource.url);

// 날짜 패턴 탐지
const datePatterns = [
  /\d{4}年\d{1,2}月\d{1,2}日/,  // 2026年9月24日
  /\d{4}-\d{2}-\d{2}/,          // 2026-09-24
  /\d{1,2}\/\d{1,2}/,            // 9/24
];
```

#### 키워드 기반 탐색
- 개최 / 일정 / event / schedule / 開催
- 발売 / release / 公開

### 5.3 수집 주기 (무료 티어 기준)
- **공식 사이트**: 주 1회 (GitHub Actions)
- **RSS 체크**: 일 1회 (Vercel Cron 또는 GitHub Actions)
- **Twitter 직접 크롤링**: ❌ (API 비용 문제로 제외)

### 5.4 자동화 원칙
- 정확한 파싱 ❌
- 일정 *추정*만 수행
- DB에는 **후보로만 저장**
- 중복 방지: URL 기반 체크 + 제목 유사도
- **사전 정보 매칭**: EventTemplate과 Venue 활용
- **신뢰도 기반 우선순위**: confidence 높은 것부터 검토

### 5.5 에러 처리
- 사이트 접근 실패: 3회 재시도 후 스킵
- 파싱 실패: 로그 기록 후 스킵
- 일일 에러 요약: 콘솔 로그 (선택: 디스코드 알림)

---

## 6. 관리 대시보드

### 6.1 목적
- 자동 수집된 후보 일정 검토
- 최소한의 클릭으로 이벤트 등록

### 6.2 필수 기능
- 후보 일정 리스트 (status: pending)
  - **신뢰도순 정렬** (confidence 높은 것부터)
  - **매칭된 템플릿 표시** (예: "🎯 TGS로 추정")
- 공식 링크 바로가기
- 원본 텍스트 표시
- 승인 / 거절 버튼
- 날짜 및 제목 간단 수정
- 카테고리/태그 선택
- **매칭된 정보 자동 완성**
  - 템플릿 매칭 시 → 카테고리, 태그, 장소 자동 입력
  - 장소 매칭 시 → 주소, 타임존 자동 입력

### 6.3 비필수 요소
- 디자인 완성도
- 사용자 권한 관리
- 상세 로그 기록 UI

### 6.4 승인 프로세스
```
1. 후보 일정 확인 (신뢰도 높은 순)
2. 매칭된 템플릿 정보 확인 (있다면 자동 완성)
3. 공식 사이트 방문 (새 탭)
4. 정보 검증
5. 필요시 수정
6. 승인 → Event 컬렉션에 저장
   - 매칭된 템플릿/장소 정보 자동 반영
7. 거절 → status: rejected
```

---

## 6.5 관리자 기능 - 사전 정보 관리

### EventTemplate 관리
```
- 행사 목록 CRUD
- 이름 변형 추가/수정 (예: TGS, 東京ゲームショウ)
- 수집 소스 추가/수정 (URL, selector)
- 활성화/비활성화
```

### Venue 관리
```
- 장소 목록 CRUD
- 이름 변형 추가/수정
- 좌표 설정 (지도 연동 - 선택)
- 활성화/비활성화
```

### 우선 등록 항목 (Phase 1)
```
EventTemplate:
- Tokyo Game Show
- G-Star
- 코미켓
- AnimeJapan
- 예술의전당

Venue:
- Makuhari Messe (幕張メッセ)
- COEX (코엑스)
- Tokyo Big Sight (東京ビッグサイト)
- 예술의전당
```

---

## 7. API 설계

### 7.1 REST API (읽기 전용)

#### 엔드포인트
```
GET /events
  ?region=jp
  &category=game
  &from=2026-01-01
  &to=2026-12-31
  &tags=indie

GET /events/upcoming
  최근 ~ 3개월 이내 이벤트

GET /events/:eventId
  특정 이벤트 상세

GET /events/categories
  사용 가능한 카테고리 목록

GET /health
  API 상태 체크
```

#### 응답 예시
```json
{
  "success": true,
  "data": [
    {
      "eventId": "tgs-2026",
      "title": "Tokyo Game Show 2026",
      "dates": {
        "start": "2026-09-24T00:00:00.000Z",
        "end": "2026-09-27T23:59:59.000Z"
      },
      "region": "jp",
      "category": "game",
      "tags": ["offline", "exhibition"],
      "urls": {
        "official": "https://..."
      }
    }
  ],
  "count": 1
}
```

### 7.2 응답 특징
- JSON 포맷
- 인증 없음 (개인 사용 기준)
- Rate limit: 100 req/min (느슨하게)
- CORS: 필요시 특정 도메인만 허용

---

## 8. ICS 캘린더 설계

### 8.1 제공 엔드포인트

```
/calendar/all.ics         # 전체
/calendar/jp.ics          # 일본만
/calendar/kr.ics          # 한국만
/calendar/game.ics        # 게임만
/calendar/doujin.ics      # 동인만
/calendar/jp-game.ics     # 일본 게임
```

### 8.2 특징
- Google Calendar 연동
- 자동 동기화
- 읽기 전용
- ical-generator 라이브러리 사용

### 8.3 구현 예시
```javascript
const ical = require('ical-generator');

router.get('/calendar/all.ics', async (req, res) => {
  const events = await Event.find({ 'dates.start': { $gte: new Date() } });
  
  const calendar = ical({ name: 'Subculture Events' });
  
  events.forEach(event => {
    calendar.createEvent({
      start: event.dates.start,
      end: event.dates.end || event.dates.start,
      summary: event.title,
      description: event.description,
      url: event.urls.official,
      location: event.location.name
    });
  });
  
  res.type('text/calendar');
  res.send(calendar.toString());
});
```

---

## 9. 기술 스택

### 9.1 완전 무료 구성

| 영역 | 선택지 | 비용 | 제한사항 |
|----|------|------|----------|
| Backend | Node.js + Express | $0 | - |
| DB | **MongoDB Atlas (Free)** | $0 | 512MB |
| Hosting | Vercel (Hobby) | $0 | - |
| Cron | GitHub Actions | $0 | 2,000분/월 |
| Crawler | cheerio | $0 | - |
| RSS Parser | rss-parser | $0 | - |
| Twitter | nitter RSS | $0 | 공개 인스턴스 의존 |
| ICS | ical-generator | $0 | - |
| Dashboard | React / Next.js | $0 | - |
| Bot | discord.js | $0 | - |

### 9.2 MongoDB 선택 이유
✅ NoSQL - 스키마 유연함 (이벤트 구조에 최적)
✅ 배열/객체 쿼리 편함 (tags, dates)
✅ mongoose로 쉬운 개발
✅ 512MB = 수만 개 이벤트 저장 가능
✅ 무제한 API 호출

### 9.3 예상 용량
- 이벤트 1개 ≈ 1KB
- 10,000개 = 10MB
- 후보 포함해도 50MB 이하
→ **512MB로 충분**

---

## 10. 개발 일정 (예상)

### Phase 1 – 최소 동작 버전 (1~1.5일)
- [ ] MongoDB 연결 및 스키마 설정
  - Event, EventCandidate
  - **EventTemplate, Venue 스키마 추가**
- [ ] **사전 정보 등록**
  - 주요 행사 5개 EventTemplate 등록
  - 주요 장소 5개 Venue 등록
- [ ] 이벤트 수동 등록 API
- [ ] 간단한 등록 폼 (HTML)
- [ ] ICS 생성 (/calendar/all.ics)
- [ ] **테스트 데이터 5개 등록**

### Phase 2 – 실사용 버전 (2~3일)
- [ ] 자동 수집기 (1개 소스만)
  - 공식 사이트 크롤링 또는 RSS
  - **EventTemplate 기반 수집**
  - **사전 정보 매칭 로직**
- [ ] 후보 테이블 + 승인 UI
  - 신뢰도순 정렬
  - 매칭 정보 표시
  - 자동 완성 기능
- [ ] REST API 기본 엔드포인트
  - GET /events
  - GET /events/upcoming
- [ ] 카테고리별 ICS 생성
- [ ] **실제 일정 20개 이상 확보**

### Phase 3 – 확장 (필요시)
- [ ] **Template/Venue 관리 UI**
- [ ] 수집 소스 추가 (3~5개)
- [ ] 에러 알림 (디스코드)
- [ ] 디스코드 봇 연동
- [ ] 관리 대시보드 개선

---

## 11. 초기 데이터 소스

### Phase 1: 사전 정보 등록 (Template & Venue)

#### EventTemplate 우선 등록
```javascript
// 예시 데이터
[
  {
    _id: "tgs",
    name: "Tokyo Game Show",
    nameVariants: ["TGS", "東京ゲームショウ", "Tokyo Game Show"],
    description: "일본 최대 규모의 게임 전시회",
    region: "jp",
    category: "game",
    defaultVenue: "makuhari-messe",
    urls: {
      official: "https://tgs.nikkeibp.co.jp/",
      twitter: "https://twitter.com/Tokyo_Game_Show"
    }
  },
  {
    _id: "gstar",
    name: "G-Star",
    nameVariants: ["G-Star", "지스타", "G스타"],
    description: "대한민국 최대 게임 전시회",
    region: "kr",
    category: "game",
    defaultVenue: "coex",
    urls: {
      official: "https://www.gstar.or.kr/",
      twitter: "https://twitter.com/gstar_official"
    }
  },
  {
    _id: "comiket",
    name: "Comic Market",
    nameVariants: ["コミケット", "コミケ", "Comiket", "Comic Market"],
    description: "세계 최대 동인지 즉매회",
    region: "jp",
    category: "doujin",
    defaultVenue: "tokyo-big-sight",
    urls: {
      official: "https://www.comiket.co.jp/",
      twitter: "https://twitter.com/comiketofficial"
    }
  }
]
```

#### Venue 우선 등록
```javascript
[
  {
    _id: "makuhari-messe",
    name: "Makuhari Messe",
    nameVariants: ["幕張メッセ", "makuhari", "Makuhari"],
    address: "千葉県千葉市美浜区中瀬2-1",
    city: "Chiba",
    country: "JP",
    timezone: "Asia/Tokyo"
  },
  {
    _id: "coex",
    name: "COEX",
    nameVariants: ["코엑스", "COEX", "삼성동 코엑스"],
    address: "서울특별시 강남구 영동대로 513",
    city: "Seoul",
    country: "KR",
    timezone: "Asia/Seoul"
  },
  {
    _id: "tokyo-big-sight",
    name: "Tokyo Big Sight",
    nameVariants: ["東京ビッグサイト", "ビッグサイト", "Tokyo Big Sight"],
    address: "東京都江東区有明3-11-1",
    city: "Tokyo",
    country: "JP",
    timezone: "Asia/Tokyo"
  }
]
```

### Phase 2: 자동 수집 소스

#### 우선순위 높음
- [ ] Tokyo Game Show 공식 사이트
- [ ] G-Star 공식 사이트
- [ ] 코미케 공식 사이트

#### 우선순위 중간
- [ ] AnimeJapan
- [ ] 예대제 (예술의전당)
- [ ] 각 게임사 공식 X (nitter RSS)

### 수집 템플릿 작성
각 소스별 CSS Selector / XPath 미리 정리하여 EventTemplate.sources에 저장
```javascript
sources: [
  {
    type: "official_site",
    url: "https://tgs.nikkeibp.co.jp/",
    selector: ".schedule-info",
    dateSelector: ".event-date",
    enabled: true
  },
  {
    type: "rss",
    url: "https://nitter.poast.org/Tokyo_Game_Show/rss",
    enabled: true
  }
]
```

---

## 12. 유지보수 전략

### 12.1 보관 정책
- **과거 일정**: 1년간 보관 후 아카이브 (별도 컬렉션)
- **취소된 이벤트**: status="cancelled"로 유지 (삭제 ❌)
- **검증일 자동 갱신**: 수집 시 lastVerified 업데이트

### 12.2 데이터 품질 유지
- 공식 URL 필수 (없으면 등록 불가)
- 분기별 링크 체크 (404 확인) - 선택사항
- 자동 수정 요청은 받지 않음

### 12.3 백업
- MongoDB는 수동 백업 필요
- 주간 mongodump 실행 (GitHub Actions)
- JSON export로 저장

---

## 13. 모니터링 및 에러 처리

### 13.1 수집기 에러
- 사이트 접근 실패: 3회 재시도 후 스킵
- 파싱 실패: 로그 기록 후 스킵
- 일일 에러 요약: 콘솔 출력 (선택: 디스코드 알림)

### 13.2 데이터 품질
- 과거 날짜 이벤트 자동 거절
- 1년 이상 미래 이벤트 검토 플래그
- timezone 누락 시 기본값 설정 (Asia/Seoul)

### 13.3 모니터링
- Vercel 로그 확인
- MongoDB Atlas 메트릭
- 필요시 Sentry 무료 티어 (선택사항)

---

## 14. 최종 목표 정의

> 본 프로젝트는 서비스가 아닌 **개인 인프라**이며,
> 다른 프로젝트 및 자동화 시스템에서 재사용 가능한
> **공식 행사 일정 기준 데이터 소스**를 만드는 것을 목표로 한다.

### 핵심 가치
- ✅ 공식 정보만 수록
- ✅ 완전 무료 운영
- ✅ 최소한의 유지보수
- ✅ 확장 가능한 구조
- ✅ 다른 프로젝트 재사용

---

## 15. 체크리스트

### 기획
- [x] 전체 구조 설계
- [x] 데이터 스키마 정의
- [x] 기술 스택 선정
- [x] 무료 운영 방안 확정
- [x] 사전 정보 시스템 설계

### 구현
- [ ] Phase 1: MVP + 사전 정보 등록
- [ ] Phase 2: 자동화 + 매칭 시스템
- [ ] Phase 3: 실사용 및 확장

### 운영
- [ ] EventTemplate 10개 이상 등록
- [ ] Venue 10개 이상 등록
- [ ] 초기 데이터 20개 이상 확보
- [ ] 자동 수집 안정화
- [ ] 디스코드 봇 연동

---

**마지막 수정**: 2026-01-15
**버전**: 2.0