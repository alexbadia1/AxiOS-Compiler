import { AbstractSyntaxTree } from "./abstract_syntax_tree";
import { ConcreteSyntaxTree } from "./concrete_syntax_tree";
import { LexicalToken } from "./lexical_token";
import { OutputConsoleMessage } from "./output_console_message";
import { ScopeTree } from "./scope_tree";

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
        public semanticAnalysisOutput: Array<OutputConsoleMessage> = [],
        public cst: ConcreteSyntaxTree = new ConcreteSyntaxTree(),
        public ast: AbstractSyntaxTree = new AbstractSyntaxTree(),
        public scopeTree: ScopeTree = new ScopeTree(),
        public stacktrace: Array<any> = [],
    ) { }
}// Program

