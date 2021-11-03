import { Injectable } from '@angular/core';
import { CHARACTER, DIGIT, END_OF_PROGRAM, ERROR, IDENTIFIER, INFO, KEYWORD_BOOLEAN, KEYWORD_FALSE, KEYWORD_IF, KEYWORD_INT, KEYWORD_PRINT, KEYWORD_STRING, KEYWORD_TRUE, KEYWORD_WHILE, NODE_NAME_ASSIGNMENT_STATEMENT, NODE_NAME_BLOCK, NODE_NAME_BOOLEAN_EXPRESSION, NODE_NAME_BOOLEAN_OPERATION, NODE_NAME_BOOLEAN_VALUE, NODE_NAME_CHARACTER, NODE_NAME_CHARACTER_LIST, NODE_NAME_DIGIT, NODE_NAME_EXPRESSION, NODE_NAME_IDENTIFIER, NODE_NAME_IF_STATEMENT, NODE_NAME_INT_EXPRESSION, NODE_NAME_INT_OPERATION, NODE_NAME_PRINT_STATEMENT, NODE_NAME_PROGRAM, NODE_NAME_SPACE, NODE_NAME_STATEMENT, NODE_NAME_STATEMENT_LIST, NODE_NAME_STRING_EXPRESSION, NODE_NAME_TYPE, NODE_NAME_VARIABLE_DECLARATION, NODE_NAME_WHILE_STATEMENT, NODE_TYPE_BRANCH, NODE_TYPE_LEAF, OUTPUT, PARSER, PROGRAMS, SPACE_SINGLE, SPACE_TAB, STRING_EXPRESSION_BOUNDARY, SYMBOL_ASSIGNMENT_OP, SYMBOL_BOOL_OP_EQUALS, SYMBOL_BOOL_OP_NOT_EQUALS, SYMBOL_CLOSE_ARGUMENT, SYMBOL_CLOSE_BLOCK, SYMBOL_INT_OP, SYMBOL_OPEN_ARGUMENT, SYMBOL_OPEN_BLOCK, WARNING } from './global';
import { ConcreteSyntaxTree } from './models/concrete_syntax_tree';
import { LexicalToken } from './models/lexical_token';
import { OutputConsoleMessage } from './models/output_console_message';
import { Program } from './models/program';

@Injectable()
export class ParserService {
  private _currProg: Program = new Program();
  private _current_cst: ConcreteSyntaxTree = new ConcreteSyntaxTree(null, null, 0);

  /**
   * Current index in the current program's token stream.
   */
  private _current_token_index: number = -1;

  /**
   * Current token in the current program's token stream.
   */
  private _current_token: LexicalToken | null = null;
  private _error_count: number = 0;
  private _warning_count: number = 0;
  private _output: Array<OutputConsoleMessage> = [];

  constructor() { }// constructor

  public parse(programs: Array<Program>): Map<string, any> {
    for (var prog of programs) {
      this._currProg = prog;

      // Program is invalid, skip due to lex error
      if (!prog.isValid) {
        this._warning_count++;
        prog.parserOutput.push(
          new OutputConsoleMessage(
            PARSER,
            WARNING,
            `Parser is skipping program ${prog.id} due to Lex Errors.`
          )
        );
      }// if

      // Try to parse validly lexed programs
      else {
        try {
          this.parse_program();
        }// try

        // Catch a fatal parse error
        catch (e) {
          if (e instanceof OutputConsoleMessage) {
            prog.parserOutput.push(e);
            prog.stacktrace.push(e);
          }// if
        }// catch

        // Report output to output console
        finally {
          // Finished parsing program #: # errors, # warnings
          prog.parserOutput.push(new OutputConsoleMessage(PARSER, INFO, `Parser finished parsing program ${prog.id}.`));
          prog.stacktrace.push(new OutputConsoleMessage(PARSER, INFO, `Parser finished parsing program ${prog.id}.`));

          // Push tree into the valid stack of trees
          prog.cst = this._current_cst;
          this._current_cst = new ConcreteSyntaxTree(null, null, 0);

          // Reset pointers
          this._current_token_index = -1;
        }// finally
      }// else
    }// for


    // Finished parsing all programs: # errors, # warnings
    this._output.push(new OutputConsoleMessage(PARSER, INFO, `Parser completed with ${this._warning_count} warnings.`));
    this._output.push(new OutputConsoleMessage(PARSER, INFO, `Parser completed with ${this._error_count} errors.`));

    let map = new Map<string, any[]>();
    map.set(PROGRAMS, programs);
    map.set(OUTPUT, this._output);
    return map;
  }// parse

  public parse_program(): void {
    // Get first token
    this.get_next_token();

    // Output to console which program is being parsed
    this._currProg.parserOutput.push(
      new OutputConsoleMessage(
        PARSER,
        INFO,
        `Parsing Program ${this._currProg.id}...`
      )
    );

    // Add the root node for CST
    this._current_cst.add_node(NODE_NAME_PROGRAM, NODE_TYPE_BRANCH, this._current_token);

    // Now the recursive descent part
    this.parse_block();
    this.match_token([END_OF_PROGRAM]);
  }// parse_program

  private parse_block(): void {
    this._current_cst.add_node(NODE_NAME_BLOCK, NODE_TYPE_BRANCH, this._current_token);
    this.match_token([SYMBOL_OPEN_BLOCK]);
    this.parse_statement_list();

    // Parse Statement Error falls through into match
    this.match_token(["STATEMENT", SYMBOL_CLOSE_BLOCK]);

    this._current_cst.climb_one_level();
  }// parse_block

  private parse_statement_list(): void {
    if (this.is_current_token_statement()) {
      this._current_cst.add_node(NODE_NAME_STATEMENT_LIST, NODE_TYPE_BRANCH, this._current_token);
      // console.log(`Parse Statement List: ${this._current_token.name} -> true`);
      this.parse_statement();
      this.parse_statement_list();
      this._current_cst.climb_one_level();
    }// if

    else {
      // Do nothing, it's an empty production!
    }// else
  }// parse_statement_list

  private parse_statement(): void {
    this._current_cst.add_node(NODE_NAME_STATEMENT, NODE_TYPE_BRANCH, this._current_token);
    switch (this._current_token!.name) {
      case KEYWORD_PRINT:
        this.parse_print_statement();
        break;

      // In the language, assignment statements can only start with an identifier.
      case IDENTIFIER:
        this.parse_assignment_statement();
        break;

      case KEYWORD_INT:
      // Non-terminal: int is a subset of the non-terminal: type.
      // Just fall through.

      case KEYWORD_STRING:
      // Non-terminal: string is a subset of the non-terminal: type.
      // Just fall through.

      case KEYWORD_BOOLEAN:
        // Non-terminal: boolean is a subset of the non-terminal: type.
        this.parse_variable_declaration();
        break;

      case KEYWORD_WHILE:
        this.parse_while_statement();
        break;

      case KEYWORD_IF:
        this.parse_if_statement();
        break;

      case SYMBOL_OPEN_BLOCK:
        this.parse_block();
        break;

      default:
        this._error_count++;

        // Record that this program has an error, if no already done so
        this._currProg.isValid = false;

        throw new OutputConsoleMessage(
          PARSER,
          ERROR,
          `Parse Statement Failure --> Expected [KEYWORD_PRINT, IDENTIFIER, KEYWORD_INT, KEYWORD_STRING, KEYWORD_BOOLEAN, KEYWORD_WHILE, KEYWORD_IF, OPEN_BLOCK], but got [${this._current_token!.name}] `
          + `|${this._current_token!.lexeme}| `
          + `at ${this._current_token!.lineNumber}:${this._current_token!.linePosition}.`
        );
    }// switch

    this._current_cst.climb_one_level();
  }// parse_statement

  private parse_print_statement(): void {
    this._current_cst.add_node(NODE_NAME_PRINT_STATEMENT, NODE_TYPE_BRANCH, this._current_token);
    this.match_token([KEYWORD_PRINT]);
    this.match_token([SYMBOL_OPEN_ARGUMENT]);
    this.parse_expression();
    this.match_token([SYMBOL_CLOSE_ARGUMENT]);
    this._current_cst.climb_one_level();
  }// parse_print_statement

  private parse_assignment_statement(): void {
    this._current_cst.add_node(NODE_NAME_ASSIGNMENT_STATEMENT, NODE_TYPE_BRANCH, this._current_token);
    this.parse_identifier();
    this.match_token([SYMBOL_ASSIGNMENT_OP]);
    this.parse_expression();
    this._current_cst.climb_one_level();
  }// parse_assignment_statement

  private parse_variable_declaration(): void {
    this._current_cst.add_node(NODE_NAME_VARIABLE_DECLARATION, NODE_TYPE_BRANCH, this._current_token);
    this.parse_type();
    this.parse_identifier();
    this._current_cst.climb_one_level();
  }// parse_variable_declaration

  private parse_while_statement(): void {
    this._current_cst.add_node(NODE_NAME_WHILE_STATEMENT, NODE_TYPE_BRANCH, this._current_token);
    this.match_token([KEYWORD_WHILE]);
    this.parse_boolean_expression();
    this.parse_block();
    this._current_cst.climb_one_level();
  }// parse_while_statement

  private parse_if_statement(): void {
    this._current_cst.add_node(NODE_NAME_IF_STATEMENT, NODE_TYPE_BRANCH, this._current_token);
    this.match_token([KEYWORD_IF]);
    this.parse_boolean_expression();
    this.parse_block();
    this._current_cst.climb_one_level();
  }// parse_if_statement

  private parse_expression(): void {
    this._current_cst.add_node(NODE_NAME_EXPRESSION, NODE_TYPE_BRANCH, this._current_token);
    switch (this._current_token!.name) {
      // Int expressions must start with a DIGIT
      case DIGIT:
        this.parse_int_expression();
        break;

      // Strings must start with a STRING EXPRESSION BOUNDARY
      case STRING_EXPRESSION_BOUNDARY:
        this.parse_string_expression();
        break;

      // Boolean expression can start with true
      case KEYWORD_TRUE:
      // Fall through

      // Boolean expression can start with false
      case KEYWORD_FALSE:
      // Fall through

      // Boolean expression can start with (
      case SYMBOL_OPEN_ARGUMENT:
        this.parse_boolean_expression();
        break;

      case IDENTIFIER:
        this.parse_identifier();
        break;

      default:
        this._error_count++;

        // Record that this program has an error, if no already done so
        this._currProg.isValid = false;

        throw new OutputConsoleMessage(
          PARSER,
          ERROR,
          `Parse Expression Failure --> Expected [DIGIT, STRING_EXPRESSION_BOUNDARY, SYMBOL_OPEN_ARGUMENT, IDENTIFIER], but got [${this._current_token!.name}] `
          + `|${this._current_token!.lexeme}| `
          + `at ${this._current_token!.lineNumber}:${this._current_token!.linePosition}.`
        );
    }// switch
    this._current_cst.climb_one_level();
  }//parse_expression

  private parse_int_expression(): void {
    this._current_cst.add_node(NODE_NAME_INT_EXPRESSION, NODE_TYPE_BRANCH, this._current_token);
    this.parse_digit();

    if (this._current_token!.name == SYMBOL_INT_OP) {
      this.parse_int_operation();
      this.parse_expression();
    }// if
    this._current_cst.climb_one_level();
  }//parse_int_expression

  private parse_string_expression(): void {
    this._current_cst.add_node(NODE_NAME_STRING_EXPRESSION, NODE_TYPE_BRANCH, this._current_token);
    this.match_token([STRING_EXPRESSION_BOUNDARY]);
    this.parse_character_list();
    this.match_token([STRING_EXPRESSION_BOUNDARY]);
    this._current_cst.climb_one_level();
  }//parse_string_expression

  private parse_boolean_expression(): void {
    this._current_cst.add_node(NODE_NAME_BOOLEAN_EXPRESSION, NODE_TYPE_BRANCH, this._current_token);

    if (this._current_token!.name == SYMBOL_OPEN_ARGUMENT) {
      this.match_token([SYMBOL_OPEN_ARGUMENT]);
      this.parse_expression();
      this.parse_boolean_operation();
      this.parse_expression();
      this.match_token([SYMBOL_CLOSE_ARGUMENT]);
    }// if

    else if (this._current_token!.name == KEYWORD_TRUE || this._current_token!.name == KEYWORD_FALSE) {
      this.parse_boolean_value();
    }// else if

    else {
      this._error_count++;

      // Record that this program has an error, if no already done so
      this._currProg.isValid = false;

      throw new OutputConsoleMessage(
        PARSER,
        ERROR,
        `Parse Expression Failure --> Expected [BOOLEAN EXPRESSION], but got [${this._current_token!.name}] `
        + `|${this._current_token!.lexeme}| `
        + `at ${this._current_token!.lineNumber}:${this._current_token!.linePosition}.`
      );
    } // else
    this._current_cst.climb_one_level();
  }//parse_boolean_expression

  private parse_identifier(): void {
    /**
     * Technicaly the grammar defines 
     * identifiers as a superset of characters so:
     * 
     *  this.parse_character();
     * 
     * But this leads to annoying and unnecessary type checking, 
     * so skipping to matching the token instead...
     */

    this._current_cst.add_node(NODE_NAME_IDENTIFIER, NODE_TYPE_BRANCH, this._current_token);
    this.match_token([IDENTIFIER]);
    this._current_cst.climb_one_level();
  }// parse_identifier

  private parse_character_list(): void {
    if (this._current_token!.name == CHARACTER) {
      this._current_cst.add_node(NODE_NAME_CHARACTER_LIST, NODE_TYPE_BRANCH, this._current_token);
      this.parse_character();
      this.parse_character_list();
      this._current_cst.climb_one_level();
    }// if

    else if (this._current_token!.name == SPACE_SINGLE || this._current_token!.name == SPACE_TAB) {
      this._current_cst.add_node(NODE_NAME_CHARACTER_LIST, NODE_TYPE_BRANCH, this._current_token);
      this.parse_space();
      this.parse_character_list();
      this._current_cst.climb_one_level();
    }// if

    else {
      // Epsilon, do nothing!
    }// else
  }// parse_character_list

  private parse_type(): void {
    this._current_cst.add_node(NODE_NAME_TYPE, NODE_TYPE_BRANCH, this._current_token);
    this.match_token([KEYWORD_INT, KEYWORD_STRING, KEYWORD_BOOLEAN]);
    this._current_cst.climb_one_level();
  }// parse_type

  private parse_character(): void {
    this._current_cst.add_node(NODE_NAME_CHARACTER, NODE_TYPE_BRANCH, this._current_token);
    this.match_token([CHARACTER]);
    this._current_cst.climb_one_level();
  }// parse_character

  private parse_space(): void {
    this._current_cst.add_node(NODE_NAME_SPACE, NODE_TYPE_BRANCH, this._current_token);
    this.match_token([SPACE_SINGLE, SPACE_TAB]);
    this._current_cst.climb_one_level();
  }// parse_space

  private parse_digit(): void {
    this._current_cst.add_node(NODE_NAME_DIGIT, NODE_TYPE_BRANCH, this._current_token);
    this.match_token([DIGIT]);
    this._current_cst.climb_one_level();
  }// parse_digit

  private parse_boolean_operation(): void {
    this._current_cst.add_node(NODE_NAME_BOOLEAN_OPERATION, NODE_TYPE_BRANCH, this._current_token);
    this.match_token([SYMBOL_BOOL_OP_EQUALS, SYMBOL_BOOL_OP_NOT_EQUALS]);
    this._current_cst.climb_one_level();
  }// parse_boolean_operation

  private parse_boolean_value(): void {
    this._current_cst.add_node(NODE_NAME_BOOLEAN_VALUE, NODE_TYPE_BRANCH, this._current_token);
    this.match_token([KEYWORD_TRUE, KEYWORD_FALSE]);
    this._current_cst.climb_one_level();
  }// parse_boolean_operation

  private parse_int_operation(): void {
    if (this._current_token!.name == SYMBOL_INT_OP) {
      this._current_cst.add_node(NODE_NAME_INT_OPERATION, NODE_TYPE_BRANCH, this._current_token);
      this.match_token([SYMBOL_INT_OP]);
      this._current_cst.climb_one_level();
    }// if
  }// parse_int_operation

  private match_token(expected_token_names: Array<string>): void {
    if (!expected_token_names.includes(this._current_token!.name)) {
      this._error_count++;

      // Record that this program has an error, if no already done so
      this._currProg.isValid = false;

      throw new OutputConsoleMessage(
        PARSER,
        ERROR,
        `Expected [${expected_token_names.toString()}], but got [${this._current_token!.name}]. `
        + `|${this._current_token!.lexeme}| `
        + `at ${this._current_token!.lineNumber}:${this._current_token!.linePosition}.`
      );
    }// if

    this._currProg.stacktrace.push(
      new OutputConsoleMessage(
        PARSER,
        INFO,
        `Valid token consumed: `
        + `[${this._current_token!.name}] `
        + `|${this._current_token!.lexeme}| `
        + `at ${this._current_token!.lineNumber}:${this._current_token!.linePosition}`
      )// OutputConsoleMessage
    );// this.debug.push

    this._current_cst.add_node(this._current_token!.lexeme, NODE_TYPE_LEAF, this._current_token);
    this.consume_token();
    this.get_next_token();
  }// match_token

  /**
   * Checks for parse errors.
   * 
   * Uses the list of consumed tokens to throw parser errors. 
   * For example, this function will notice if a KEYWORD_PRINT_TOKEN 
   * is not followed by an OPEN_ARGUMENT_TOKEN and throw a parse error.
   */
  private consume_token(): void {
    // console.log(`Consumed ${this._current_token.name}`);
  }// consume_token

  private get_next_token(): void {
    // Advance token pointer
    this._current_token_index++;

    // Ran out of tokens in the current program
    if (this._current_token_index >= this._currProg.cleanTokenStream.length) { return; }// if

    // Retrieve token from token stream
    this._current_token = this._currProg.cleanTokenStream[this._current_token_index];
    // console.log(`Retrieved next Token [${this._current_token.name}], Lexeme % ${this._current_token.lexeme} %`);
  }// get_next_token

  private is_current_token_statement(): boolean {
    let statements: Array<string> = [
      KEYWORD_PRINT,
      KEYWORD_WHILE,
      KEYWORD_IF,
      IDENTIFIER,
      KEYWORD_BOOLEAN,
      KEYWORD_INT,
      KEYWORD_STRING,
      SYMBOL_OPEN_BLOCK,
    ];

    for (let statement of statements) {
      if (this._current_token!.name == statement) {
        return true;
      }// if
    }// for
    return false;
  }// token_is_statement

  public get_error_count(): number {
    return this._error_count;
  }// getErrorCount

  public get_warning_count(): number {
    return this._warning_count;
  }// getWarningCount
}// class
