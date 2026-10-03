// 캘린더 구독 링크. 일반 https .ics 링크는 대부분의 기기에서 "한 번 가져오기"가 되어 이후 일정이 바뀌어도
// 반영되지 않는다. 구독(앱이 주소를 기억하고 주기적으로 다시 읽기)을 하려면 앱마다 다른 링크를 써야 한다
// (docs/plan/08-api-and-ics.md §8.6.4).
export type SubscribeLinks = {
	/** 그대로 받으면 일회성 가져오기가 되는 https 주소. "주소 복사"와 "파일 받기"에 쓴다. */
	https: string;
	/** Apple 캘린더(iPhone·iPad·Mac): 누르면 캘린더 앱이 구독 여부를 묻는다. */
	webcal: string;
	/** Google 캘린더: 웹에서 열려 캘린더 추가를 묻는다. */
	google: string;
	/** Outlook(웹)에서 구독 추가. */
	outlook: string;
};

export function subscribeLinks(httpsUrl: string, calendarName: string): SubscribeLinks {
	const webcal = httpsUrl.replace(/^https?:/, 'webcal:');
	return {
		https: httpsUrl,
		webcal,
		google: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`,
		outlook: `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(httpsUrl)}&name=${encodeURIComponent(calendarName)}`
	};
}

/** iPhone·iPad·Mac이면 true. iPadOS는 Mac으로 보고하므로 "Macintosh"도 포함한다. */
export function isAppleDevice(userAgent: string): boolean {
	return /iPhone|iPad|iPod|Macintosh/.test(userAgent);
}
