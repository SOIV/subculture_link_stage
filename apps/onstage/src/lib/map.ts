import type { EventVenueDetail } from './api';

export type MapProvider = 'naver' | 'kakao' | 'google';
export type MapLink = { provider: MapProvider; href: string };

// 한국에서는 구글 지도의 장소·길찾기 정보가 부족해서 대부분 네이버 지도나 카카오맵을 쓴다. 그래서 한국 행사장은
// 세 곳을 다 걸고(네이버 → 카카오 → 구글), 해외 행사장은 네이버·카카오가 거의 쓸모없으므로 구글만 건다.
export function venueMapLinks(
	venue: EventVenueDetail | null,
	countryCode: string | null
): MapLink[] {
	if (!venue) return [];
	const hasCoords = venue.latitude != null && venue.longitude != null;
	// 주소가 있으면 주소로 찾는 편이 정확하다(행사장 이름은 "○○홀"처럼 지도 앱에 그대로 없는 경우가 있다).
	const query = venue.address ?? venue.name;

	const google = hasCoords
		? `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`
		: venue.address
			? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`
			: null;

	if (countryCode !== 'KR') return google ? [{ provider: 'google', href: google }] : [];

	// 카카오맵은 좌표에 이름표를 붙여 바로 핀을 꽂는 공식 링크가 있다. 이름에 쉼표가 있으면 구분자와 섞이므로 뺀다.
	const kakao = hasCoords
		? `https://map.kakao.com/link/map/${encodeURIComponent(venue.name.replaceAll(',', ' '))},${venue.latitude},${venue.longitude}`
		: `https://map.kakao.com/link/search/${encodeURIComponent(query)}`;
	// 네이버 지도는 좌표로 핀을 꽂는 공개 링크가 없어서 검색 링크를 쓴다.
	const naver = `https://map.naver.com/p/search/${encodeURIComponent(query)}`;

	return [
		{ provider: 'naver', href: naver },
		{ provider: 'kakao', href: kakao },
		...(google ? [{ provider: 'google' as const, href: google }] : [])
	];
}
