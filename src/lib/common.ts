const os = require('os');
const fs = require('fs');
const path = require('path');

type Maybe<A> = A | void;

export = {
    pwd() : string {
        return process.cwd();
    },

    exists(filePath : string) : Boolean {
        return fs.existsSync(filePath);
    },

    isDir(filePath : string) : Boolean {
        return this.exists(filePath) && fs.lstatSync(filePath).isDirectory();
    },

    isFile(filePath : string) : Boolean {
        return this.exists(filePath) && !fs.lstatSync(filePath).isDirectory();
    },

    fileContents(filePath : string) : string | void {
        filePath = this.resolvePath(filePath);
        if(this.isFile(filePath)) {
            return fs.readFileSync(filePath).toString();
        }
    },

    print(s) : void {
        process.stdout.write(s);
    },

    resolvePath(s : string) : string {
        const homedir = os.homedir();
        s = homedir ? s.replace(/^~(?=$|\/|\\)/, homedir) : s;
        return path.resolve(s);
    },

    kleisliLArr<L, R, A>(left: (L) => Maybe<A>, right: (R) => Maybe<L>): (R) => Maybe<A> {
        return (x: R): Maybe<A> => {
            const r = right(x);
            if(r) return left(r);
            else return undefined;
        }
    },
};