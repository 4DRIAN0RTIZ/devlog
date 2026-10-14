export const state = { items: [], logs: {}, loadedOnce: false, error: false, updatedAt: null };
export const logPromises = {};

let cleanups = [];

export function addCleanup(cleanup) {
	cleanups.push(cleanup);
}

export function runCleanups() {
	cleanups.forEach((cleanup) => {
		try { cleanup(); } catch { /* Ignore cleanup errors. */ }
	});
	cleanups = [];
}
