import path from "path";
import os from "os";

export const ABBY_BASE_URL = "https://www.tryabby.com/";
export const LOCAL_BASE_URL = "http://localhost:3000/";

export const getTokenFilePath = () => path.join(os.homedir(), ".abby");

export const configRegex = /defineConfig\(([\s\S]+)\)/g;
