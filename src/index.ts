// portable TTY colours
const chalk = require('chalk');
const prompt =
    require('prompt-sync')({
        history: require('prompt-sync-history')('/tmp/bitwavecli.tmp', 100),
        eot: true,
    });

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

const promptString: String = chalk.blue(`${common.pwd()}`) + "> ";

const main = async () => {
    let exit: boolean = false;

    welcomeMessage();
    while (!exit) {
        const str: String = prompt(promptString, "") ?? ' ';
        const tokens: Array<String> = str
            .split(' ')   // split command at each space
            .filter(t => t.length); // used to remove extra spaces
        const command: String = tokens.shift();

        const f = builtins.functions.get(command);
        if (f) {
            const r = await f(...tokens);
            if (typeof r === "boolean") exit = r;
            else exit = false;
        }
    }
}

main().then();

export {}