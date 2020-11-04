import common = require('../../common');

export type Recipient = string;
export interface Action {
    shouldHydrate?: any;
    global?: boolean,
    shouldExit?: boolean,
    channel?: string,
    whisper?: [Recipient, string]
}

export interface CommandParser {
    parseOne: (String) => Action[],
}

export function normalizeUsername( username: string ): string {
    if(username.startsWith('@')) username = username.substring(1);
    return username.toLowerCase();
}

/**
 * Creates the functions that run for the chat commands
 * */
const createFunctions = () => ({
    /**
     * Enables local chat
     * */
    setLocalChat (): Action[] {
        return [
            { global: false },
            { shouldHydrate: true },
        ];
    },

    /**
     * Enables global chat
     * */
    setGlobalChat (): Action[] {
        return [
            { global: true },
            { shouldHydrate: true },
        ];
    },

    /**
     * Signals quit state
     */
    quit(): Action[] {
        return [
            { shouldExit: true },
        ]
    },

    channel(where: string) : Action[] {
        where = normalizeUsername(where);
        return [
            { channel: where },
            { shouldHydrate: true },
        ]
    },

    whisper(who: string, ...rest: string[]): Action[] {
        const message = common.unspread(rest);
        return [
            { whisper: [normalizeUsername(who), message] }
        ];
    }
});


/**
 * Creates the chat parsing object using the supplied functions
 * */
const createParser = parserFns => ({

    // Creates a map of commands and their associated functions
    commands: new Map<String, () => Action[]>([
        // Local vs. Global
        [ "local",           parserFns.setLocalChat ],
        [ "global",          parserFns.setGlobalChat ],

        // Ignore Users
        [ "ignore",          parserFns.ignoreUser ],
        [ "i",               parserFns.ignoreUser ],
        [ "unignore",        parserFns.unignoreUser ],
        [ "u",               parserFns.unignoreUser ],
        [ "purgeusers",      parserFns.purgeIgnoreUser ],

        // Ignore Channels
        [ "ignorechannel",   parserFns.ignoreChannel ],
        [ "ic",              parserFns.ignoreChannel ],
        [ "unignorechannel", parserFns.unignoreChannel ],
        [ "uic",             parserFns.unignoreChannel ],
        [ "uc",              parserFns.unignoreChannel ],
        [ "purgechannels",   parserFns.purgeIgnoreChannel ],

        // Ignore List
        [ "ignorelist",      parserFns.showIgnoreList ],

        // TODO: fix whispers :trout:
        // Whispers
        [ "whisper", parserFns.whisper ],
        [ "w",       parserFns.whisper ],

        [ "exit", parserFns.quit ],
        [ "quit", parserFns.quit ],
        [ "q",    parserFns.quit ],

        [ "channel", parserFns.channel ],
        [ "c",       parserFns.channel ],
    ]),


    // Spread in all of our functions
    ...parserFns,


    /**
     * parse command
     * @param str
     * @return {Promise<null|undefined|*>}
     */
    async parseOne ( str: String ): Promise<Action[]> {

        if(!str) return null;

        // All commands must start with a slash
        if ( !str.startsWith( '/' ) ) return null;

        // Extracts out command & arguments (I think)
        const tokens = str
            .replace ( '/', '' )        // strip slash from start of command
            .split ( ' ' )              // split command at each space
            .filter ( t => t.length );  // used to remove extra spaces

        // token[0] is our command word.
        // We use shift to both remove it
        // from the array and get it's value.
        // Then force lowercase to ignore casing
        const commandToken = ( tokens.shift() ).toLowerCase();

        // Attempt to find matching command
        const command = this.commands.get( commandToken );

        // if there is a matching command,
        // then run it (with the arguments)!
        if ( command ) return await command ( ...tokens );

        // else return undefined
        return undefined;
    },

});

export const commandParser: CommandParser = createParser ( createFunctions() );
