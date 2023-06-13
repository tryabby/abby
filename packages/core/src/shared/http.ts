import { ABBY_BASE_URL } from './constants';
import type { AbbyEventType, AbbyEvent, AbbyDataResponse } from './index';

//
// function fetchData(url: RequestInfo | URL, init?: RequestInit) {
// if (typeof window === 'undefined') {
// Running in Node.js
// const fetch = require('node-fetch');
// return fetch(url);
// } else {
// Running in a browser
// return fetch(url);
// }
// }

export abstract class HttpService {
	static async getProjectData({
		projectId,
		environment,
		url
	}: {
		projectId: string;
		environment?: string;
		url?: string;
	}) {
		try {
			console.log(
				`${url ?? ABBY_BASE_URL}api/dashboard/${projectId}/data${
					environment ? `?environment=${environment}` : ''
				}`
			);
			const res = await fetch(
				`${url ?? ABBY_BASE_URL}api/dashboard/${projectId}/data${
					environment ? `?environment=${environment}` : ''
				}`
			);

			if (!res.ok) return null;
			const data = (await res.json()) as AbbyDataResponse;
			return data;
		} catch (err) {
			console.error('[ABBY]: failed to load project data, falling back to defaults');
			console.log(err);
			return null;
		}
	}

	static sendData({
		url,
		type,
		data
	}: {
		url?: string;
		type: AbbyEventType;
		data: Omit<AbbyEvent, 'type'>;
	}) {
		if (typeof window === 'undefined' || window.location.hostname === 'localhost') {
			// don't send data in development
			return;
		}
		return fetch(`${url ?? ABBY_BASE_URL}api/data`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ type, ...data })
			// catch error and forget about them for now
			// TODO: add error debugging
		}).catch(() => {});
	}
}
