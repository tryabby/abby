import express, { NextFunction, Request, Response } from "express"
import { featureFlagMiddleware } from "./express/abbyMiddleware.ts";

const app = express();
const port = 3000;

app.use("/", (req: Request, res: Response, next: NextFunction) => featureFlagMiddleware(req, res, "testAbby", next))

app.get('/', async (req, res) => {
    res.send("very nice content that needs to be protected")
});

app.listen(port, () => console.log(`Express app running on port ${port}!`));