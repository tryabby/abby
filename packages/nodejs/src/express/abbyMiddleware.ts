/* eslint-disable react-hooks/rules-of-hooks */
//TODO fix eslint
import { getFeatureFlagValue } from "../abby/abby.ts";
import { Express, NextFunction, Request, Response } from "express";

export const featureFlagMiddleware = async (req: Request, res: Response, name: string, next: NextFunction) => { //Todo fix types
    const flagValue = await getFeatureFlagValue(name as any); //type?
    console.log("hi from middleware", name, flagValue)
    if (!flagValue) {
        res.sendStatus(403);
        return;
    }
    next();
}
