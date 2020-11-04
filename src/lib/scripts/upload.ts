import * as fs from "fs";

import common = require("../common");
import FormData = require("form-data")

import chalk = require("chalk");
const axios = require("axios");

const upload = async (filepath: string) : Promise<void> => {
    if(!filepath) {
        common.print(chalk.red("ERROR: ") + `No filepath entered\n`);
        return;
    }

    filepath = common.resolvePath(filepath);

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

export = [
    "upload",
    "Uploads an image to the [bitwave.tv] CDN",
    upload,
];
