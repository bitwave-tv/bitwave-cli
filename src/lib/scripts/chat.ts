const term = require('terminal-kit').terminal;

const common = require('../common');
const chalk = require('chalk');

const bwchat = require('@bitwave/chat-client').default;
import type { Message } from '@bitwave/chat-client';

const TurndownService = require('turndown');
const turndown = new TurndownService();
function reduceHtml(m: Message) {
    //console.warn(m);
    // <p></p>
    m.message = m.message.replace( /<\/?p[\w =#"':\/\\.\-?]*>/gi, "" );

    // <a>gets left</a>
    // Custom links are text in <a>, and then the link in <kbd>
    // m.message = m.message.replace( /<\/?a[\w -=#"':\/\\.\-?]*>/gi, "" );
    // m.message = m.message.replace( "<kbd>", "" );
    // m.message = m.message.replace( "</kbd>", "" );
    // <img> to :emotes:

    m.message = m.message.replace( /<img[\w -=#"':\/\\.\-?]*>/gi, m => {
        // (((, ))), :), :( are rendered differently
        // (They dont even show up in the emote list)
        //
        // It wouldn't be so bad if the two echos were 'echol' and 'echor', but
        //  one echo is flipped with CSS.
        if( m.includes('alt="echo"') ) {
            return m.includes('scaleX(-1)') ? "(((" : ")))";
        }
        return m.match( /alt="([\w:()]+)"/ )[1];
    });

    m.message = turndown.turndown( m.message );

    m.message = m.message.replace(/\\(\\|_|>|[|])/g, '$1');

    return m;
}

let screenSize = {
    x: process.stdout.columns,
    y: process.stdout.rows,
};

/**
 * In case of screen resize, nuke the buffer and redraw
 */
process.stdout.on('resize', () => {
    screenSize = {
        x: process.stdout.columns,
        y: process.stdout.rows,
    }
    recalcLineCounts();
});

type Maybe<T> = T | void;
type Token = String;

/**
 * Contains at most `this.maxSize` values of T
 */
class Buffer<T> {
    public maxSize: number;
    public buffer: Array<T>;

    public constructor(maxsz?: number, buffer?: Array<T>) {
        this.maxSize = maxsz ?? 300;
        this.buffer = buffer ?? [];
    }

    /**
     * Adds new entry.
     * @param a New entry.
     */
    public push(a: T): void {
        this.buffer.push(a);
        if(this.buffer.length > this.maxSize) this.buffer.shift();
    }

    /**
     * Returns the last (youngest) `a` entries.
     * @param a Number of entries to return.
     * @return Last `a` entries,
     */
    public last(a: number): Array<T> { return this.buffer.slice(-a); }
}

type LineCount = number;
let messages: Buffer<[Message, LineCount]> = new Buffer<[Message, LineCount]>();
function estimateLineCount(m: Message): number {
    let lineCount: number = 0;
    const ms = m.message.split('\n');

    lineCount += ms.length;

    for (let l of ms) {
        // [12:34] [G] (channel) username: message
        // \--------v----------/
        //
        lineCount += Math.ceil((l.length + ms.username + ms.channel + 15) / screenSize.x);
    }

    return lineCount;
}
function recalcLineCounts(): void {
    messages.buffer.map(([m]) => {
        return estimateLineCount(m);
    });
}

/**
 * 'Renders' chat messages from `messages` into the screen buffer,
 * draws them out on screen, and returns to old cursor position.
 */
async function draw(): Promise<void> {
    let lines = 0, i, messageCount = 0;
    for (i = messages.buffer.length - 1; i >= 0; i--) {
        lines += messages.buffer[i][1]
        messageCount++;

        if (lines === screenSize.y - 1) break;
        else if (lines > screenSize.y - 1) {
            messageCount--;
            break;
        }
    }

    const ms = messages.last(messageCount);
    let tmp = "";
    for (let [m] of ms) {
        let line =
            "[" + (m.global ? 'G' : 'L') + "] " +
            `(${m.channel}) ` +
            chalk.hex(m.userColor)(m.username) + ": " +
            m.message;
        line += " ".repeat(screenSize.x - (line.length % screenSize.x)) + '\n';
        tmp += line;
    }
    //TODO: figure out why the prompt line gets eaten when the line above it gets drawn
    tmp.trimEnd();

    const {x, y} = await term.getCursorLocation();

    term.moveTo(0, 0);
    common.print(tmp);
    term.moveTo(x, y);

    // screenTextBuffer.buf.map(_ => " ");
}

/**
 * Resolves a string of the format 'user:pass' into a chat token.
 * @param userpass String of the format 'user:pass'.
 * @return Token if resolved, undefined on fail.
 */
function resolveUserPass(userpass: String): Maybe<Token> {
    common.print(chalk.yellow("STUB: ") + "resolveUserPass()\n");
    return undefined;
}

let shouldExit: boolean = false;
async function chat(...args: String[]): Promise<void> {
    if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
        common.print(
            `${chalk.blueBright("Usage")}: chat ${chalk.gray("[-t token] [-L user:pass] [-lg]")} channel\n` +
            `${chalk.gray("where")} channel ${chalk.gray("is the channel name to connect to.\n")}` +
            `  -t, --token                auth using given chat token\n` +
            `  -T, --tokenFile            auth using chat token read from file\n` +
            `  -L, --login <user:pass>    auth using user/pass (not implemented)\n` +
            `  Providing no login data will result in getting a troll token.\n` +
            `  -l, --local                view local chat\n` +
            `  -g, --global               view global chat\n`
        );
        return;
    }

    let channelName: String = "";
    let parseType: String = "";
    const switches: Map<String, () => any> =
        new Map<String, () => any>([
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
            ['-t', () => parseType = "token"],
            ['--token', () => parseType = "token"],
            ['-T', () => parseType = "tokenFile"],
            ['--tokenFile', () => parseType = "tokenFile"],
            ['-L', () => parseType = "login"],
            ['--login', () => parseType = "login"],
        ]);

    let token: Maybe<Token> = "";
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

    term.fullscreen(true);

    const getLine = (...args: any[]): any => term.inputField({
        x: 0, y: screenSize.y,
        history: [],
        maxLength: 250,
    }, ...args).promise;

    bwchat.rcvMessageBulk = async ms => {
        ms = ms.filter(m => m.channel == bwchat.room || bwchat.global);
        ms.forEach(m => {
            reduceHtml(m);
            messages.push([m, estimateLineCount(m)]);
        });

        ms ? await draw() : undefined;
    };
    bwchat.init(channelName, token);

    while (!shouldExit) {
        try {
            const l = await getLine();
            if(l === '/quit' || l === '/q') shouldExit = true;
            else if(l) {
                bwchat.sendMessage(l);
            }
        } catch (e) {
            console.error(e);
        }
    }

    shouldExit = false;
    term.fullscreen(false);

    bwchat.disconnect();
}

export = [
    "chat",
    "[bitwave.tv] chat client",
    chat
];