---
title: 행사 API 빠른 시작
description: 행사 목록과 티켓 정보를 조회합니다. 캘린더 구독은 ICS 피드를 사용합니다.
---

행사 목록과 티켓 정보를 조회합니다. 캘린더 구독은 ICS 피드를 사용합니다.

한국·일본 행사 검색. 티켓 정보. 캘린더 구독.

## GET /v1/events

`country`, `tags`, `from`, `to`, `q`, `locale`

```js
const response = await fetch('http://127.0.0.1:4310/v1/events?country=JP&locale=ja');
const result = await response.json();
```

[API 레퍼런스](/ko/api/)

[relative-url-probe](subscription/)

[relative-file-probe](./subscription.md)
