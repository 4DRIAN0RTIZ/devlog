import { entries, monthRange } from '../api.js';
import { escapeHtml, monthLabel, plural, slug } from '../utils.js';
import { state } from '../state.js';
import { frame, matrixTable, releaseHtml } from './shared.js';

export function renderLogbook(filter) {
	const list = entries();
	const months = monthRange(list);
	const active = { tool: filter.herramienta || '', mes: filter.mes || '' };
	const shown = list.filter((entry) => (!active.tool || slug(entry.tool.name) === active.tool) && (!active.mes || entry.date.slice(0, 7) === active.mes));
	const grouped = {};
	shown.sort((a, b) => b.date.localeCompare(a.date)).forEach((entry) => {
		const key = entry.date.slice(0, 7);
		(grouped[key] ||= []).push(entry);
	});
	const groups = Object.keys(grouped).sort().reverse().map((yearMonth, index) => {
		const releases = grouped[yearMonth];
		const total = releases.reduce((count, entry) => count + entry.count, 0);
		const posts = releases.map((entry) => `<div class="post"><div class="head"><span class="chip">${escapeHtml(entry.tool.name)}</span> <b>v${escapeHtml(entry.release.version)}</b> <small>&mdash; ${escapeHtml(entry.date)} &middot; ${entry.count} cambios &middot; <a href="#/t/${slug(entry.tool.name)}">ver en su p&aacute;gina</a></small></div><div class="body">${releaseHtml(entry.release)}</div></div>`).join('');
		return `<details class="month"${index === 0 || active.tool || active.mes ? ' open' : ''}><summary>${escapeHtml(monthLabel(yearMonth))} &mdash; ${plural(releases.length, 'lanzamiento', 'lanzamientos')}, ${total} cambios</summary>${posts}</details>`;
	}).join('');
	const bar = active.tool || active.mes ? `<div class="filterbar">Filtro: ${escapeHtml(active.tool || 'todas las herramientas')} / ${escapeHtml(active.mes || 'todos los meses')} &mdash; ${plural(shown.length, 'lanzamiento', 'lanzamientos')}. <a href="#/bitacora">[ limpiar filtro ]</a></div>` : '';
	frame('Bitácora :: toda mi actividad, herramienta por mes :: haz clic en una celda', null,
		`<h2>Bit&aacute;cora</h2><p>Cada celda es un mes de trabajo en una herramienta. Haz clic en una celda, en una herramienta o en un mes para filtrar la l&iacute;nea de tiempo.</p>${months.length ? matrixTable(list, state.items, months, { linked: true, filter: active }) : '<p><i>Cargando changelogs...</i></p>'}${bar}<h2>L&iacute;nea de tiempo</h2>${groups || '<p><i>Sin datos todav&iacute;a.</i></p>'}`);
}
