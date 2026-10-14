import { API } from './config.js';
import { parseChangelog } from './changelog.js';
import { logPromises, state } from './state.js';

function getJson(url) {
	return fetch(url, { headers: { accept: 'application/json' } }).then((response) => {
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return response.json();
	});
}

export function loadLog(item) {
	const key = item.name;
	if (!logPromises[key]) {
		logPromises[key] = getJson(`${API}/changelog?repo=${encodeURIComponent(item.repo)}`)
			.then((data) => {
				state.logs[key] = data?.markdown
					? { version: item.currentVersion, releases: parseChangelog(data.markdown), raw: data.markdown }
					: { version: item.currentVersion, releases: [], raw: null };
			})
			.catch(() => { state.logs[key] = { version: item.currentVersion, releases: [], raw: null }; });
	}
	return logPromises[key];
}

export const loadAllLogs = () => Promise.all(state.items.map(loadLog));

export function refresh() {
	return getJson(`${API}/activity?all=1`).then((data) => {
		const items = data.items || [];
		const changed = JSON.stringify(items) !== JSON.stringify(state.items) || !state.loadedOnce;
		items.forEach((item) => {
			const previous = state.logs[item.name];
			if (previous && previous.version !== item.currentVersion) {
				delete state.logs[item.name];
				delete logPromises[item.name];
			}
		});
		state.items = items;
		state.error = false;
		state.updatedAt = new Date();
		state.loadedOnce = true;
		return changed;
	}).catch(() => {
		state.error = true;
		return false;
	});
}

export function entries() {
	const result = [];
	state.items.forEach((item) => {
		const log = state.logs[item.name];
		if (!log) return;
		log.releases.forEach((release) => {
			if (release.date) result.push({ tool: item, release, date: release.date, count: release.sections.reduce((count, section) => count + section.items.length, 0) });
		});
	});
	return result;
}

export function monthRange(list) {
	if (!list.length) return [];
	const keys = list.map((entry) => entry.date.slice(0, 7)).sort();
	const [startYear, startMonth] = keys[0].split('-').map(Number);
	const [endYear, endMonth] = keys[keys.length - 1].split('-').map(Number);
	const months = [];
	for (let year = startYear, month = startMonth; year < endYear || (year === endYear && month <= endMonth); month += 1) {
		months.push(`${year}-${String(month).padStart(2, '0')}`);
		if (month === 12) { year += 1; month = 0; }
	}
	return months;
}
