/* eslint-disable react-hooks/rules-of-hooks */
//TODO fix eslint
import { getFeatureFlagValue, getABTestValue } from '../abby/abby.ts';
import { NextFunction, Request, Response } from 'express';
import { setRequest } from '../abby/contexts/requestContext.ts';
import { setResponse } from '../abby/contexts/responseContext.ts';

//TODO make types narrow like in createAbby
//TODO make abby import configurable

export const featureFlagMiddleware = async (
	req: Request,
	res: Response,
	name: string,
	next: NextFunction
) => {
	//Todo fix types
	const flagValue = getFeatureFlagValue(name as any); //type?
	console.log('hi from middleware', name, flagValue);
	if (!flagValue) {
		res.sendStatus(403);
		return;
	}
	next();
};

export const AbTestMiddleware = (req: Request, res: Response, name: string, next: NextFunction) => {
	setRequest(req);
	setResponse(res);
	const value = getABTestValue(req, name as any);
	console.log(value);
	next();
};
