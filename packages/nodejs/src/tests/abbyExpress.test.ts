import { expect, test, describe } from 'vitest';
import { createAbby } from '../abby/createAbby.ts';
import express, { request, response } from 'express';
import { AbTestMiddleware, featureFlagMiddleware } from '../express/abbyMiddleware.ts';

describe('express middleware working', () => {
	let app: express.Application;

	beforeEach(() => {
		app = express();
		// Add any other middlewares or routes necessary for your test
	});

	test('abTestMiddleware working', async () => {
		//test cookie retrieval
		//check if cookie is set
	});

	test('featureFlag Middleware working', async () => {
		app.use('/', (req, res, next) => AbTestMiddleware(req, res, 'New Test3', next));
		//check if feature flag value is respected
	});
});
