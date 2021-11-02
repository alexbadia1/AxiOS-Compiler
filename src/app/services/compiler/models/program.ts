import { AbstractSyntaxTree } from "./abstract_syntax_tree";
import { ConcreteSyntaxTree } from "./concrete_syntax_tree";
import { ExecutableImage } from "./executable_image";
import { LexicalToken } from "./lexical_token";
import { OutputConsoleMessage } from "./output_console_message";
import { ScopeTree } from "./scope_tree";
import { StaticTable } from "./static_table";

export class Program {
    constructor(
        public id: number = 0,
        public isValid: boolean = true,
        public stacktrace: Array<any> = [],

        // Lex
        public lexerOutput: Array<OutputConsoleMessage> = [],
        public cleanTokenStream: Array<LexicalToken> = [],
        public debugTokenStream: Array<LexicalToken> = [],
        public warningTokenStream: Array<LexicalToken> = [],
        public errorTokenStream: Array<LexicalToken> = [],

        // Psrse
        public parserOutput: Array<OutputConsoleMessage> = [],
        public cst: ConcreteSyntaxTree = new ConcreteSyntaxTree(),

        // Semantic Analysis
        public semanticAnalysisOutput: Array<OutputConsoleMessage> = [],
        public ast: AbstractSyntaxTree = new AbstractSyntaxTree(),
        public scopeTree: ScopeTree = new ScopeTree(),

        // Code Generation
        public codeGenerationOutput: Array<OutputConsoleMessage> = [],
        public staticTable: StaticTable = new StaticTable(),
        public executableImage: ExecutableImage = new ExecutableImage(0),
    ) { }
}// Program

