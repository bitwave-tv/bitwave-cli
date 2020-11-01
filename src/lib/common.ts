const os = require('os');
const fs = require('fs');
const path = require('path');

export = {
    pwd() : String {
        return process.cwd();
    },

    exists(filePath : String) : Boolean {
        return fs.existsSync(filePath);
    },

    isDir(filePath : String) : Boolean {
        return this.exists(filePath) && fs.lstatSync(filePath).isDirectory();
    },

    isFile(filePath : String) : Boolean {
        return this.exists(filePath) && !fs.lstatSync(filePath).isDirectory();
    },

    fileContents(filePath : String) : String | void {
        filePath = this.resolvePath(filePath);
        if(this.isFile(filePath)) {
            return fs.readFileSync(filePath).toString();
        }
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