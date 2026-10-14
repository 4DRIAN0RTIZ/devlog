import { inlineMarkdown } from './utils.js';

const NOISE = /update changelog|\[skip ci\]/i;
const RELEASE_RE = /^##\s+\[?v?([0-9][^\]\s)]*|Unreleased)\]?\s*(?:[-–(]\s*)?(\d{4}-\d{2}-\d{2})?/i;

export function parseChangelog(markdown) {
	const releases = [];
	let release = null;
	let section = null;

	String(markdown || '').split('\n').forEach((rawLine) => {
		const line = rawLine.replace(/\s+$/, '');
		let match;
		if ((match = line.match(RELEASE_RE))) {
			release = { version: match[1], date: match[2] || null, sections: [] };
			releases.push(release);
			section = null;
		} else if (!release) {
			return;
		} else if ((match = line.match(/^###\s+(.*)$/))) {
			section = { title: match[1].trim(), items: [] };
			release.sections.push(section);
		} else if ((match = line.match(/^\s*[-*]\s+(.*)$/))) {
			if (NOISE.test(match[1])) return;
			if (!section) {
				section = { title: 'Cambios', items: [] };
				release.sections.push(section);
			}
			section.items.push(inlineMarkdown(match[1]));
		}
	});

	return releases
		.map((entry) => ({ ...entry, sections: entry.sections.filter((section) => section.items.length) }))
		.filter((entry) => entry.sections.length);
}

export const countItems = (release) => release.sections.reduce((count, section) => count + section.items.length, 0);
