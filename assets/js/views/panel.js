import { entries } from '../api.js';
import { addCleanup, state } from '../state.js';
import { ageInDays, byId, escapeHtml, safeUrl } from '../utils.js';
import { frame } from './shared.js';

export function renderPanel() {
	frame('Panel de control :: instrumentos, medidores y adivinanzas con los datos de /activity', null,
		'<h2>Estado general</h2><table><tr><td><div class="lights" id="lights"></div></td><td><div class="clippy" id="clippy"></div></td></tr></table><h2>V&uacute;metro de progreso</h2><div class="vu" id="vu"></div><h2>Mascotas</h2><p><small>Su &aacute;nimo depende de hace cu&aacute;nto las toqu&eacute;.</small></p><div class="tamas" id="tamas"></div><h2>Reloj desde el &uacute;ltimo toque</h2><table class="data clock" id="clock"></table><h2>Radar</h2><p><small>Cerca del centro = reciente. Amarillo parpadeante = en curso.</small></p><div id="radar"></div><h2>Desfragmentador e instalador</h2><p>Hito de: <select id="tool"></select> <button id="defragBtn" type="button">Desfragmentar</button> <small id="defragInfo"></small></p><div class="defrag" id="defrag"></div><p><small id="instMsg"></small></p><div class="inst"><div id="instBar"></div></div><h2>Tabla ordenable</h2><p>Filtrar: <input id="q" type="text" size="20"> <small>(clic en una cabecera para ordenar)</small></p><table class="data sortable" id="sortable"></table><h2>Desde tu &uacute;ltima visita</h2><div id="diff"></div><h2>&iquest;Cu&aacute;ndo termina?</h2><p><small>C&aacute;lculo ingenuo: issues cerrados &divide; d&iacute;as desde el primer release.</small></p><table class="data" id="eta"></table><h2>Nube de pendientes</h2><p><small>Tama&ntilde;o = issues abiertos en el hito.</small></p><div class="cloud" id="cloud"></div>');
	initPanel();
}

function initPanel() {
	const firstRelease = {};
	entries().forEach((entry) => { if (!firstRelease[entry.tool.name] || entry.date < firstRelease[entry.tool.name]) firstRelease[entry.tool.name] = entry.date; });
	const tools = state.items.map((item) => ({
		name: item.name, version: item.currentVersion, working: item.status === 'working', milestone: item.milestone,
		updatedAt: item.updatedAt, url: safeUrl(item.url), firstRelease: firstRelease[item.name] || null,
		stats: item.milestoneStats ? { closed: item.milestoneStats.closedIssues, open: item.milestoneStats.openIssues, total: item.milestoneStats.totalIssues, progress: item.milestoneStats.progress } : null,
	}));
	const now = Date.now();
	const DAY = 86400000;
	const progress = (tool) => tool.stats ? tool.stats.progress : 0;
	const openIssues = (tool) => tool.stats ? tool.stats.open : 0;
	const age = (date) => (now - Date.parse(date)) / DAY;
	const ago = (milliseconds) => {
		const seconds = Math.max(0, Math.floor(milliseconds / 1000));
		return `${Math.floor(seconds / 86400)}d ${Math.floor(seconds % 86400 / 3600)}h ${Math.floor(seconds % 3600 / 60)}m ${seconds % 60}s`;
	};

	const activeCount = tools.filter((tool) => tool.working).length;
	const lightClass = activeCount >= 3 ? 'on-g' : activeCount >= 1 ? 'on-a' : 'on-r';
	byId('lights').innerHTML = ['on-r', 'on-a', 'on-g'].map((name) => `<i class="${name === lightClass ? name : ''}"></i>`).join('');
	byId('clippy').innerHTML = activeCount > 5
		? `<b>Parece que intentas hacer demasiado.</b><br>Hoy hay ${activeCount} proyectos en marcha a la vez. &iquest;Quieres que te ayude a elegir uno?`
		: `<b>Buen foco.</b><br>${activeCount === 0 ? 'Hoy no hay proyectos en marcha.' : activeCount === 1 ? 'Hoy hay 1 proyecto en marcha.' : `Hoy hay ${activeCount} proyectos en marcha.`} Sigue as&iacute;.`;

	byId('vu').innerHTML = tools.map((tool) => `<div class="col"><div class="bar2" data-h="${progress(tool)}"></div>${progress(tool)}%<br>${escapeHtml(tool.name.slice(0, 8))}</div>`).join('');
	const barTimeout = setTimeout(() => document.querySelectorAll('.bar2').forEach((bar) => { bar.style.height = `${bar.dataset.h}%`; }), 100);
	addCleanup(() => clearTimeout(barTimeout));

	const mood = (days) => days <= 3 ? ['(^o^)', 'feliz'] : days <= 10 ? ['(-_-)', 'tranquilo'] : days <= 30 ? ['(u_u)', 'aburrido'] : ['(-.-)zZ', 'dormido'];
	byId('tamas').innerHTML = tools.map((tool) => { const currentMood = mood(age(tool.updatedAt)); return `<div class="tama">${escapeHtml(tool.name)}<b>${currentMood[0]}</b>${currentMood[1]}</div>`; }).join('');

	byId('clock').innerHTML = `<tr><th>Herramienta</th><th>Desde el &uacute;ltimo toque</th></tr>${tools.map((tool, index) => `<tr><td>${escapeHtml(tool.name)}</td><td class="age" id="age${index}"></td></tr>`).join('')}`;
	const tick = () => tools.forEach((tool, index) => {
		const cell = byId(`age${index}`); if (!cell) return;
		const days = (Date.now() - Date.parse(tool.updatedAt)) / DAY;
		cell.textContent = ago(Date.now() - Date.parse(tool.updatedAt));
		cell.style.color = days <= 3 ? '#080' : days <= 10 ? '#880' : days <= 30 ? '#c60' : '#c00';
	});
	tick();
	const clockInterval = setInterval(tick, 1000);
	addCleanup(() => clearInterval(clockInterval));

	const radius = 140, center = 160;
	let radar = '<svg width="320" height="320" style="background:#001a00;border:2px inset #888">';
	[7, 30, 60].forEach((days) => { const distance = 10 + (days / 60) * radius; radar += `<circle cx="${center}" cy="${center}" r="${distance}" fill="none" stroke="#0a0"/><text x="${center + distance - 18}" y="${center - 3}" fill="#0a0" font-size="9">${days}d</text>`; });
	radar += `<line x1="${center}" y1="${center}" x2="${center}" y2="${center - radius - 10}" stroke="#0f0" stroke-width="2"><animateTransform attributeName="transform" type="rotate" from="0 ${center} ${center}" to="360 ${center} ${center}" dur="4s" repeatCount="indefinite"/></line>`;
	tools.forEach((tool, index) => {
		const distance = 10 + (Math.min(age(tool.updatedAt), 60) / 60) * radius;
		const angle = index * 2 * Math.PI / Math.max(1, tools.length);
		const x = center + distance * Math.cos(angle), y = center + distance * Math.sin(angle);
		radar += `<circle cx="${x}" cy="${y}" r="4" fill="${tool.working ? '#ff0' : '#0f0'}">${tool.working ? '<animate attributeName="r" values="3;8;3" dur="1.4s" repeatCount="indefinite"/>' : ''}<title>${escapeHtml(tool.name)} - ${Math.round(age(tool.updatedAt))} d</title></circle><text x="${x + 6}" y="${y + 3}" fill="#0f0" font-size="9">${escapeHtml(tool.name)}</text>`;
	});
	byId('radar').innerHTML = `${radar}</svg>`;

	initDefragmenter(tools);
	initSortableTable(tools, progress, openIssues, age);
	initVisitDiff(tools);
	initEta(tools, age, now, DAY);
	const maxOpen = Math.max(...tools.map(openIssues), 1);
	byId('cloud').innerHTML = tools.map((tool) => `<a href="${escapeHtml(tool.url)}" style="font-size:${Math.round(11 + 26 * openIssues(tool) / maxOpen)}px">${escapeHtml(tool.name)}</a>`).join(' ');
}

function initDefragmenter(tools) {
	const selector = byId('tool');
	selector.innerHTML = tools.filter((tool) => tool.stats).map((tool) => `<option value="${escapeHtml(tool.name)}">${escapeHtml(tool.name)}</option>`).join('');
	let sorted = [], shuffled = [], timer = null;
	const paint = (blocks) => { byId('defrag').innerHTML = blocks.map((block) => `<i class="${block ? 'd' : ''}"></i>`).join(''); };
	const pick = () => {
		const tool = tools.find((candidate) => candidate.name === selector.value); if (!tool) return;
		const { stats } = tool, total = Math.min(stats.total, 300), closed = Math.round(total * stats.closed / Math.max(1, stats.total));
		sorted = Array.from({ length: total }, (_, index) => index < closed ? 1 : 0);
		shuffled = [...sorted].sort(() => Math.random() - 0.5);
		paint(shuffled);
		byId('defragInfo').textContent = `${tool.milestone}: ${stats.closed} cerrados, ${stats.open} abiertos`;
		const bar = byId('instBar'); bar.style.transition = 'none'; bar.style.width = '0';
		setTimeout(() => { bar.style.transition = ''; bar.style.width = `${stats.progress}%`; }, 50);
		byId('instMsg').textContent = `Instalando "${tool.milestone}"... copiando ${stats.closed}/${stats.total} issues (${stats.progress}%)`;
	};
	byId('defragBtn').onclick = () => { let index = 0; clearInterval(timer); timer = setInterval(() => { index += 6; paint(sorted.slice(0, index).concat(shuffled.slice(index))); if (index >= sorted.length) clearInterval(timer); }, 40); };
	addCleanup(() => clearInterval(timer));
	selector.onchange = pick;
	pick();
}

function initSortableTable(tools, progress, openIssues, age) {
	const columns = [['Herramienta', (tool) => tool.name.toLowerCase()], ['Versión', (tool) => tool.version || ''], ['Progreso', progress], ['Abiertos', openIssues], ['Días sin tocar', (tool) => age(tool.updatedAt)]];
	let sortColumn = 4, sortDirection = -1;
	const draw = () => {
		const query = byId('q').value.toLowerCase();
		const rows = tools.filter((tool) => tool.name.toLowerCase().includes(query)).sort((left, right) => (columns[sortColumn][1](left) > columns[sortColumn][1](right) ? 1 : columns[sortColumn][1](left) < columns[sortColumn][1](right) ? -1 : 0) * sortDirection);
		byId('sortable').innerHTML = `<tr>${columns.map((column, index) => `<th data-i="${index}">${column[0]}${index === sortColumn ? (sortDirection > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr>${rows.map((tool) => `<tr><td>${escapeHtml(tool.name)}</td><td>${escapeHtml(tool.version || '-')}</td><td>${progress(tool)}%</td><td>${openIssues(tool)}</td><td>${age(tool.updatedAt).toFixed(1)}</td></tr>`).join('')}`;
	};
	byId('sortable').onclick = (event) => { const index = event.target.getAttribute?.('data-i'); if (index == null) return; const numericIndex = Number(index); sortDirection = numericIndex === sortColumn ? -sortDirection : 1; sortColumn = numericIndex; draw(); };
	byId('q').oninput = draw;
	draw();
}

function initVisitDiff(tools) {
	let output = '';
	try {
		const previous = JSON.parse(localStorage.getItem('devlog:versions') || 'null');
		const current = Object.fromEntries(tools.map((tool) => [tool.name, tool.version || '-']));
		if (!previous) output = 'Primera visita. Guard&eacute; el estado: la pr&oacute;xima vez te mostrar&eacute; qu&eacute; cambi&oacute;.';
		else { const changed = tools.filter((tool) => previous[tool.name] !== current[tool.name]).map((tool) => `${escapeHtml(tool.name)}: ${escapeHtml(previous[tool.name] || 'nuevo')} &rarr; <b>${escapeHtml(current[tool.name])}</b>`); output = changed.length ? `<ul><li>${changed.join('</li><li>')}</li></ul>` : 'Sin cambios desde tu &uacute;ltima visita.'; }
		localStorage.setItem('devlog:versions', JSON.stringify(current));
	} catch { output = 'Tu navegador no deja guardar estado local.'; }
	byId('diff').innerHTML = output;
}

function initEta(tools, age, now, dayMs) {
	byId('eta').innerHTML = `<tr><th>Herramienta</th><th>Abiertos</th><th>Ritmo</th><th>Fecha estimada</th></tr>${tools.filter((tool) => tool.stats && tool.stats.open > 0).map((tool) => { const days = Math.max(1, tool.firstRelease ? age(tool.firstRelease) : 0), closed = tool.stats.closed; if (!tool.firstRelease || closed === 0) return `<tr><td>${escapeHtml(tool.name)}</td><td>${tool.stats.open}</td><td colspan="2">sin datos suficientes</td></tr>`; const rate = closed / days, estimate = new Date(now + (tool.stats.open / rate) * dayMs).toISOString().slice(0, 10); return `<tr><td>${escapeHtml(tool.name)}</td><td>${tool.stats.open}</td><td>${(rate * 7).toFixed(1)} issues/sem</td><td>${estimate}</td></tr>`; }).join('')}`;
}
