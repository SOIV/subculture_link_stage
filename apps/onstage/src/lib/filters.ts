// 행사 목록 화면(/events)의 검색·필터 조건. URL 쿼리스트링과 1:1로 대응한다:
// ?q=검색어&country=KR&event-format=exhibition&participation=offline&ticketing=paid&from=…&to=…
// 태그는 그룹 slug를 그대로 조건 이름으로 쓴다 — 그룹이 늘어나도 코드를 고치지 않아도 되도록.
export type ListFilters = {
	q: string;
	country: string;
	from: string;
	to: string;
	/** 태그 그룹 slug → 그 그룹에서 고른 태그 slug(안 골랐으면 키가 없다). */
	groups: Record<string, string>;
};

/** 폼에 입력된 값에서 비어 있는 조건을 뺀 쿼리스트링(앞의 ? 없이). 조건이 없으면 빈 문자열. */
export function formQuery(data: FormData): string {
	const params = new URLSearchParams();
	for (const [key, value] of data) {
		if (typeof value === 'string' && value.trim() !== '') params.set(key, value.trim());
	}
	return params.toString();
}

export function hasActiveFilters(filters: ListFilters): boolean {
	return Boolean(
		filters.q ||
		filters.country ||
		filters.from ||
		filters.to ||
		Object.values(filters.groups).some(Boolean)
	);
}
