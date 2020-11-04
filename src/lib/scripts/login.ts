import common = require('../common');
import * as chalk from "chalk";
import {resolveUserPass} from "./chat/login";

const env = require('../../env/global').env;

function login(...args: string[]): void {
    if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
        common.print(
            `${chalk.blueBright("Usage")}: login ${chalk.gray("[-t token] [-L user:pass] [-u chatToken]")}\n` +
            `  -h, --help                 display this help message\n` +
            `  -t, --token                auth using given auth token\n` +
            `  -T, --tokenFile            auth using auth token read from file\n` +
            `  -u, --chatToken            auth using given auth token\n` +
            `  -U, --chatTokenFile        auth using auth token read from file\n` +
            `  -L, --login <user:pass>    auth using user/pass\n` +
            chalk.gray(`Providing no login data will result in getting a troll token.\n`) +
            chalk.gray(`Specifying login data will override this login.\n`)
        );
        return;
    }

    let parseType: string = "";
    const switches: Map<string, () => any> =
        new Map<string, () => any>([
            ['-t', () => parseType = "token"],
            ['--token', () => parseType = "token"],
            ['-T', () => parseType = "tokenFile"],
            ['--tokenFile', () => parseType = "tokenFile"],
            ['-u', () => parseType = "token"],
            ['--chatToken', () => parseType = "token"],
            ['-U', () => parseType = "tokenFile"],
            ['--chatTokenFile', () => parseType = "tokenFile"],
            ['-L', () => parseType = "login"],
            ['--login', () => parseType = "login"],
        ]);

    let token, chatToken;
    for (let i = 0; i < args.length; i++) {
        const curr = args[i];
        if (curr.startsWith('-')) {
            switches.get(curr)?.call(this);
            switch (parseType) {
                case "token":
                    i++;
                    token = args[i];
                    break;
                case "tokenFile":
                    i++;
                    token = common.fileContents(args[i]);
                    break;
                case "chatToken":
                    i++;
                    chatToken = args[i];
                    break;
                case "chatTokenFile":
                    i++;
                    chatToken = common.fileContents(args[i]);
                    break;
                case "login":
                    i++;
                    token = resolveUserPass(args[i]);
                    break;
            }
        }
    }

    if(token) env["authToken"] = token
    if(chatToken) env["chatToken"] = token
}

export = [
    "login",
    "Logs you in and saves tokens to the environment",
    login
]