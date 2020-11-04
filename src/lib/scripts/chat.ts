import {promisify} from "util";

import blessed = require('blessed');
import chalk = require('chalk');

import { BitwaveChat, Message } from '@bitwave/chat-client';
const bwchat = new BitwaveChat(false);

import common = require("../common");
import {Maybe, reduceHtml, TokenString} from "./chat/common";
import {resolveUserPass} from "./chat/login";
import {commandParser, Action} from './chat/commandParser';

let screen;
let messageBox;
let inputPrompt;
async function _init(): Promise<void> {
    screen = await blessed.screen({
        smartCSR: true
    });
    messageBox = await blessed.log({
        top: 0,
        left: 0,
        width: '100%',
        height: '100%-1',
        content: '',
        tags: true,
        style: {
            fg: 'white',
        }
    });
    await screen.append(messageBox);
    inputPrompt = await blessed.Textbox({
        parent: screen,
        bottom: 0,
        left: 0,
        width: '100%',
        height: 1,
        tags: true,
        keys: true,
        style: {
            bg: 'blue'
        },
    });

    bwchat.rcvMessageBulk = async ms => {
        const filter: (Message) => Maybe<Message> = filters.reduce(common.kleisliLArr, id => id);
        const all_together: (Message) => Maybe<Message> = [
            reduceHtml,
            filter,
            messageToString,
            x => messageBox.add(x) && x,
        ].reduce((acc: (Message) => Maybe<Message>, x: (Message) => Maybe<Message>) => common.kleisliLArr(x, acc), id => id);
        ms.forEach(all_together);
        screen.render();
    };
    bwchat.onHydrate = (ms: Message[]): void => {
        messageBox.setContent("");
        bwchat.rcvMessageBulk(ms);
    }

    inputPrompt.key(['escape', 'C-c'], () => {
        shouldExit = true;
    });
    screen.key(['escape', 'C-c'], () => {
        shouldExit = true;
    });

    await inputPrompt.focus();
}

function prompt(): void {
    common.print(chalk.blue("> "));
}

const filters: [(Message) => Maybe<Message>] = [
    m => bwchat.global || m.channel === bwchat.room ? m : undefined,
];

function messageToString(m: Message): string {
    return "[" + ((typeof m.global !== "boolean") ? chalk.bgRed.inverse('X') : (m.global ? 'G' : 'L')) + "] " +
    `(${m.channel}) ` +
    chalk.hex(m.userColor)(m.username) + ": " +
    m.message;
}


let shouldExit: boolean = false;
async function chat(...args: string[]): Promise<void> {
    if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
        common.print(
            `${chalk.blueBright("Usage")}: chat ${chalk.gray("[-t token] [-L user:pass] [-lg]")} channel\n` +
            `${chalk.gray("where")} channel ${chalk.gray("is the channel name to connect to.\n")}` +
            `  -h, --help                 display this help message\n` +
            `  -t, --token                auth using given chat token\n` +
            `  -T, --tokenFile            auth using chat token read from file\n` +
            `  -L, --login <user:pass>    auth using user/pass (not implemented)\n` +
            `  Providing no login data will result in getting a troll token.\n` +
            `  -l, --local                view local chat\n` +
            `  -g, --global               view global chat\n`
        );
        return;
    }

    let channelName: string = "";
    let parseType: string = "";
    bwchat.global = true;

    const switches: Map<string, () => any> =
        new Map<string, () => any>([
            ['-l', () => {
                bwchat.global = false;
                parseType = "";
            }],
            ['--local', () => {
                bwchat.global = false;
                parseType = "";
            }],
            ['-g', () => {
                bwchat.global = true;
                parseType = "";
            }],
            ['--global', () => {
                bwchat.global = true;
                parseType = "";
            }],
            ['--litechad', () => {
                bwchat.global = "jebi cigane 123";
                parseType = "";
            }],
            ['-t', () => parseType = "token"],
            ['--token', () => parseType = "token"],
            ['-T', () => parseType = "tokenFile"],
            ['--tokenFile', () => parseType = "tokenFile"],
            ['-L', () => parseType = "login"],
            ['--login', () => parseType = "login"],
        ]);

    let token: Maybe<TokenString> = "";
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
                case "login":
                    i++;
                    token = resolveUserPass(args[i]);
                    break;
            }
        } else if (channelName) {
            common.print(chalk.red("Error: ") + "channel already specified\n");
            return;
        } else {
            channelName = curr;
        }
    }

    if (token == undefined) {
        common.print(chalk.red("Error: ") + "error parsing token\n");
        return;
    }

    if (!channelName) {
        common.print(chalk.yellow("Warn: ") + "no channel specified, defaulting to 'global'\n");
        channelName = "global";
    }

    await _init();
    bwchat.connect(channelName, token) && bwchat.hydrate();

    const getLine: () => Promise<string> = promisify((...args: any[]) => inputPrompt.readInput(...args));

    function executeAction(a: Action) {
        if( a.global !== undefined ) bwchat.global = a.global;
        if( a.shouldHydrate ) bwchat.hydrate();
        if( a.shouldExit ) shouldExit = a.shouldExit;
        if( a.channel ) bwchat.room = a.channel;
        if( a.whisper ) bwchat.sendWhisper( ...a.whisper );
        screen.render();
    }

    while (!shouldExit) {
        try {
            const l = await getLine();
            inputPrompt.clearValue();
            screen.render();

            const actions = await commandParser.parseOne( l );
            actions?.forEach( a => executeAction( a ) );
            if(!actions) bwchat.sendMessage(l);

        } catch (e) {
            console.error(e);
        }
    }

    shouldExit = false;
    bwchat.disconnect();
    screen.destroy();
}

export = [
    "chat",
    "[bitwave.tv] chat client",
    chat
];