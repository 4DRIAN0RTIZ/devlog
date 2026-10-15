import { POLL_MS } from '../config.js';
import { byId, day, escapeHtml, monthShort, safeUrl, slug } from '../utils.js';
import { state } from '../state.js';

export function visibilityBadge(item) {
	if (item.private == null) return '';
	return item.private
		? ' <span class="vis priv" title="Repositorio privado">&#9632; PRIV</span>'
		: ' <span class="vis pub" title="Repositorio p&uacute;blico">&#9632; PUB</span>';
}

export function progressBar(stats) {
	if (!stats) return '';
	const progress = Math.max(0, Math.min(100, stats.progress));
	return `<table cellpadding="0" cellspacing="0"><tr><td style="border:0;padding:0"><div class="bar" role="progressbar" aria-label="Progreso del hito" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><div style="width:${progress}%"></div></div></td><td style="border:0;padding:0 0 0 6px;white-space:nowrap"><small>${progress}% (${stats.closedIssues}/${stats.totalIssues})</small></td></tr></table>`;
}

export function lastClosedHtml(item) {
	const closed = item.lastClosed;
	if (closed) return `&Uacute;ltimo cerrado: <a href="${escapeHtml(safeUrl(closed.url))}">#${closed.number} ${escapeHtml(closed.title)}</a> <i>(${day(closed.closedAt)})</i>`;
	const done = item.lastMilestone;
	return done ? `&Uacute;ltimo hito completado: <a href="${escapeHtml(safeUrl(done.url))}">${escapeHtml(done.title)}</a> <i>(${day(done.closedAt)})</i>` : '';
}

export function releaseHtml(release) {
	return release.sections.map((section) => `<h4>${escapeHtml(section.title)}</h4><ul>${section.items.map((item) => `<li>${item}</li>`).join('')}</ul>`).join('');
}

function sidebar(current) {
	const links = state.items.map((item) => {
		const itemSlug = slug(item.name);
		return itemSlug === current ? `<li><b>${escapeHtml(item.name)}</b></li>` : `<li><a href="#/t/${itemSlug}">${escapeHtml(item.name)}</a></li>`;
	}).join('');
	return `<h3>Navegaci&oacute;n</h3><ul><li><a href="#/">Inicio</a></li><li><a href="#/bitacora">Bit&aacute;cora</a></li><li><a href="#/panel">Panel de control</a></li></ul><h3>Herramientas</h3><ul>${links}</ul>`;
}

export function stamp() {
	const footer = byId('foot');
	footer.innerHTML = state.loadedOnce
		? `Actualizado el ${day(state.updatedAt.toISOString())} ${state.updatedAt.toTimeString().slice(0, 8)} &middot; refresco autom&aacute;tico cada ${POLL_MS / 1000} s${state.error ? ' &middot; <span style="color:#f00">sin conexi&oacute;n, mostrando datos anteriores</span>' : ''}`
		: 'Cargando...';
}

export function frame(subtitle, current, mainHtml) {
	const marquee = byId('marquee');
	const marqueeToggle = byId('marqueeToggle');
	const setMarqueePaused = (paused) => {
		marquee.dataset.paused = paused;
		if (paused) marquee.stop();
		else marquee.start();
		marqueeToggle.textContent = paused ? 'Reanudar desplazamiento' : 'Pausar desplazamiento';
	};
	marquee.textContent = subtitle;
	const hasPauseState = 'paused' in marquee.dataset;
	setMarqueePaused(hasPauseState ? marquee.dataset.paused === 'true' : window.matchMedia('(prefers-reduced-motion: reduce)').matches);
	marqueeToggle.onclick = () => setMarqueePaused(marquee.dataset.paused !== 'true');
	byId('side').innerHTML = sidebar(current);
	byId('main').innerHTML = mainHtml;
	stamp();
}

function matrixData(list) {
	const cells = {};
	let max = 1;
	list.forEach((entry) => {
		const key = `${entry.tool.name}|${entry.date.slice(0, 7)}`;
		cells[key] = (cells[key] || 0) + entry.count;
	});
	Object.values(cells).forEach((count) => { max = Math.max(max, count); });
	return { cells, level: (count) => (count === 0 ? 0 : Math.max(1, Math.ceil((4 * count) / max))) };
}

export function matrixTable(list, tools, months, options) {
	const matrix = matrixData(list);
	const filter = options.filter || {};
	const header = (label, hash) => options.linked ? `<th><a href="#/bitacora?${hash}">${escapeHtml(label)}</a></th>` : `<th>${escapeHtml(label)}</th>`;
	const head = `<tr><th></th>${months.map((month) => header(monthShort(month), `mes=${month}`)).join('')}</tr>`;
	const rows = tools.map((tool) => {
		const cells = months.map((month) => {
			const count = matrix.cells[`${tool.name}|${month}`] || 0;
			const selected = (filter.tool || filter.mes) && (!filter.tool || filter.tool === slug(tool.name)) && (!filter.mes || filter.mes === month);
			const content = count || '&middot;';
			const cell = options.linked && count ? `<a href="#/bitacora?herramienta=${escapeHtml(slug(tool.name))}&amp;mes=${month}">${content}</a>` : content;
			return `<td class="c l${matrix.level(count)}${selected ? ' sel' : ''}" title="${escapeHtml(`${tool.name} ${month}: ${count} cambios`)}">${cell}</td>`;
		}).join('');
		return `<tr>${header(tool.name, `herramienta=${slug(tool.name)}`)}${cells}</tr>`;
	}).join('');
	return `<table class="matrix">${head}${rows}</table><p class="legend"><small>Poco <span class="l0"></span><span class="l1"></span><span class="l2"></span><span class="l3"></span><span class="l4"></span> Mucho &middot; el n&uacute;mero es la cantidad de cambios</small></p>`;
}

export function postHtml(entry, linkTool) {
	const name = linkTool ? `<a href="#/t/${slug(entry.tool.name)}">${escapeHtml(entry.tool.name)}</a>` : escapeHtml(entry.tool.name);
	return `<div class="post"><div class="head"><b>${name}</b> v${escapeHtml(entry.release.version)} <small>&mdash; ${escapeHtml(entry.release.date || 'sin fecha')}</small></div><div class="body">${releaseHtml(entry.release)}</div></div>`;
}
