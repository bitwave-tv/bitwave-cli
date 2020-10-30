const os = require('os');
const fs = require('fs');
const path = require('path');

module.exports = {
    pwd() : String {
        return process.cwd();
    },

    dirExists(filePath : String) : Boolean {
        return fs.existsSync(filePath);
    },

    isFile(filePath : String) : Boolean {
        return fs.existsSync(filePath) && !fs.lstatSync(filePath).isDirectory();
    },

    print(s) : void {
        process.stdout.write(s);
    },

    resolvePath(s : String) : string {
        const homedir = os.homedir();
        s = homedir ? s.replace(/^~(?=$|\/|\\)/, homedir) : s;
        return path.resolve(s);
    }
};