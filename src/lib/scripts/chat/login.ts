import {Maybe, TokenString} from "./common";

import common = require("../../common");
import * as chalk from "chalk";

/**
 * Resolves a string of the format 'user:pass' into a chat token.
 * @param userpass String of the format 'user:pass'.
 * @return Token if resolved, undefined on fail.
 */
export function resolveUserPass(userpass: String): Maybe<TokenString> {
    common.print(chalk.yellow("STUB: ") + "resolveUserPass()\n");
    return undefined;
}
