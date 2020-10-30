const chat = undefined; //require('chat');
const printout = (():Function => {const {print} = require('./common'); return print})();

const functions = new Map<String, Function>();
const descriptions = new Map<String, String>();

let _chalk = require('chalk');
const data = [
    [
        "help",
        "Prints this help message",
        (): void => {
            const names: Array<String> = Array.from(functions.keys());
            for (let name of names) {
                printout(_chalk.whiteBright(name) + ` - ${_chalk.gray(descriptions.get(name))}\n`);
            }
        }
    ],
    [
        "chat",
        "Connects to [bitwave.tv] chat",
        chat
    ],
    [
        "upload",
        "Uploads an image to the [bitwave.tv] CDN",
        require('./scripts/upload')
    ],
    [
        "exit",
        "Exits the shell",
        (): Boolean => true,
    ]
];

data.forEach(([name, desc, func]) => {
    functions.set(name, func);
    descriptions.set(name, desc);
});

module.exports = {
    functions: functions,
    descriptions: descriptions,
};