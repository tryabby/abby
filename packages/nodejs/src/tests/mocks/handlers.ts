import { rest } from 'msw';
import { type AbbyDataResponse, ABBY_BASE_URL } from '@tryabby/core';

export const handlers = [
	rest.get(`${ABBY_BASE_URL}api/dashboard/123/data`, (req, res, ctx) => {
		return res(
			ctx.json({
				tests: [
					{
						name: 'test',
						weights: [1, 1, 1, 1]
					},
					{
						name: 'test2',
						weights: [1, 0]
					}
				],
				flags: [
					{
						name: 'flag1',
						isEnabled: true
					},
					{
						name: 'flag2',
						isEnabled: false
					}
				]
			} as AbbyDataResponse)
		);
	}),

	rest.get(`${ABBY_BASE_URL}api/dashboard/clfn3hs1t0002kx08x3kidi80/data`, (req, res, ctx) => {
		return res(
			ctx.json({
				tests: [
					{
						name: 'test',
						weights: [1, 1, 1, 1]
					},
					{
						name: 'test2',
						weights: [1, 0]
					}
				],
				flags: [
					{
						name: 'lol',
						isEnabled: true
					},
					{
						name: 'test3',
						isEnabled: false
					}
				]
			} as AbbyDataResponse)
		);
	})
];
