import { Injectable } from '@angular/core';
import { CodeGenerationService } from './compiler/code-generation.service';
import { PROGRAMS } from './compiler/global';
import { LexerService } from './compiler/lexer.service';
import { ParserService } from './compiler/parser.service';
import { SemanticAnalysisService } from './compiler/semantic-analysis.service';

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
  public semanticAnalysis: SemanticAnalysisService = new SemanticAnalysisService();

  /**
   * Semantic analysis, enforces scope, or type checking, and other rules of the grammar.
   * 
   * Semantic analysis will generate an Abstract Syntax Tree, from the Parser's 
   * Concrete Syntax Tree which is the Intermediate Representation sent to code generation. 
   */
  public codeGeneration: CodeGenerationService = new CodeGenerationService();

  /**
   * Compile Button
   * @param {string} rawSourceCode - The raw source code from Code Mirror.
   */
  async* compile(rawSourceCode: string): AsyncGenerator<any, void, unknown>{
    // Language is white-space sensitive, remove outside whitespace
    let trimmedSourceCode = rawSourceCode.trim();

    // Convert source code into a steam of tokens
    this.lexer = new LexerService();
    let lexerOutput: Map<string, any> = this.lexer.lex(trimmedSourceCode);
    yield lexerOutput;

    // Step 2: Parse
    this.parser = new ParserService();
    let parserOutput: Map<string, any> = this.parser.parse(lexerOutput.get(PROGRAMS));
    yield parserOutput;

    // Step 3: Semantic Analysis
    this.semanticAnalysis = new SemanticAnalysisService();
    let semanticAnalysisOutput: Map<string, any> = this.semanticAnalysis.semanticAnalysis(parserOutput.get(PROGRAMS));
    yield semanticAnalysisOutput;

    // Step 4: Code Generation
    this.codeGeneration = new CodeGenerationService();
    let codeGenerationOutput: Map<string, any> = this.codeGeneration.codeGeneration(semanticAnalysisOutput.get(PROGRAMS));
    yield codeGenerationOutput;
    
    return;
  } // compile
} // CompilerService
