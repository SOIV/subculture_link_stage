// 태그 그룹(/tags 응답)을 화면에서 쓰기 좋은 모양으로 바꾸는 도우미. 행사 응답의 tags는 slug 배열뿐이라
// 이름·그룹·상하위 관계는 여기서 만든 색인으로 찾는다.
import type { EventSummary, Tag, TagGroup } from './api';

export type TagInfo = {
	slug: string;
	name: string;
	groupSlug: string;
	/** 같은 그룹 안의 상위 태그 slug. 최상위면 null. */
	parentSlug: string | null;
};

/** slug → 태그 정보. 삽입 순서는 API가 준 그룹·태그 순서를 그대로 따른다. */
export type TagIndex = Map<string, TagInfo>;

export type TagOption = { slug: string; name: string; depth: number };

export function buildTagIndex(groups: TagGroup[]): TagIndex {
	const index: TagIndex = new Map();
	for (const group of groups) {
		const slugById = new Map(group.tags.map((tag) => [tag.id, tag.slug]));
		for (const tag of group.tags) {
			index.set(tag.slug, {
				slug: tag.slug,
				name: tag.name,
				groupSlug: group.slug,
				parentSlug: tag.parentTagId ? (slugById.get(tag.parentTagId) ?? null) : null
			});
		}
	}
	return index;
}

/**
 * 드롭다운에 넣을 옵션. 상위 태그 바로 뒤에 그 하위 태그가 오도록 트리 순서로 펼치고,
 * depth로 들여쓰기를 준다. 부모가 이 그룹에 없는 태그(비활성 등)는 최상위로 취급한다.
 */
export function tagOptions(group: TagGroup): TagOption[] {
	const ids = new Set(group.tags.map((tag) => tag.id));
	const children = new Map<string | null, Tag[]>();
	for (const tag of group.tags) {
		const parentId = tag.parentTagId && ids.has(tag.parentTagId) ? tag.parentTagId : null;
		children.set(parentId, [...(children.get(parentId) ?? []), tag]);
	}

	const options: TagOption[] = [];
	const walk = (parentId: string | null, depth: number) => {
		for (const tag of children.get(parentId) ?? []) {
			options.push({ slug: tag.slug, name: tag.name, depth });
			walk(tag.id, depth + 1);
		}
	};
	walk(null, 0);
	return options;
}

/** 태그 자신과 그 아래 모든 하위 태그의 slug. */
export function withDescendants(index: TagIndex, slug: string): Set<string> {
	const result = new Set<string>([slug]);
	let grew = true;
	while (grew) {
		grew = false;
		for (const info of index.values()) {
			if (info.parentSlug && result.has(info.parentSlug) && !result.has(info.slug)) {
				result.add(info.slug);
				grew = true;
			}
		}
	}
	return result;
}

/**
 * 카드에 보여줄 분류 칩. 하위 태그가 함께 붙어 있으면 상위 태그(예: 전시)는 빼고 가장 구체적인 태그
 * (산업 전시)만 남긴다. 순서는 그룹 순서(행사 형식 → 참가 방식 → 티켓 방식)를 따르고, max를
 * 넘는 만큼은 hidden 개수로 돌려준다.
 */
export function pickCardTags(
	eventTags: string[],
	index: TagIndex,
	max: number
): { shown: TagInfo[]; hidden: number } {
	const present = new Set(eventTags.filter((slug) => index.has(slug)));
	for (const slug of [...present]) {
		let parent = index.get(slug)?.parentSlug;
		while (parent) {
			present.delete(parent);
			parent = index.get(parent)?.parentSlug;
		}
	}
	const ordered = [...index.values()].filter((info) => present.has(info.slug));
	return { shown: ordered.slice(0, max), hidden: Math.max(0, ordered.length - max) };
}

/**
 * 그룹의 최상위 태그 중 실제로 행사가 붙어 있는 것만(하위 태그에 붙은 행사도 센다). 메인 페이지
 * 바로가기 칩이 결과가 하나도 없는 조건으로 연결되지 않게 하려는 것이다.
 */
export function topTagsWithEvents(group: TagGroup, index: TagIndex, events: EventSummary[]): Tag[] {
	const used = new Set(events.flatMap((event) => event.tags));
	const ids = new Set(group.tags.map((tag) => tag.id));
	return group.tags
		.filter((tag) => !tag.parentTagId || !ids.has(tag.parentTagId))
		.filter((tag) => [...withDescendants(index, tag.slug)].some((slug) => used.has(slug)));
}
