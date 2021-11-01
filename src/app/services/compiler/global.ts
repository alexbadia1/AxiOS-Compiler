/* ------------
   Globals.ts
   Author: Alex Badia
   Global CONSTANTS and _Variables.
   (Global over the compiler.)
   ------------ */

export const APP_NAME: string = "NightingaleCompiler";
export const APP_VERSION: string = "0.01";

export const CODE_EDITOR_TAB_LENGTH: number = 4;

// Output console mesages' sources
export const LEXER: string = "LEXER";
export const PARSER: string = "PARSER";
export const SEMANTIC_ANALYSIS: string = "SEMANTIC ANALYSIS";
export const CODE_GENERATION: string = "CODE GENERATION";

// Output console mesages' types
export const ERROR: string = "ERROR";
export const WARNING: string = "WARNING";
export const INFO: string = "INFO";

/**
 * Lexical Tokens
 */

// Keyword loops
export const KEYWORD_WHILE: string = "KEYWORD_WHILE";

// Keyword branches
export const KEYWORD_IF: string = "KEYWORD_IF";

// Keyword standard output
export const KEYWORD_PRINT: string = "KEYWORD_PRINT";

// Keyword types
export const KEYWORD_INT: string = "KEYWORD_INT";
export const KEYWORD_STRING: string = "KEYWORD_STRING";
export const KEYWORD_BOOLEAN: string = "KEYWORD_BOOLEAN";

// Keyword booleans
export const KEYWORD_TRUE: string = "KEYWORD_TRUE";
export const KEYWORD_FALSE: string = "KEYWORD_FALSE";

// Identifiers (Single character variables)
export const IDENTIFIER: string = "IDENTIFIER";

/**
 * Yes, there are tokens for comments...
 * 
 * Many languages will lex comments as tokens, which are useful
 * for say creating javadoc, or even adding tags like "@override".
 */
export const START_BLOCK_COMMENT: string = "START_BLOCK_COMMENT";
export const END_BLOCK_COMMENT: string = "END_BLOCK_COMMENT";

// String quotations (")
export const STRING_EXPRESSION_BOUNDARY: string = "STRING_EXPRESSION_BOUNDARY";

// Symbol 
export const SYMBOL: string = "SYMBOL";

// Open/Close blocks
export const SYMBOL_OPEN_BLOCK: string = "SYMBOL_OPEN_BLOCK";
export const SYMBOL_CLOSE_BLOCK: string = "SYMBOL_CLOSE_BLOCK";

// Open/Close arguments
export const SYMBOL_OPEN_ARGUMENT: string = "SYMBOL_OPEN_ARGUMENT";
export const SYMBOL_CLOSE_ARGUMENT: string = "SYMBOL_CLOSE_ARGUMENT";

// Operands
export const SYMBOL_INT_OP: string = "SYMBOL_INT_OP";
export const SYMBOL_BOOL_OP_EQUALS: string = "SYMBOL_BOOL_OP_EQUALS";
export const SYMBOL_BOOL_OP_NOT_EQUALS: string = "SYMBOL_BOOL_OP_NOT_EQUALS";

// Assignments
export const SYMBOL_ASSIGNMENT_OP: string = "SYMBOL_ASSIGNMENT_OP";

// Digits
export const DIGIT: string = "DIGIT";

// Characters
export const CHARACTER: string = "CHARACTER";
/**
 * Yes, there are tokens for spaces...
 * 
 * Some languages give white space meaning, like Python.
 * Where indents signify code blocks, instead of a say Java 
 * like language where brackets {}, indicate code blocks.
 */
export const SPACE_SINGLE: string = "SPACE_SINGLE";
export const SPACE_TAB: string = "SPACE_TAB";
export const SPACE_END_OF_LINE: string = "SPACE_END_OF_LINE";

// End of Program
export const END_OF_PROGRAM: string = "END_OF_PROGRAM";

/**
 * Token Types
 * 
 * Lex will provide errors such as invalid characters, warnings, and missing 
 * tokens for mistakes involving, for example, missing end of program tokens.
 */
export const INVALID_TOKEN: string = "INVALID_TOKEN";
export const WARNING_TOKEN: string = "WARNING_TOKEN";
export const MISSING_TOKEN: string = "MISSING_TOKEN";

/**
 * Language types
 * 
 * Identifiers are preceded by 1 of 3 types in our grammar.
 *   - int
 *   - string
 *   - boolean
 * Note: During parser, the type inserted into the CST is based on the lex token
 */
export const INT: string = "int";
export const STRING: string = "string";
export const BOOLEAN: string = "boolean";
export const UNDEFINED: string = "undefined";

// Syntax Trees Types of Nodes
export const NODE_TYPE_BRANCH: string = "BRANCH";
export const NODE_TYPE_LEAF: string = "LEAF";

// Syntax Tree Names of Nodes
export const NODE_NAME_PROGRAM: string = "Program";
export const NODE_NAME_BLOCK: string = "Block";
export const NODE_NAME_STATEMENT_LIST: string = "Statement List";
export const NODE_NAME_STATEMENT: string = "Statement";
export const NODE_NAME_PRINT_STATEMENT: string = "Print Statement";
export const NODE_NAME_ASSIGNMENT_STATEMENT: string = "Assignment Statement";
export const NODE_NAME_VARIABLE_DECLARATION: string = "Variable Declaration";
export const NODE_NAME_WHILE_STATEMENT: string = "While Statement";
export const NODE_NAME_IF_STATEMENT: string = "If Statement";
export const NODE_NAME_EXPRESSION: string = "Expression";
export const NODE_NAME_INT_EXPRESSION: string = "Int Expression";
export const NODE_NAME_STRING_EXPRESSION: string = "String Expression";
export const NODE_NAME_BOOLEAN_EXPRESSION: string = "Boolean Expression";
export const NODE_NAME_IDENTIFIER: string = "Identifier";
export const NODE_NAME_TYPE: string = "Type";
export const NODE_NAME_CHARACTER_LIST: string = "Character List";
export const NODE_NAME_CHARACTER: string = "Character";
export const NODE_NAME_SPACE: string = "Space";
export const NODE_NAME_DIGIT: string = "Digit";
export const NODE_NAME_BOOLEAN_OPERATION: string = "Boolean Operation";
export const NODE_NAME_BOOLEAN_VALUE: string = "Boolean Value";
export const NODE_NAME_INT_OPERATION: string = "Int Operation";
export const AST_NODE_NAME_IF: string = "if";
export const AST_NODE_NAME_WHILE: string = "while";
export const NODE_NAME_TRUE: string = "true";
export const NODE_NAME_FALSE: string = "false";
export const AST_NODE_NAME_INT_OP: string = "+";
export const AST_NODE_NAME_BOOLEAN_EQUALS: string = "==";
export const AST_NODE_NAME_BOOLEAN_NOT_EQUALS: string = "!=";

// Scope Tree Node Names
export const NODE_NAME_SCOPE: string = "Scope";

// Code Generation
export const MAX_MEMORY_SIZE: number = 256;