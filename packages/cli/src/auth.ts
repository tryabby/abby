import { getTokenFilePath } from "./consts";
import fs from "fs";

export function writeTokenFile(token: string) {
  fs.writeFileSync(getTokenFilePath(), token.toString());
}

export function getToken() {
  return fs.readFileSync(getTokenFilePath(), "utf-8");
}
