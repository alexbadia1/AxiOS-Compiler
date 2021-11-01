import { Injectable } from '@angular/core';
import { LexerService } from './compiler/lexer.service';
import { ParserService } from './compiler/parser.service';
@Injectable({
  providedIn: 'root'
})

export class CompilerService {

  /**
   * Lexer validates given input is part of the language.
   * 
   * Lexer will generate tokens to be passed to the parser. 
   * Compiliation will stop if there are any syntatical errors to report.
   */
  private lexer: LexerService = new LexerService();

  /**
   * Parser enforces the first and follow sets of the language.
   * 
   * For example, unmatched parenthesis, brackets, or if, say, the keyword 
   * "while" is not followed by a boolean expression of some sort, et cetera.
   * 
   * Parser will generate a concrete syntax trees to be passed to the semantic.
   * Compilation will stop if there are any parse errors to report.
   */
  public parser: ParserService = new ParserService();

  /**
   * Semantic analysis, enforces scope, or type checking, and other rules of the grammar.
   * 
   * Semantic analysis will generate an Abstract Syntax Tree, from the Parser's 
   * Concrete Syntax Tree which is the Intermediate Representation sent to code generation. 
   */
  // public static semantic_analysis: NightingaleCompiler.SemanticAnalysis;

  /**
   * Semantic analysis, enforces scope, or type checking, and other rules of the grammar.
   * 
   * Semantic analysis will generate an Abstract Syntax Tree, from the Parser's 
   * Concrete Syntax Tree which is the Intermediate Representation sent to code generation. 
   */
  // public static code_generation: NightingaleCompiler.CodeGeneration;

  //
  // TODO: Implement more stages...
  //

  public lex() {

  }// compile

  /**
   * Compile Button
   * @param {string} rawSourceCode - The raw source code from Code Mirror.
   */
  async* compile(rawSourceCode: string): AsyncGenerator<any, void, unknown>{
    // Language is white-space sensitive
    let trimmedSourceCode = rawSourceCode.trim();

    console.log(trimmedSourceCode);
    // Convert source code into a steam of tokens
    this.lexer = new LexerService();
    let lexerOutput: Map<string, any> = this.lexer.lex(trimmedSourceCode);
    yield lexerOutput;

    // Step 2: Parse
    this.parser = new ParserService();
    let parserOutput: Map<string, any> = this.parser.parse(lexerOutput.get('programs'));
    yield parserOutput;
    return;

    // Step 3: Semantic Analysis
    // this.semantic_analysis = new NightingaleCompiler.SemanticAnalysis(this.parser.concrete_syntax_trees, this.parser.invalid_parsed_programs);
    // let ast_controller = new NightingaleCompiler.AbstractSyntaxTreeController(this.semantic_analysis.abstract_syntax_trees);
    // let scope_tree_controller = new NightingaleCompiler.ScopeTreeController(this.semantic_analysis.scope_trees);

    // Step 4: Code Generation
    // this.code_generation = new NightingaleCompiler.CodeGeneration(this.semantic_analysis.abstract_syntax_trees, this.semantic_analysis.invalid_semantic_programs);

    // Final output
    // let output_console_model: OutputConsoleModel = new OutputConsoleModel(
    //   this.lexer.output,
    //   cst_controller,
    //   ast_controller,
    //   scope_tree_controller,
    //   this.parser.output,
    //   this.semantic_analysis.output,
    //   this.parser.invalid_parsed_programs,
    //   this.code_generation.output,
    //   this.code_generation.programs,
    //   this.code_generation.invalid_programs,
    // );

    // let debug_console_model: DebugConsoleModel = new DebugConsoleModel(
    //   this.lexer.debug_token_stream,
    //   this.parser.debug,
    //   this.semantic_analysis.verbose,
    //   this.code_generation.verbose,
    // );
    // // let stacktrace_console_model: StacktraceConsoleModel = new StacktraceConsoleModel(this.lexer.stacktrace_stack);
    // let footer_model: FooterModel = new FooterModel(
    //   (this.lexer.errors_stream.length + this.parser.get_error_count() + this.semantic_analysis.get_error_count() + this.code_generation.get_error_count()),
    //   (this.lexer.warnings_stream.length + this.parser.get_warning_count() + this.semantic_analysis.get_warning_count() + this.code_generation.get_warning_count())
    // );// footer_model
  }// compile
}
