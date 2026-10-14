import { FEED_SIZE } from '../config.js';
import { entries, monthRange } from '../api.js';
import { day, escapeHtml, plural, safeUrl, slug } from '../utils.js';
import { state } from '../state.js';
import { frame, lastClosedHtml, matrixTable, postHtml, progressBar, visibilityBadge } from './shared.js';

export function renderHome() {
	const list = entries();
	const working = state.items.filter((item) => item.status === 'working');
	const rows = state.items.map((item) => {
		const closed = lastClosedHtml(item);
		const subrow = closed ? `<tr class="sub"><td colspan="4">&#9492;&#9472; ${closed}</td></tr>` : '';
		return `<tbody><tr><td><b><a href="#/t/${slug(item.name)}">${escapeHtml(item.name)}</a></b>${item.status === 'working' ? ' <span class="now">EN CURSO</span>' : ''}${visibilityBadge(item)}</td><td>${escapeHtml(item.currentVersion || '-')}</td><td><a href="${escapeHtml(safeUrl(item.url))}">${escapeHtml(item.milestone)}</a><br>${progressBar(item.milestoneStats)}</td><td>${day(item.updatedAt)}</td></tr>${subrow}</tbody>`;
	}).join('');
	const recentMonths = monthRange(list).slice(-3);
	const recent = list.filter((entry) => recentMonths.includes(entry.date.slice(0, 7)));
	const feed = [...list].sort((a, b) => b.date.localeCompare(a.date)).slice(0, FEED_SIZE);

	frame(`Bienvenido a mi blog de trabajo :: ahora mismo trabajando en ${plural(working.length, 'proyecto', 'proyectos')} :: gracias por visitar`, null,
		`<h2>En lo que ando</h2><table class="data tools"><thead><tr><th>Herramienta</th><th width="70">Versi&oacute;n</th><th>Hito en curso</th><th width="95">Actualizado</th></tr></thead>${rows}</table><h2>Actividad reciente</h2>${recentMonths.length ? matrixTable(recent, state.items, recentMonths, { linked: false }) : '<p><i>Cargando changelogs...</i></p>'}<p><a href="#/bitacora">Ver bit&aacute;cora completa &gt;&gt;</a></p><h2>Novedades</h2><p><small>&Uacute;ltimos ${feed.length} lanzamientos de todas mis herramientas.</small></p>${feed.map((entry) => postHtml(entry, true)).join('') || '<p><i>Todav&iacute;a no hay publicaciones.</i></p>'}`);
}
