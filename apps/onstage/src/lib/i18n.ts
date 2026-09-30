// Onstage UI 문구(사이트 껍데기)의 다국어 사전. 행사 자체의 제목/요약/설명은 여기 없다 —
// 그건 API의 entity_localizations에서 오는 콘텐츠 번역이고(§06-i18n-translation-glossary.md),
// 이 파일은 "검색", "행사 없음" 같은 화면 문구만 다룬다. Backstage의 i18next와는 별개 개념
// (docs/plan/07-admin-dashboard.md §7.7 참고 — 거기는 관리자 UI, 여기는 공개 웹).

export const LOCALES = ['ko', 'ja', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ko';
// 기본 로케일은 URL에 접두사가 없다(/events/foo). 나머지만 접두사가 붙는다(/ja/events/foo).
export const PREFIXED_LOCALES = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

/** 언어 메뉴에는 각 언어를 그 언어 자신의 이름으로 보여준다(현재 화면 언어와 무관). */
export const LOCALE_NAMES: Record<Locale, string> = { ko: '한국어', ja: '日本語', en: 'English' };

const ko = {
	'site.name': 'Subculture Onstage',
	'site.tagline': '한국·일본·글로벌 서브컬처 행사 캘린더',
	'nav.events': '행사',

	'menu.settings': '설정',
	'menu.language': '언어',
	'menu.theme': '화면 모드',

	'theme.system': '시스템',
	'theme.light': '라이트',
	'theme.dark': '다크',

	'filter.all': '전체',
	'filter.country': '국가',
	'filter.country.KR': '한국',
	'filter.country.JP': '일본',
	'filter.from': '시작일 이후',
	'filter.to': '종료일 이전',
	'filter.reset': '초기화',

	'subscribe.title': '캘린더 구독',
	'subscribe.google': 'Google Calendar에 추가',
	'subscribe.webcal': '캘린더 앱에서 구독',
	'subscribe.copy': 'ICS 링크 복사',
	'subscribe.copied': '복사됨',

	'list.empty': '조건에 맞는 행사가 없습니다.',
	'list.count': '개 행사',
	'list.searchResults': '‘{q}’ 검색 결과',

	'card.online': '온라인',
	'card.venueUnknown': '장소 미정',
	'card.dateUnknown': '일정 미정',
	'card.next': '다음 일정',
	'card.inProgress': '진행 중',
	'card.today': '오늘',
	'card.dday': 'D-{n}',
	'card.moreSchedules': '일정 {n}개 더 보기',
	'card.autoTranslated': '자동 번역',

	'status.DRAFT': '준비 중',
	'status.CONFIRMED': '확정',
	'status.CANCELLED': '취소',
	'status.POSTPONED': '연기',
	'status.ENDED': '종료',
	'status.ARCHIVED': '보관됨',

	'schedule.EVENT_START': '행사 시작',
	'schedule.EVENT_END': '행사 종료',
	'schedule.TICKET_OPEN': '티켓 판매 시작',
	'schedule.TICKET_CLOSE': '티켓 판매 종료',
	'schedule.LOTTERY_OPEN': '추첨 접수 시작',
	'schedule.LOTTERY_CLOSE': '추첨 접수 마감',
	'schedule.LOTTERY_RESULT': '추첨 결과 발표',
	'schedule.REGISTRATION_OPEN': '참가 신청 시작',
	'schedule.REGISTRATION_CLOSE': '참가 신청 마감',
	'schedule.STREAM_START': '스트리밍 시작',
	'schedule.STREAM_END': '스트리밍 종료',
	'schedule.ARCHIVE_END': '다시보기 종료',
	'schedule.MERCH_OPEN': '굿즈 판매 시작',
	'schedule.MERCH_CLOSE': '굿즈 판매 종료',
	'schedule.ANNOUNCEMENT': '공지',

	'url.OFFICIAL_SITE': '공식 사이트',
	'url.TICKET': '티켓 구매',
	'url.STREAMING': '스트리밍',
	'url.SNS': 'SNS',
	'url.PRESS': '보도자료',
	'url.OTHER': '관련 링크',

	'group.event-format': '행사 형식',
	'group.participation': '참가 방식',
	'group.ticketing': '티켓 방식',

	'detail.venue': '장소',
	'detail.organizers': '주최',
	'detail.schedule': '일정',
	'detail.tags': '태그',
	'detail.links': '링크',
	'detail.backToList': '목록으로',
	'detail.noDescription': '아직 등록된 설명이 없습니다.',
	'detail.translationNotice': '자동 번역 포함 — 공식 출처와 다를 수 있습니다.',
	'detail.series': '시리즈',
	'detail.map': '지도에서 보기',

	'role.HOST': '주최',
	'role.CO_HOST': '공동 주최',
	'role.SPONSOR': '후원',
	'role.SUPERVISOR': '주관',

	'search.placeholder': '행사 이름 검색',
	'search.button': '검색',

	'home.hero.title': '서브컬처 행사 일정, 한 곳에서 캘린더로',
	'home.hero.desc':
		'한국·일본·글로벌 공식 행사를 티켓 오픈, 추첨 발표 일정까지 한 번에 확인하고 내 캘린더에 그대로 담아 가세요.',
	'home.upcoming': '곧 열리는 행사',
	'home.upcoming.empty': '예정된 행사가 없습니다.',
	'home.viewAll': '전체 행사 보기',
	'home.promoted': '추천 행사',
	'home.promoted.placeholder': '광고 자리 (개발 모드에서만 보입니다)',
	'home.schedules': '티켓·신청 일정',
	'home.schedules.desc': '앞으로 다가오는 티켓 오픈, 추첨, 신청 일정입니다.',
	'home.schedules.empty': '예정된 티켓·신청 일정이 없습니다.',
	'home.subscribe.title': '캘린더로 받아보기',
	'home.subscribe.desc': '한 번 구독해 두면 새 행사와 일정 변경이 내 캘린더에 자동으로 반영됩니다.',

	'ad.label': '광고',

	'footer.about': 'SCLS는 한국·일본·글로벌 서브컬처 및 게임 관련 공식 행사 정보를 모아 제공합니다.',
	'footer.sourceLink': '프로젝트 저장소',
	'footer.icsAll': '전체 일정 구독'
};

const ja: Record<keyof typeof ko, string> = {
	'site.name': 'Subculture Onstage',
	'site.tagline': '韓国・日本・グローバルのサブカルチャーイベントカレンダー',
	'nav.events': 'イベント',

	'menu.settings': '設定',
	'menu.language': '言語',
	'menu.theme': '表示モード',

	'theme.system': 'システム',
	'theme.light': 'ライト',
	'theme.dark': 'ダーク',

	'filter.all': 'すべて',
	'filter.country': '国',
	'filter.country.KR': '韓国',
	'filter.country.JP': '日本',
	'filter.from': '開始日以降',
	'filter.to': '終了日以前',
	'filter.reset': 'リセット',

	'subscribe.title': 'カレンダー購読',
	'subscribe.google': 'Googleカレンダーに追加',
	'subscribe.webcal': 'カレンダーアプリで購読',
	'subscribe.copy': 'ICSリンクをコピー',
	'subscribe.copied': 'コピーしました',

	'list.empty': '条件に合うイベントがありません。',
	'list.count': '件のイベント',
	'list.searchResults': '「{q}」の検索結果',

	'card.online': 'オンライン',
	'card.venueUnknown': '会場未定',
	'card.dateUnknown': '日程未定',
	'card.next': '次の予定',
	'card.inProgress': '開催中',
	'card.today': '今日',
	'card.dday': 'あと{n}日',
	'card.moreSchedules': '他{n}件の予定を見る',
	'card.autoTranslated': '自動翻訳',

	'status.DRAFT': '準備中',
	'status.CONFIRMED': '確定',
	'status.CANCELLED': '中止',
	'status.POSTPONED': '延期',
	'status.ENDED': '終了',
	'status.ARCHIVED': 'アーカイブ',

	'schedule.EVENT_START': '開催開始',
	'schedule.EVENT_END': '開催終了',
	'schedule.TICKET_OPEN': 'チケット販売開始',
	'schedule.TICKET_CLOSE': 'チケット販売終了',
	'schedule.LOTTERY_OPEN': '抽選受付開始',
	'schedule.LOTTERY_CLOSE': '抽選受付終了',
	'schedule.LOTTERY_RESULT': '抽選結果発表',
	'schedule.REGISTRATION_OPEN': '参加申込開始',
	'schedule.REGISTRATION_CLOSE': '参加申込締切',
	'schedule.STREAM_START': '配信開始',
	'schedule.STREAM_END': '配信終了',
	'schedule.ARCHIVE_END': '見逃し配信終了',
	'schedule.MERCH_OPEN': 'グッズ販売開始',
	'schedule.MERCH_CLOSE': 'グッズ販売終了',
	'schedule.ANNOUNCEMENT': 'お知らせ',

	'url.OFFICIAL_SITE': '公式サイト',
	'url.TICKET': 'チケット購入',
	'url.STREAMING': '配信視聴',
	'url.SNS': 'SNS',
	'url.PRESS': 'プレスリリース',
	'url.OTHER': '関連リンク',

	'group.event-format': '開催形式',
	'group.participation': '参加形式',
	'group.ticketing': 'チケット方式',

	'detail.venue': '会場',
	'detail.organizers': '主催',
	'detail.schedule': 'スケジュール',
	'detail.tags': 'タグ',
	'detail.links': 'リンク',
	'detail.backToList': '一覧に戻る',
	'detail.noDescription': 'まだ説明が登録されていません。',
	'detail.translationNotice': '自動翻訳を含みます — 公式情報と異なる場合があります。',
	'detail.series': 'シリーズ',
	'detail.map': '地図で見る',

	'role.HOST': '主催',
	'role.CO_HOST': '共同主催',
	'role.SPONSOR': '後援',
	'role.SUPERVISOR': '主管',

	'search.placeholder': 'イベント名で検索',
	'search.button': '検索',

	'home.hero.title': 'サブカルチャーイベントの日程を、ひとつのカレンダーに',
	'home.hero.desc':
		'韓国・日本・グローバルの公式イベントを、チケット発売や抽選発表の日程までまとめて確認。自分のカレンダーにそのまま取り込めます。',
	'home.upcoming': 'まもなく開催',
	'home.upcoming.empty': '予定されているイベントはありません。',
	'home.viewAll': 'すべてのイベントを見る',
	'home.promoted': 'おすすめイベント',
	'home.promoted.placeholder': '広告枠(開発モードでのみ表示されます)',
	'home.schedules': 'チケット・申込スケジュール',
	'home.schedules.desc': '今後のチケット発売・抽選・申込の日程です。',
	'home.schedules.empty': '予定されているチケット・申込の日程はありません。',
	'home.subscribe.title': 'カレンダーで受け取る',
	'home.subscribe.desc':
		'一度購読しておけば、新しいイベントや日程の変更がカレンダーに自動で反映されます。',

	'ad.label': '広告',

	'footer.about':
		'SCLSは韓国・日本・グローバルのサブカルチャー及びゲーム関連の公式イベント情報をまとめて提供します。',
	'footer.sourceLink': 'プロジェクトリポジトリ',
	'footer.icsAll': '全イベントを購読'
};

const en: Record<keyof typeof ko, string> = {
	'site.name': 'Subculture Onstage',
	'site.tagline': 'A calendar for Korean, Japanese, and global subculture events',
	'nav.events': 'Events',

	'menu.settings': 'Settings',
	'menu.language': 'Language',
	'menu.theme': 'Appearance',

	'theme.system': 'System',
	'theme.light': 'Light',
	'theme.dark': 'Dark',

	'filter.all': 'All',
	'filter.country': 'Country',
	'filter.country.KR': 'Korea',
	'filter.country.JP': 'Japan',
	'filter.from': 'From',
	'filter.to': 'To',
	'filter.reset': 'Reset',

	'subscribe.title': 'Subscribe',
	'subscribe.google': 'Add to Google Calendar',
	'subscribe.webcal': 'Subscribe in calendar app',
	'subscribe.copy': 'Copy ICS link',
	'subscribe.copied': 'Copied',

	'list.empty': 'No events match these filters.',
	'list.count': ' events',
	'list.searchResults': 'Results for “{q}”',

	'card.online': 'Online',
	'card.venueUnknown': 'Venue TBA',
	'card.dateUnknown': 'Date TBA',
	'card.next': 'Next',
	'card.inProgress': 'Happening now',
	'card.today': 'Today',
	'card.dday': 'in {n} days',
	'card.moreSchedules': '{n} more dates',
	'card.autoTranslated': 'Auto-translated',

	'status.DRAFT': 'Draft',
	'status.CONFIRMED': 'Confirmed',
	'status.CANCELLED': 'Cancelled',
	'status.POSTPONED': 'Postponed',
	'status.ENDED': 'Ended',
	'status.ARCHIVED': 'Archived',

	'schedule.EVENT_START': 'Event starts',
	'schedule.EVENT_END': 'Event ends',
	'schedule.TICKET_OPEN': 'Ticket sales open',
	'schedule.TICKET_CLOSE': 'Ticket sales close',
	'schedule.LOTTERY_OPEN': 'Lottery entry opens',
	'schedule.LOTTERY_CLOSE': 'Lottery entry closes',
	'schedule.LOTTERY_RESULT': 'Lottery results',
	'schedule.REGISTRATION_OPEN': 'Registration opens',
	'schedule.REGISTRATION_CLOSE': 'Registration closes',
	'schedule.STREAM_START': 'Stream starts',
	'schedule.STREAM_END': 'Stream ends',
	'schedule.ARCHIVE_END': 'Archive viewing ends',
	'schedule.MERCH_OPEN': 'Merch sales open',
	'schedule.MERCH_CLOSE': 'Merch sales close',
	'schedule.ANNOUNCEMENT': 'Announcement',

	'url.OFFICIAL_SITE': 'Official site',
	'url.TICKET': 'Buy tickets',
	'url.STREAMING': 'Watch stream',
	'url.SNS': 'SNS',
	'url.PRESS': 'Press release',
	'url.OTHER': 'Related link',

	'group.event-format': 'Event format',
	'group.participation': 'Participation',
	'group.ticketing': 'Ticketing',

	'detail.venue': 'Venue',
	'detail.organizers': 'Organizers',
	'detail.schedule': 'Schedule',
	'detail.tags': 'Tags',
	'detail.links': 'Links',
	'detail.backToList': 'Back to list',
	'detail.noDescription': 'No description yet.',
	'detail.translationNotice': 'Includes machine translation — may differ from the official source.',
	'detail.series': 'Series',
	'detail.map': 'View on map',

	'role.HOST': 'Host',
	'role.CO_HOST': 'Co-host',
	'role.SPONSOR': 'Sponsor',
	'role.SUPERVISOR': 'Supervisor',

	'search.placeholder': 'Search events',
	'search.button': 'Search',

	'home.hero.title': 'Subculture event dates, all in one calendar',
	'home.hero.desc':
		'Official events in Korea, Japan and beyond — including ticket sales and lottery results — ready to add to your own calendar.',
	'home.upcoming': 'Coming up',
	'home.upcoming.empty': 'No upcoming events.',
	'home.viewAll': 'View all events',
	'home.promoted': 'Featured events',
	'home.promoted.placeholder': 'Ad slot (visible in development mode only)',
	'home.schedules': 'Tickets & sign-ups',
	'home.schedules.desc': 'Upcoming ticket sales, lotteries and sign-up dates.',
	'home.schedules.empty': 'No upcoming ticket or sign-up dates.',
	'home.subscribe.title': 'Get it in your calendar',
	'home.subscribe.desc':
		'Subscribe once and new events and schedule changes show up in your calendar automatically.',

	'ad.label': 'Ad',

	'footer.about':
		'SCLS collects official subculture and game event information across Korea, Japan, and worldwide.',
	'footer.sourceLink': 'Project repository',
	'footer.icsAll': 'Subscribe to all events'
};

const dictionaries: Record<Locale, Record<string, string>> = { ko, ja, en };

export type MessageKey = keyof typeof ko;

// key는 보통 MessageKey 리터럴이지만, status.${status}처럼 API 값을 그대로 이어붙여
// 만드는 동적 키도 받는다 — 그런 값은 문자열 리터럴 유니언으로 좁힐 수 없어서 string도 허용한다.
// 사전에 없는 키는 마지막 수단으로 키 자체를 보여준다(문구가 통째로 빠지는 것보다 낫다).
export function t(locale: Locale, key: MessageKey | (string & {})): string {
	return dictionaries[locale]?.[key] ?? ko[key as MessageKey] ?? key;
}

/** "D-{n}"처럼 {이름} 자리표시자가 들어 있는 문구에 값을 채운다. 값이 없는 자리표시자는 그대로 둔다. */
export function tv(
	locale: Locale,
	key: MessageKey | (string & {}),
	vars: Record<string, string | number>
): string {
	return t(locale, key).replace(/\{(\w+)\}/g, (match, name: string) =>
		name in vars ? String(vars[name]) : match
	);
}

/** 로케일이 붙지 않은 절대 경로(예: '/events/agf-2026')를 그 로케일의 실제 경로로 바꾼다. */
export function localeHref(locale: Locale, path: string): string {
	return locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;
}

/** 현재 경로에서 로케일 접두사를 떼어낸 "로케일 없는" 경로를 돌려준다. */
export function stripLocale(pathname: string): string {
	for (const locale of PREFIXED_LOCALES) {
		if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
			return pathname.slice(locale.length + 1) || '/';
		}
	}
	return pathname;
}
