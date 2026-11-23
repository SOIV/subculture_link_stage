import { emptyList, listEvents, listTagGroups, orFallback, type EventSummary } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
	const { locale } = await parent();

	// 태그 그룹은 분류 바로가기와 카드의 태그 이름에만 쓰므로, 못 받아도 행사는 보여준다.
	const [events, tagGroups] = await Promise.all([
		listEvents(fetch, { locale }),
		orFallback(listTagGroups(fetch, locale), emptyList())
	]);

	// 추천 행사(광고) 데이터는 아직 없다. 자리(PromotedEvents 컴포넌트)만 마련해 두었고, 광고 등록·
	// 과금·표기 정책이 정해지면 여기서 API로 채운다(docs/plan/11-roadmap-and-success.md의
	// Phase 1 SCLS Onstage "Main HP" 항목 참고).
	const promoted: EventSummary[] = [];

	return { events, tagGroups, promoted };
};
