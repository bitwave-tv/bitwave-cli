import * as fs from "fs";

const common = require("../common");
const FormData = require("form-data")

const chalk = require("chalk");
const axios = require("axios");

const upload = async (filepath: string, cb: Function) : Promise<void> => {
    if(!filepath) {
        common.print(chalk.red("ERROR: ") + `No filepath entered\n`);
        return;
    }

    if(!common.isFile(filepath)) {
        common.print(chalk.red("ERROR: ") + `'${chalk.bgBlueBright(filepath)}' isn't a file\n`);
        return;
    }
    const postData = new FormData();
    postData.append("upload", fs.createReadStream(filepath));

    const r = await axios.post ("https://api.bitwave.tv/upload", postData,
        {headers: postData.getHeaders()}).catch(r => console.error(r));

    console.log(r.data);
};

module.exports = [
    "upload",
    "Uploads an image to the [bitwave.tv] CDN",
    upload,
];
