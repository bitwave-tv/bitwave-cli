import scripts = require('./scripts');
import common = require('./common');

const functions = new Map<String, Function>();
const descriptions = new Map<String, String>();

import chalk = require('chalk');
const data = [
    [
        "help",
        "Prints this help message",
        (): void => {
            const names: Array<String> = Array.from(functions.keys());
            for (let name of names) {
                common.print(chalk.whiteBright(name) + ` - ${chalk.gray(descriptions.get(name))}\n`);
            }
        }
    ],
    [
        "cd",
        "Changes current directory",
        path => {
            if(!path) {
                common.print(chalk.red("ERROR: ") + `No filepath entered\n`);
                return;
            }

            if(common.exists(path)) path = common.resolvePath(path);

            if(!common.isDir(path)) {
                common.print(chalk.red("ERROR: ") + `'${chalk.bgBlueBright(path)}' isn't a directory\n`);
                return;
            }

            process.chdir(path);
        }
    ],
    [
        "pwd",
        "Print working directory",
        () => console.log(common.pwd())
    ],
    [
        "exit",
        "Exits the shell",
        (): Boolean => true,
    ],
    [
        "eval",
        "Evaluates a JS expression.",
        (...args): void => {
            eval(common.unspread(args));
        }
    ],
    ...scripts
];

data.forEach(([name, desc, func]) => {
    functions.set(name, func);
    descriptions.set(name, desc);
});

export = {
    functions: functions,
    descriptions: descriptions,
};