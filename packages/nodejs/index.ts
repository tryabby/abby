import express from "express"
import { useFeatureFlag } from "./src/abby";

const app = express();
const port = 3000;

app.get('/', async (req, res) => {
    if (await useFeatureFlag("lol")) {
        res.send("not enabled")
    }
});

app.listen(port, () => console.log(`Express app running on port ${port}!`));