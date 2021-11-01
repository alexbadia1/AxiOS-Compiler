import { LexicalToken } from "./lexical_token";
import { OutputConsoleMessage } from "./output_console_message";

export class Program {
    constructor(
        public id: number = 0,
        public isValid: boolean = true,
        public cleanTokenStream: Array<LexicalToken> = [],
        public debugTokenStream: Array<LexicalToken> = [],
        public warningTokenStream: Array<LexicalToken> = [],
        public errorTokenStream: Array<LexicalToken> = [],
        public lexerOutput: Array<OutputConsoleMessage> = [],
        public parserOutput: Array<OutputConsoleMessage> = [],
        public cst: any = [],
        public stacktrace: Array<any> = [],
    ) { }
}// Program

