import { escapeHtml, safeUrl, slug } from '../utils.js';
import { state } from '../state.js';
import { frame, lastClosedHtml, progressBar, releaseHtml, visibilityBadge } from './shared.js';

export function renderTool(toolSlug) {
	const item = state.items.find((candidate) => slug(candidate.name) === toolSlug);
	if (!item) {
		frame('No encontrado', null, '<h2>No encontrado</h2><p><a href="#/">&lt;&lt; Volver al inicio</a></p>');
		return;
	}
	const log = state.logs[item.name];
	let body = '<p><i>Cargando changelog...</i></p>';
	if (log && !log.raw) body = '<p><i>Este repositorio no tiene CHANGELOG.md.</i></p>';
	else if (log && !log.releases.length) body = `<pre>${escapeHtml(log.raw)}</pre>`;
	else if (log) body = log.releases.map((release) => `<div class="post" id="v-${slug(release.version)}"><div class="head"><b>v${escapeHtml(release.version)}</b> <small>&mdash; ${escapeHtml(release.date || 'sin fecha')}</small></div><div class="body">${releaseHtml(release)}</div></div>`).join('');
	const toc = log?.releases.length ? `<h2>&Iacute;ndice de versiones</h2><ul>${log.releases.map((release) => `<li>v${escapeHtml(release.version)} <small>${escapeHtml(release.date || '')}</small></li>`).join('')}</ul>` : '';
	const closed = lastClosedHtml(item);
	frame(`${item.name} :: versión actual ${item.currentVersion || '-'} :: changelog completo`, slug(item.name),
		`<h2>${escapeHtml(item.name)}</h2><table class="data"><tr><th width="150">Versi&oacute;n actual</th><td>${escapeHtml(item.currentVersion || '-')}</td></tr><tr><th>Repositorio</th><td><a href="https://github.com/${escapeHtml(item.repo)}">${escapeHtml(item.repo)}</a>${visibilityBadge(item)}</td></tr><tr><th>Trabajando en</th><td>${escapeHtml(item.title)} <a href="${escapeHtml(safeUrl(item.url))}">[issue]</a></td></tr><tr><th>Hito</th><td>${escapeHtml(item.milestone)} ${progressBar(item.milestoneStats)}${closed ? `<br><small>${closed}</small>` : ''}</td></tr><tr><th>Estado</th><td>${escapeHtml(item.status)}${item.status === 'working' ? ' <span class="now">EN CURSO</span>' : ''}</td></tr></table>${toc}<h2>Changelog</h2>${body}<p><a href="#/">&lt;&lt; Volver al inicio</a></p>`);
}
