import express from "express"
// import { useFeatureFlag } from "./lib/abby.ts";

console.log("hi")
const app = express();
const port = 3000;

app.get('/', async (req, res) => {
    if (1) {
        res.send("not enabled")
    }
});

app.listen(port, () => console.log(`Express app running on port ${port}!`));