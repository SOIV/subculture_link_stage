import { listEvents, listTagGroups, type EventSummary } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
	const { locale } = await parent();

	const [events, tagGroups] = await Promise.all([
		listEvents(fetch, { locale }),
		listTagGroups(fetch, locale)
	]);

	// 추천 행사(광고) 데이터는 아직 없다. 자리(PromotedEvents 컴포넌트)만 마련해 두었고, 광고 등록·
	// 과금·표기 정책이 정해지면 여기서 API로 채운다(docs/plan/11-roadmap-and-success.md의
	// Phase 1 Subculture Onstage "Main HP" 항목 참고).
	const promoted: EventSummary[] = [];

	return { events, tagGroups, promoted };
};
