export type Maybe<A> = A | void;
export type TokenString = string;

import TurndownService from 'turndown';
import type { Message } from '@bitwave/chat-client';
const turndown = new TurndownService({
    headingStyle: 'atx',
    linkReferenceStyle: 'shortcut',
    codeBlockStyle: 'fenced',
});
export function reduceHtml(m: Message) {
    m.message = m.message.replace( /<\/?p[\w =#"':\/\\.\-?]*>/gi, "" );
    m.message = m.message.replace( /<img[\w -=#"':\/\\.\-?]*>/gi, m => {
        if( m.includes('alt="echo"') ) {
            return m.includes('scaleX(-1)') ? "(((" : ")))";
        }
        return m.match( /alt="([\w:()]+)"/ )[1];
    });
    m.message = turndown.turndown( m.message );
    m.message = m.message.replace(/\\(\\|_|>|\[|\]|\*)/g, '$1');
    m.message = m.message.replace(/(\n{2})+/, "\n");
    return m;
}
