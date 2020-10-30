const scripts = require('./scripts');
const printout = require('./common').print;

const functions = new Map<String, Function>();
const descriptions = new Map<String, String>();

let chalk = require('chalk');
const data = [
    [
        "help",
        "Prints this help message",
        (): void => {
            const names: Array<String> = Array.from(functions.keys());
            for (let name of names) {
                printout(chalk.whiteBright(name) + ` - ${chalk.gray(descriptions.get(name))}\n`);
            }
        }
    ],
    [
        "exit",
        "Exits the shell",
        (): Boolean => true,
    ],
    ...scripts
];

data.forEach(([name, desc, func]) => {
    functions.set(name, func);
    descriptions.set(name, desc);
});

module.exports = {
    functions: functions,
    descriptions: descriptions,
};