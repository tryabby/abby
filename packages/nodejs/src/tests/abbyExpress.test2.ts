import { expect, test, describe, beforeEach } from 'vitest';
import { createAbby } from '../abby/createAbby.ts';
import express, { response } from 'express';
import { AbTestMiddleware, featureFlagMiddleware } from '../express/abbyMiddleware.ts';
import request from 'supertest';

describe.skip('express middleware working', () => {
	let app: express.Application;

	beforeEach(() => {
		app = express();
		// Add any other middlewares or routes necessary for your test
	});

	test('abTestMiddleware working', async () => {
		const result = true;
		//test cookie retrieval
		app.use('/', (req, res, next) => AbTestMiddleware(req, res, '', next));
		app.get('/', (req, res) => {
			res.status(200);
			res.send('hi');
		});

		const res = await request(app).get('/');
		console.log(res.statusCode);
		//check if cookie is set
		expect(result).toBeFalsy();
	});

	test('featureFlag Middleware working', async () => {
		const result = true;
		app.use('/', (req, res, next) => AbTestMiddleware(req, res, '', next));
		app.get('/', (req, res) => {
			res.status(200);
			res.send('hi');
		});

		const res = await request(app).get('/');
		console.log(res.statusCode);

		expect(result).toBeFalsy();
		//check if feature flag value is respected
	});
});
