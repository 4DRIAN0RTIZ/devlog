import { POLL_MS } from './config.js';
import { loadAllLogs, refresh } from './api.js';
import { render, renderFooter } from './router.js';
import { state } from './state.js';

function cycle() {
	return refresh().then((changed) => {
		if (changed) {
			render();
			loadAllLogs().then(render);
		} else if (!state.loadedOnce) {
			render();
		} else {
			renderFooter();
		}
	});
}

window.addEventListener('hashchange', render);
render();
cycle();
setInterval(cycle, POLL_MS);
