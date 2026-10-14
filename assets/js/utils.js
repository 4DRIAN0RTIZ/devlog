import { MONTHS_ES } from './config.js';

export const byId = (id) => document.getElementById(id);
export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);
export const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-');
export const day = (iso) => (iso ? String(iso).slice(0, 10) : '????-??-??');
export const safeUrl = (url) => (/^https:\/\//.test(url || '') ? url : '#');
export const ageInDays = (time) => (Date.now() - Date.parse(time)) / 86400000;
export const plural = (count, singular, pluralForm) => `${count} ${count === 1 ? singular : pluralForm}`;
export const monthLabel = (yearMonth) => `${MONTHS_ES[Number(yearMonth.slice(5, 7)) - 1]} ${yearMonth.slice(0, 4)}`;
export const monthShort = (yearMonth) => `${MONTHS_ES[Number(yearMonth.slice(5, 7)) - 1].slice(0, 3)} ${yearMonth.slice(2, 4)}`;

export function inlineMarkdown(text) {
	return escapeHtml(text)
		.replace(/\s*\(\[([0-9a-f]{7,40})\]\((https?:[^)\s]+)\)\)/g, ' <small>[<a href="$2">$1</a>]</small>')
		.replace(/`([^`]+)`/g, '<code>$1</code>')
		.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
		.replace(/\*([^*]+)\*/g, '<i>$1</i>')
		.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>');
}
