import os from "node:os";
import path from "node:path";

export const ABBY_BASE_URL = "https://www.tryabby.com";

export const getTokenFilePath = () => path.join(os.homedir(), ".abby");
