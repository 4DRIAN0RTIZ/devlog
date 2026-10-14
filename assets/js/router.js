import { state, runCleanups } from './state.js';
import { frame, stamp } from './views/shared.js';
import { renderHome } from './views/home.js';
import { renderLogbook } from './views/logbook.js';
import { renderPanel } from './views/panel.js';
import { renderTool } from './views/tool.js';

function parseHash() {
	const [path, query = ''] = (location.hash.replace(/^#/, '') || '/').split('?');
	const filter = {};
	query.split('&').forEach((part) => {
		const [key, value] = part.split('=');
		if (key && value) filter[key] = decodeURIComponent(value);
	});
	return { path, filter };
}

export function render() {
	runCleanups();
	if (!state.loadedOnce) {
		frame(state.error ? 'Sin conexión' : 'Cargando...', null,
			state.error ? '<h2>No pude cargar los datos</h2><p>El endpoint <code>/activity</code> no respondi&oacute;. Reintentando cada 60 s.</p>' : '<p>Cargando datos de <code>/activity</code>...</p>');
		return;
	}
	const route = parseHash();
	if (route.path === '/bitacora') renderLogbook(route.filter);
	else if (route.path === '/panel') renderPanel();
	else if (/^\/t\/([a-z0-9-]+)$/.test(route.path)) renderTool(route.path.split('/').pop());
	else renderHome();
}

export function renderFooter() {
	stamp();
}
