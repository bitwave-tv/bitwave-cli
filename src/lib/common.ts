const fs = require('fs');

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
};