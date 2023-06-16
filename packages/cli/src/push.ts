import * as path from "path";
import * as fs from 'fs';


function loadAbbyConfig(): Promise<string> {
    // TODO search for file. it just works, when the file is in root
    return new Promise<string>((resolve, reject) => {
        const fileName = 'abby.ts';

        fs.readFile(fileName, "utf8", (error, data) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(data);
        })
    })
}


function getConfig(configFileString: string): Object {
    const regex = /export const abby = ({[\s\S]*?});/;

    const match = configFileString.match(regex);
    const objectString = match ? match[1] : '';
    return JSON.parse(objectString);
}

async function main(): Promise<void> {
    const configFileString: string = await loadAbbyConfig();
    const config: Object = getConfig(configFileString)


}