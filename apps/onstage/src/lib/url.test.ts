import { describe, expect, it } from 'vitest';
import { safeExternalUrl } from './url';

describe('safeExternalUrl', () => {
	it('http·https만 링크로 쓴다', () => {
		expect(safeExternalUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
		expect(safeExternalUrl('http://example.com')).toBe('http://example.com/');
	});

	it.each([
		'javascript:alert(1)',
		' JavaScript:alert(1)',
		'data:text/html,hi',
		'vbscript:x',
		'/relative',
		'not a url',
		'',
		null,
		undefined
	])('%s는 링크로 만들지 않는다', (value) => {
		expect(safeExternalUrl(value)).toBeNull();
	});
});
