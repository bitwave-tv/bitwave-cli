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

function parse(args: string[]): string[] {
    const stringLiteral = /^"[^"]*"(\s+|\s?$)/;
    const token = /^[^\s"]+(\s+|\s?$)/;

    const tokens = [];

    let stream: string = common.unspread(args);
    while(stream.length) {
        if(token.test(stream)) {
            tokens.push(token.exec(stream)[0].trimEnd());
            stream = stream.replace(token, "");
        } else if(stringLiteral.test(stream)) {
            const data = stringLiteral.exec(stream)[0].trimEnd();
            tokens.push(data.replace(new RegExp('"', 'g'), ""));
            stream = stream.replace(stringLiteral, "");
        } else {
            throw SyntaxError("Could not parse input. Did you close all quotes?");
        }
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

        let tokens: Array<string> = str
            .split(' ')   // split command at each space
            .filter(t => t.length); // used to remove extra spaces
        //const command: string = tokens.shift();

        try {
            tokens = parse(tokens);
            const command = tokens.shift();
            const f = builtins.functions.get(command);
            if (f) {
                const r = await f(...tokens);
                if (typeof r === "boolean") shouldExit = r;
                else shouldExit = false;
            } else {
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