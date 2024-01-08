import path from "path";
import fs from "fs";

const configDirectory = path.join(process.cwd(), 'configs')


export function getAPIRoutes () {
    const configPath = path.join(configDirectory, 'route.json')
    const text = fs.readFileSync(configPath, 'utf8');
    const configs = JSON.parse(text);
    return configs;
}
