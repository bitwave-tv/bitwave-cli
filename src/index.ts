// portable TTY colours
import chalk = require('chalk');
const prompt =
    require('prompt-sync')({
        history: require('prompt-sync-history')('/tmp/bitwavecli.tmp', 100),
        eot: true,
    });

const {execSync} = require('child_process');

const common = require('./lib/common');

const builtins = require('./lib/builtins');

const welcomeMessage = () : void => {
    console.log(
        chalk.white("Welcome to the ")
        + chalk.blueBright("bitwave-cli")
        + chalk.white(" shell.\n")
        + chalk.white("Type `help` for instructions on how to use ")
        + chalk.blueBright("bitwave-cli.")
    );
};

const promptString: Function = () => chalk.blue(`${common.pwd()}`) + "> ";

function parse(stream: string): string[] {
    const stringLiteral = /^(["'])(.*?)\1/;
    const token = /^[^\s"']+/;

    const tokens = [];

    stream = stream.trimStart();
    while(stream.length) {
        if(token.test(stream)) {
            tokens.push(token.exec(stream)[0]);
            stream = stream.replace(token, "");
        } else if(stringLiteral.test(stream)) {
            tokens.push(stringLiteral.exec(stream)[2]);
            stream = stream.replace(stringLiteral, "");
        } else {
            throw SyntaxError("Could not parse input. Did you close all quotes?");
        }
        stream = stream.trimStart();
    }

    return tokens;
}

const main = async () => {
    let shouldExit: boolean = false;

    welcomeMessage();
    while (!shouldExit) {
        const str: string = prompt(promptString(), "");
        prompt.history.save();
        if(!str) continue;

        try {
            let tokens: Array<string> = parse(str);
            const command = tokens.shift();
            const f = builtins.functions.get(command);
            if (f) {
                const r = await f(...tokens);
                if (typeof r === "boolean") shouldExit = r;
                else shouldExit = false;
            } else if(command && tokens) {
                const execstr: string = tokens.reduce((acc, x) => acc + " " + x, command);
                execSync(execstr, {
                    stdio: [process.stdin, process.stdout, process.stderr],
                    windowsHide: true
                });
            }
        } catch(e) {
            common.print(chalk.red("ERR: ") + e.message + "\n");
        }
    }
}

main().then(() => process.exit(0));

export {}
