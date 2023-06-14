import { expect, test, describe, beforeEach } from 'vitest';
import express, { response } from 'express';
import request from 'supertest';
import { abbyMiddlewareFactory } from '../express/abbyMiddlewareFactory.ts';

describe('express middleware working', () => {
	let app: express.Application;

	beforeEach(async () => {
		const { AbTestMiddleware, featureFlagMiddleware } = await abbyMiddlewareFactory({
			abbyConfig: {
				projectId: 'clfn3hs1t0002kx08x3kidi80',
				currentEnvironment: process.env.NODE_ENV,
				tests: {
					'New Test3': {
						variants: ['A', 'B']
					}
				},
				flags: ['lol', 'test3', 'testAbby'],
				flagCacheConfig: {
					refetchFlags: true,
					timeToLive: 1
				}
			}
		});
		app = express();
		// Add any other middlewares or routes necessary for your test
		app.use('/featureflagTest', (req, res, next) => featureFlagMiddleware('test2', req, res, next));
		app.get('/', (req, res) => {
			res.send('hiadsa');
		});
	});

	test('abTestMiddleware working', async () => {
		//test cookie retrieval

		const res = await request(app).get('/');

		console.log(res.text);
		//check if cookie is set
	});

	test.skip('featureFlag Middleware working', async () => {
		//check if feature flag value is respected
	});
});
