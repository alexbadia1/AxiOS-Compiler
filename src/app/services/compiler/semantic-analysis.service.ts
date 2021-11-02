import { Injectable } from '@angular/core';
import { AST_NODE_NAME_BOOLEAN_EQUALS, AST_NODE_NAME_BOOLEAN_NOT_EQUALS, BOOLEAN, ERROR, INFO, INT, NODE_NAME_ASSIGNMENT_STATEMENT, NODE_NAME_BLOCK, NODE_NAME_BOOLEAN_EXPRESSION, NODE_NAME_IDENTIFIER, NODE_NAME_IF_STATEMENT, NODE_NAME_INT_EXPRESSION, NODE_NAME_PRINT_STATEMENT, NODE_NAME_SCOPE, NODE_NAME_STATEMENT, NODE_NAME_STATEMENT_LIST, NODE_NAME_STRING_EXPRESSION, NODE_NAME_VARIABLE_DECLARATION, NODE_NAME_WHILE_STATEMENT, NODE_TYPE_BRANCH, NODE_TYPE_LEAF, OUTPUT, PROGRAMS, SEMANTIC_ANALYSIS, STRING, UNDEFINED, WARNING } from './global';
import { AbstractSyntaxTree } from './models/abstract_syntax_tree';
import { ConcreteSyntaxTree } from './models/concrete_syntax_tree';
import { CustomNode } from './models/node';
import { OutputConsoleMessage } from './models/output_console_message';
import { Program } from './models/program';
import { ScopeTable, VariableMetaData } from './models/scope_table';
import { ScopeTree } from './models/scope_tree';

@Injectable()
export class SemanticAnalysisService {
  private _error_count: number = 0;
  private _warning_count: number = 0;
  private _curr_prog: Program = new Program();
  private _output: Array<OutputConsoleMessage> = [];
  private _current_scope_tree: ScopeTree = new ScopeTree();
  private _current_ast: AbstractSyntaxTree = new AbstractSyntaxTree();

  constructor() { }// constructor 

  public semanticAnalysis(programs: Array<Program>) {
    for (let prog of programs) {
      this._curr_prog = prog;
      // Skip invalid parsed programs
      //
      // Probably shouldn't be passing invalid parse trees around, though
      // It'd be cool to show visually, where exactly the parse tree messed up.
      if (!prog.isValid) {
        this._warning_count++;
        prog.semanticAnalysisOutput.push(
          new OutputConsoleMessage(
            SEMANTIC_ANALYSIS,
            WARNING,
            `Skipping program ${prog.id} due to parse errors.`
          ) // OutputConsoleMessage
        ); // prog.semanticAnalysisOutput.push
        prog.stacktrace.push(
          new OutputConsoleMessage(
            SEMANTIC_ANALYSIS,
            WARNING,
            `Skipping program ${prog.id} due to parse errors.`
          ) // OutputConsoleMessage
        ); // prog.stacktrace.push
      } // if : invalid program

      // Valid
      else {
        prog.semanticAnalysisOutput.push(
          new OutputConsoleMessage(
            SEMANTIC_ANALYSIS,
            INFO,
            `Performing Semantic Analysis on program ${prog.id}...`
          ) // OutputConsoleMessage
        ); // prog.semanticAnalysisOutput.push
        prog.stacktrace.push(
          new OutputConsoleMessage(
            SEMANTIC_ANALYSIS,
            INFO,
            `Performing Semantic Analysis on program ${prog.id}...`
          ) // OutputConsoleMessage
        ); // prog.stacktrace.push

        // Create a scope tree
        this._current_scope_tree = new ScopeTree();
        // TODO: This will probably be a paint point...
        this._current_scope_tree.program = prog.cst.program;
        prog.scopeTree = this._current_scope_tree;

        // Traverse the CST and create the AST while also doing type and scope checking
        this.generate_abstract_syntax_tree(prog.cst);
        prog.ast = this._current_ast;

        // Check for error
        this.check_for_warnings();

        prog.semanticAnalysisOutput.push(
          new OutputConsoleMessage(
            SEMANTIC_ANALYSIS,
            INFO,
            `Finished semantic analysis on program ${prog.id}.`
          )// OutputConsoleMessage
        );// prog.semanticAnalysisOutput.push
        prog.stacktrace.push(
          new OutputConsoleMessage(
            SEMANTIC_ANALYSIS,
            INFO,
            `Finished semantic analysis on program ${prog.id}.`
          )// OutputConsoleMessage
        );// this.verbose[cstIndex].push
      } // else: valid program
    } // for: all programs

    // Final output
    this._output.push(
      new OutputConsoleMessage(
        SEMANTIC_ANALYSIS,
        INFO,
        `Semantic Analysis completed with ${this._warning_count} warning(s)`
      )// OutputConsoleMessage
    );// this._output
    this._output.push(
      new OutputConsoleMessage(
        SEMANTIC_ANALYSIS,
        INFO,
        `Semantic Analysis completed with  ${this._error_count} error(s)`
      )// OutputConsoleMessage
    );// this._output

    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        SEMANTIC_ANALYSIS,
        INFO,
        `Semantic Analysis completed with ${this._warning_count} warning(s)`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push
    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        SEMANTIC_ANALYSIS,
        INFO,
        `Semantic Analysis completed with  ${this._error_count} error(s)`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push

    let map = new Map<string, any[]>();
    map.set(PROGRAMS, programs);
    map.set(OUTPUT, this._output);
    return map;
  }// semanticAnalysis

  /**
   * Entry point to the semantic analysis algorithm
   * @param cst concrete syntax tree
   */
  private generate_abstract_syntax_tree(cst: ConcreteSyntaxTree): void {
    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        SEMANTIC_ANALYSIS,
        INFO,
        `Generating Abstract Syntax Tree...`
      ) // OutputConsoleMessage
    ); // this._curr_prog.stacktrace.push

    // Make new ast
    this._current_ast = new AbstractSyntaxTree();

    // Store scope tree in AST
    this._current_ast.scope_tree = this._current_scope_tree;

    // Get program number from CST
    this._current_ast.program = cst.program;

    // Begin adding nodes to the ast from the cst, filtering for the key elements
    this.add_subtree_to_ast(cst.root.children_nodes[0]);
  }// generate_abstract_syntax_trees

  private add_subtree_to_ast(cst_current_node: CustomNode, current_scope_table: ScopeTable | null= null): void {
    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        SEMANTIC_ANALYSIS,
        INFO,
        `Attempting to add ${cst_current_node.name} subtree to abstract syntax tree.`
      ) // new OutputConsoleMessage
    ); // this._curr_prog.stacktrace.push
    
    switch (cst_current_node.name) {
      case NODE_NAME_BLOCK:
        this._add_block_subtree_to_ast(cst_current_node);
        break;
      case NODE_NAME_VARIABLE_DECLARATION:
        this._add_variable_declaration_subtree_to_ast(cst_current_node, current_scope_table);
        break;
      case NODE_NAME_ASSIGNMENT_STATEMENT:
        this._add_assignment_statement_subtree_to_ast(cst_current_node);
        break;
      case NODE_NAME_PRINT_STATEMENT:
        this._add_print_subtree_to_ast(cst_current_node);
        break;
      case NODE_NAME_WHILE_STATEMENT:
        this._add_while_subtree_to_ast(cst_current_node);
        break;
      case NODE_NAME_IF_STATEMENT:
        this._add_if_subtree_to_ast(cst_current_node);
        break;
      default:
        throw Error(`Semantic Analysis Failed: [${cst_current_node.name}] does not have a valid child [BLOCK, VARIABLE DECLARATION< ASSIGNMENT STATEMENT, PRINT STATEMENT, WHILE STATEMENT, IF STATEMENT]`);
    }// switch

    // If already at a block, try to climb one node higher...
    if (this._current_ast.current_node!.name === NODE_NAME_BLOCK) {
      this._climb_ast_one_level();
    }// if

    // Move the AST's current node pointer up one level
    // at a time and stops on a Node(Block) when reached.
    this._climb_ast_to_nearest_node(NODE_NAME_BLOCK);
  }// add_subtree_to_ast

  private _skip_node_for_ast(cst_current_node: CustomNode, current_scope_table: ScopeTable): void {
    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        SEMANTIC_ANALYSIS,
        INFO,
        `Traversing over ${cst_current_node.name} concrete syntax tree node.`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push
    switch (cst_current_node.name) {
      case NODE_NAME_STATEMENT:
        this._skip_statement(cst_current_node, current_scope_table);
        break;
      case NODE_NAME_STATEMENT_LIST:
        this._skip_statement_list(cst_current_node, current_scope_table);
        break;
      default:
        throw Error(`Semantic Analysis Failed: [${cst_current_node.name}] does not have a valid child [STATEMENT, STATEMENT_LIST]`);
    }// switch
  }// skip_node_for_ast

  /**
   * Constructs a subtree in the abstract syntax tree rooted with Block and adds the child:
   *  - statement list
   * 
   * Remember, if you built your tree correctly..
   *   - Block ::== { StatementList }
   *    - Node(Block).children[0] --> Open Block Lexem [{]
   *    - Node(Block).children[1] --> Node(Statement List)
   *    - Node(Block).children[2] --> Close Block Lexeme [}]
   *  
   * @param cst_current_node current node in the cst.
   */
  private _add_block_subtree_to_ast(cst_current_node: CustomNode): void {
    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        SEMANTIC_ANALYSIS,
        INFO,
        `Adding ${cst_current_node.name} subtree to abstract syntax tree.`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push

    // Add a new scope node to the scope tree
    let scope_table: ScopeTable = new ScopeTable();
    this._current_scope_tree.add_node(NODE_NAME_SCOPE, NODE_TYPE_BRANCH, scope_table);

    // Add new BLOCK node
    // SYMBOL_OPEN_BLOCK Token
    this._current_ast.add_node(cst_current_node.name, NODE_TYPE_BRANCH, false, false, cst_current_node.getToken(), scope_table);

    // Get child node, which should be a statement list
    let statement_list_node = cst_current_node.children_nodes[1];

    // Skip the statement list node
    if (cst_current_node.children_nodes.length === 3) {
      this._skip_node_for_ast(statement_list_node, scope_table);
      this._current_scope_tree.climb_one_level();
    }// if
    else {
      // Do nothing, it's an empty block
      this._current_scope_tree.climb_one_level();
    }// else
  }// _add_block_subtree_to_ast\

  /**
   * Traverses over the StatementList node in the CST, recursively adding statement subtrees to the AST.
   * Remember, if you built your tree correctly..
   *   - StatementList ::== Statement StatementList
   *     - Node(Statement List).children[0] --> Node(Statement)
   *     - Node(Statement List).children[1] --> Node(Statement List)
   */
  private _skip_statement_list(cst_current_node: CustomNode, current_scope_table: ScopeTable): void {
    // Remember, if you built your tree correctly..
    //
    //   Node(Statement List).children[0] --> Node(Statement)
    //   Node(Statement List).children[1] --> Node(Statement List)
    //
    // Get statement node
    let statement_node: CustomNode = cst_current_node.children_nodes[0];

    // Skip over statement node
    this._skip_node_for_ast(statement_node, current_scope_table);

    // If statement list follows, traverse and skip over it
    if (cst_current_node.children_nodes.length > 1) {
      // Get statement list node
      let statement_list_node: CustomNode = cst_current_node.children_nodes[1];

      // Skip statement list node
      this._skip_node_for_ast(statement_list_node, current_scope_table);
    }// if
  }// _skip_statement_list

  private _skip_statement(cst_current_node: CustomNode, current_scope_table: ScopeTable): void {
    let statement_val: CustomNode = cst_current_node.children_nodes[0];

    // Add the statements (right-hand) value
    this.add_subtree_to_ast(statement_val, current_scope_table);
  }// _skip_statement_list

  /**
   * Constructs a subtree in the abstract syntax tree 
   * rooted with variable declaration and add two children:
   *  - type
   *  - id
   * 
   * Remember, if you built your tree correctly..
   *   - VarDecl ::== type Id
   *     - Node(Variable Declaration).children[0] --> Node(Type)
   *     - Node(Variable Declaration).children[1] --> Node(Identifier)
   * 
   *     - Node(Type).children[0] --> Type Lexeme
   * 
   *     - Node(Identifier).children[0] --> Identifier Lexeme
   * @param cst_current_node current node in the cst
   */
  private _add_variable_declaration_subtree_to_ast(cst_current_node: CustomNode, current_scope_table: ScopeTable | null): void {
    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        SEMANTIC_ANALYSIS,
        INFO,
        `Adding variable declaration subtree to abstract syntax tree.`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push

    let type_node: CustomNode = cst_current_node.children_nodes[0].children_nodes[0];
    let identifier_node: CustomNode = cst_current_node.children_nodes[1].children_nodes[0];

    // Check current scope table
    let hasCollision: boolean = current_scope_table!.has(identifier_node.name);

    // Mark as invalid if collison
    if (hasCollision) {
      this._error_count += 1;
      this._curr_prog.isValid = false;
      this._curr_prog.semanticAnalysisOutput.push(
        new OutputConsoleMessage(
          SEMANTIC_ANALYSIS,
          ERROR,
          `Cannot redeclare block-scoped variable '${cst_current_node!.getToken()!.lexeme}' at ${cst_current_node!.getToken()!.lineNumber}:${cst_current_node!.getToken()!.linePosition}`
        )// OutputConsoleMessage
      );// this.output[this.output.length - 1].push

      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          SEMANTIC_ANALYSIS,
          ERROR,
          `Cannot redeclare block-scoped variable '${cst_current_node!.getToken()!.lexeme}' at ${cst_current_node!.getToken()!.lineNumber}:${cst_current_node!.getToken()!.linePosition}`
        )// OutputConsoleMessage
      );// this.verbose[this.verbose.length - 1].push
    }// if

    let ast_node = this._current_ast.add_node(cst_current_node.name, NODE_TYPE_BRANCH, hasCollision, false, cst_current_node.getToken());

    current_scope_table!.put(
      identifier_node.name,
      new VariableMetaData(
        type_node.name,
        false,
        false,
        cst_current_node!.getToken()!.lineNumber,
        cst_current_node!.getToken()!.linePosition,
        ast_node,
      )// VariableMetaData
    );// current_scope_table.put

    // Add children to ast subtree at the SAME LEVEL
    //
    // Meaning, climb up the tree ONE level after each insertion 
    // (since tree.addNode() inserts a new node at a new, increased, depth)
    this._current_ast.add_node(type_node.name, NODE_TYPE_BRANCH, hasCollision, false, cst_current_node.getToken());
    this._climb_ast_one_level();
    this._current_ast.add_node(identifier_node.name, NODE_TYPE_BRANCH, hasCollision, false, cst_current_node.getToken());
    this._climb_ast_one_level();

  }// _add_variable_declaration_subtree_to_ast

  /**
   * Construct a subtree in the abstract syntax tree
   * rooted with an Assignment Statement and add two children:
   *   - id 
   *   - results of the expression being assigned.
   * 
   * Remember, if you built your tree correctly..
   *  - AssignmentStatement ::== Id = Expr
   *    - Node(Assignment Statement).children[0] --> Node(Identifier)
   *    - Node(Assignment Statement).children[1] --> Node(Assignment Operator)
   *    - Node(Assignment Statement).children[2] --> Node(Expression)
   *
   *    - Node(Identifier).children[0] --> Identifier Lexeme
   * 
   *    - Node(Expression).children[0] --> Node(Integer Expression)
   *    - Node(Expression).children[0] --> Node(String Expression)
   *    - Node(Expression).children[0] --> Node(Boolean Expression)
   *    - Node(Expression).children[0] --> Node(Id)
   * 
   * @param cst_current_node current node in the cst.
   */
  private _add_assignment_statement_subtree_to_ast(cst_current_node: CustomNode): void {
    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        SEMANTIC_ANALYSIS,
        INFO,
        `Adding assignment statement subtree to abstract syntax tree.`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push

    let identifier_node: CustomNode = cst_current_node.children_nodes[0].children_nodes[0];

    // Check scope tree if the variable exists and get its type
    let error = true;
    let var_matadata: VariableMetaData | null | undefined = this.is_variable_declared(identifier_node);

    if (var_matadata !== null) {
      var_matadata!.isInitialized = true;
      error = false;
    }// if

    // Add root Node(Assignment Statement) for asignment statement subtree
    this._current_ast.add_node(cst_current_node.name, NODE_TYPE_BRANCH, error, false);

    // Add the identifier to assignment statement subtree
    this._current_ast.add_node(identifier_node.name, NODE_TYPE_LEAF, error, false, cst_current_node.getToken());

    // Ignore the assignment operator: Node(=)
    // let assignment_op = cst_current_node.children_nodes[1]

    // Add the expression node to assignment statement subtree at the SAME LEVEL
    let expression_node: CustomNode = cst_current_node.children_nodes[2];

    // I've used null-aware operators in Dart, apparently Typescript has them too, damn...
    this._add_expression_subtree(expression_node, var_matadata?.type ?? UNDEFINED);
  }// _add_assignment_statement_subtree_to_ast

  /**
   * Construct a subtree in the abstract syntax tree
   * rooted with an Expression and add one of the following children:
   *   - Integer Expression 
   *   - String Expression
   *   - Boolean Expression
   *   - Identifier
   */
  private _add_expression_subtree(expression_node: CustomNode, parent_var_type: string | null): string | null {
    let error: boolean = true;
    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        SEMANTIC_ANALYSIS,
        INFO,
        `Attempting to add ${expression_node.children_nodes[0].name} subtree to abstract syntax tree.`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push

    switch (expression_node.children_nodes[0].name) {
      case NODE_NAME_INT_EXPRESSION:
        this._add_integer_expression_subtree_to_ast(expression_node.children_nodes[0], parent_var_type)
        return INT;

      case NODE_NAME_STRING_EXPRESSION:
        this._add_string_expression_subtree_to_ast(expression_node.children_nodes[0], parent_var_type);
        return STRING;

      case NODE_NAME_BOOLEAN_EXPRESSION:
        this._add_boolean_expression_subtree_to_ast(expression_node.children_nodes[0], parent_var_type);
        return BOOLEAN;

      case NODE_NAME_IDENTIFIER:
        let hasWarning: boolean = false;
        // Identifier node
        let identifier_node = expression_node.children_nodes[0].children_nodes[0];

        // Make sure identifier was declared
        let var_metadata: VariableMetaData | null |undefined = this.is_variable_declared(expression_node.children_nodes[0].children_nodes[0]);
        let curr_var_type: string | null = UNDEFINED;

        // Identifier was declared
        if (var_metadata !== null) {
          // Identifier is being used other than in an 
          // assignment statement, mark identifier as being used...
          var_metadata!.isUsed = true;

          // Check for type mismatch error
          curr_var_type = var_metadata!.type;

          // If parent data type wasn't specified make it equal to the current datatype
          if (parent_var_type === UNDEFINED) {
            parent_var_type = curr_var_type;
          }// if

          error = !this.check_type(parent_var_type, expression_node.children_nodes[0], curr_var_type);

          // Warn if identifier is unitialized
          if (!var_metadata!.isInitialized) {
            hasWarning = true;
            this._curr_prog.semanticAnalysisOutput.push(
              new OutputConsoleMessage(
                SEMANTIC_ANALYSIS,
                WARNING,
                `'${identifier_node.name}' is being read but its value is never initialized (${identifier_node!.getToken()!.lineNumber}:${identifier_node.getToken()!.linePosition})`
              )// OutputConsoleMessage
            );// this.output[this.output.length - 1].push

            this._curr_prog.stacktrace.push(
              new OutputConsoleMessage(
                SEMANTIC_ANALYSIS,
                WARNING,
                `'${identifier_node.name}' is being read but its value is never initialized (${identifier_node!.getToken()!.lineNumber}:${identifier_node!.getToken()!.linePosition})`
              )// OutputConsoleMessage
            );// this.verbose[this.verbose.length - 1].push
            this._warning_count += 1;
          }// if
        }// if
        this._current_ast.add_node(
          identifier_node.name,
          NODE_TYPE_LEAF,
          error,
          hasWarning,
          identifier_node.getToken());

        return curr_var_type;
      default:
        throw Error(`Semantic Analysis Failed: [${expression_node.name}] does not have a valid child [INT EXPRESSION, STRING EXPRESSION, BOOLEAN EXPRESSION, IDENTIFIER]`);
    }// switch
  }// add_expression_to_assignment_statement_subtree

  /**
   * Constructs a subtree in the abstract syntax tree rooted with an Integer Expression, adding:
   *   - Digit IntOp Expression
   *   - Digit
   * 
   * Remember, if you built your tree correctly...
   * - IntExpr ::= digit intop Expr
   *   - Node(Integer Expression).children[0] --> Node(Digit)
   *   - Node(Integer Expression).children[1] --> Node(Integer Operation)
   *   - Node(Integer Expression).children[2] --> Node(Expression)
   *
   * - IntExpr ::= digit
   *   - Node(Digit).children[0] --> Digit Lexeme [0-9]
   *   - Node(Integer Operation).children[0] --> Integer Operation Lexeme [+]
   */
  private _add_integer_expression_subtree_to_ast(integer_expression_node: CustomNode, parent_var_type: string | null) {
    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        SEMANTIC_ANALYSIS,
        INFO,
        `Adding ${integer_expression_node.name} subtree to abstract syntax tree.`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push

    // Integer expression is DIGIT--INTOP--EXPRESSION
    let digit_value_node: CustomNode = integer_expression_node.children_nodes[0].children_nodes[0];

    // If, no parent type was given to enforce type matching...
    let valid_type = false;
    if (parent_var_type === UNDEFINED) {
      // Enforce type matching using the current type from now on.
      parent_var_type = INT;
    }// if

    // Else, there is a parent type to enforce type matching with.
    else {
      valid_type = !this.check_type(parent_var_type, digit_value_node, INT);
    }// else

    if (integer_expression_node.children_nodes.length > 1) {
      let integer_operation_lexeme_node: CustomNode = integer_expression_node.children_nodes[1].children_nodes[0];
      let expression_node: CustomNode = integer_expression_node.children_nodes[2];

      this._current_ast.add_node(
        integer_operation_lexeme_node.name,
        NODE_TYPE_BRANCH,
        valid_type,
        false,
        integer_operation_lexeme_node.getToken());

      this._current_ast.add_node(
        digit_value_node.name,
        NODE_TYPE_LEAF,
        valid_type,
        false,
        digit_value_node.getToken());

      // Add expression subtree to the assignment statement subtree
      this._add_expression_subtree(expression_node, parent_var_type);
    }// if

    else if (integer_expression_node.children_nodes.length === 1) {
      this._current_ast.add_node(
        digit_value_node.name,
        NODE_TYPE_LEAF,
        valid_type,
        false,
        digit_value_node.getToken());
    }// else if 

    else {
      // This should never happen based on our language
      throw ("AST failed to find children for CST Integer Expression Node!");
    }// else
  }// add_integer_expression_subtree_to_ast

  /**
   * Constructs a subtree in the abstract syntax tree rooted with a String Expression, adding:
   *   - " CharList "
   * 
   * Remember, if you built your tree correctly...
   * - StringExpr ::== " CharList "
   *    - Node(String Expression).children[0] --> Open String Expression boundary ["]
   *    - Node(String Expression).children[1] --> Node(Character List)
   *    - Node(String Expression).children[2] --> Close String Expression boundary ["]
   *
   * - CharList ::== char CharList
   *    - Node(Character List).children[0] --> Node(Character) | Node(Space)
   *    - Node(Character List).children[1] --> Node(Character List)
   * 
   * - CharList ::== space CharList
   *    - Node(Character List).children[0] --> Node(Space)
   *    - Node(Character List).children[1] --> Node(Character List)
   * 
   * - CharList ::==  ε
   *    - Node(Character List).children[0] --> Node(Space)
   *
   * - Character ::== [a-z]
   *    - Node(Character) --> Character Lexeme
   */
  private _add_string_expression_subtree_to_ast(string_expression_node: CustomNode, parent_var_type: string | null) {
    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        SEMANTIC_ANALYSIS,
        INFO,
        `Adding ${string_expression_node.name} subtree to abstract syntax tree.`
      )// OutputConsoleMessage
    );// this.verbose[this.verbose.length - 1].push

    let open_string_expression_node: CustomNode = string_expression_node.children_nodes[0];

    // If, no parent type was given to enforce type matching...
    let valid_type = false;
    if (parent_var_type === UNDEFINED) {

      // Enforce type matching using the current type from now on.
      parent_var_type = STRING;
    }// if

    // Else, there is a parent type to enforce type matching with.
    else {
      valid_type = !this.check_type(parent_var_type, open_string_expression_node, STRING);
    }// else

    // Due to size limitations of my already huge AST, I will be appending string characters into a single node.
    //
    // Append a STRING_EXPRESSION_BOUNDARY to start string
    let string: string = "\"";

    // Not an empty string, iteratively add each character.
    if (string_expression_node.children_nodes.length > 2) {
      let curr_char_list_node: CustomNode = string_expression_node.children_nodes[1];

      // Get entire string
      while (curr_char_list_node !== undefined && curr_char_list_node !== null) {
        let char_node: CustomNode = curr_char_list_node.children_nodes[0];
        let char_lexeme_node: CustomNode = char_node.children_nodes[0];

        string += char_lexeme_node.name;

        // Get next charlist, if it exists
        if (curr_char_list_node.children_nodes.length > 1) {
          curr_char_list_node = curr_char_list_node.children_nodes[1];
        }// if

        // Ran out of charlists, so return current string
        else {
          break;
        }// else
      }// while
    }// else

    // Append a STRING_EXPRESSION_BOUNDARY to close string
    string += "\"";

    this._current_ast.add_node(
      string,
      NODE_TYPE_LEAF,
      valid_type,
      false,
    );
  }// add_string_expression_subtree_to_ast

  /**
   * Constructs a subtree in the abstract syntax tree rooted with a Boolean Expression, adding:
   *   - (Expression BoolOp Expression)
   *   - Boolean Value [true | false]
   * 
   * Remember, if you built your concrete syntax tree correctly...
   *   - For BoolExpr ::== ( Expr BoolOp Expr )
   *     - Node(Boolean Expression).children[0] --> Open String Expression boundary [(]
   *     - Node(Boolean Expression).children[1] --> Node(Expression)
   *     - Node(Boolean Expression).children[2] --> Node(Boolean Operator).children[0] --> != | ==
   *     - Node(Boolean Expression).children[3] --> Node(Expression)
   *     - Node(Boolean Expression).children[4] --> Close String Expression boundary [)]
   *
   *   - For BoolExpr ::== boolval
   *     - Node(Boolean Expression).children[0] --> Node(Boolean Value)
   */
  private _add_boolean_expression_subtree_to_ast(boolean_expression_node: CustomNode, parent_var_type: string | null): void {
    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        SEMANTIC_ANALYSIS,
        INFO,
        `Adding ${boolean_expression_node.name} subtree to abstract syntax tree.`
      )// OutputConsoleMessage
    );// this.verbose[this.verbose.length - 1].push

    let open_parenthesis_or_boolean_value_node: CustomNode = boolean_expression_node.children_nodes[0];

    // Enforce type matching in boolean expressions
    let valid_type = false;

    // If, no parent type was given to enforce type matching...
    if (parent_var_type === UNDEFINED) {

      // Enforce type matching using the current type from now on.
      parent_var_type = BOOLEAN;
    }// if

    // Else, there is a parent type to enforce type matching with.
    else {
      valid_type = !this.check_type(parent_var_type, open_parenthesis_or_boolean_value_node, BOOLEAN);
    }// else

    // Boolean expression ::== ( Expr BoolOp Expr )
    if (boolean_expression_node.children_nodes.length > 1) {
      // Ignore Symbol Open Argument [(] and Symbol Close Argument [)]
      //   let open_parenthisis_node = boolean_expression_node.children_nodes[0];
      //   let open_parenthisis_node = boolean_expression_node.children_nodes[4];
      let boolean_operator_value_node: CustomNode = boolean_expression_node.children_nodes[2].children_nodes[0];
      let left_expression_node: CustomNode = boolean_expression_node.children_nodes[1];
      let right_expression_node: CustomNode = boolean_expression_node.children_nodes[3];

      // FIRST Add the Boolean Operator
      this._current_ast.add_node(
        boolean_operator_value_node.name,
        NODE_TYPE_BRANCH,
        valid_type,
        false,
        boolean_operator_value_node.getToken()
      );// this._current_ast.add_node

      // Start by recursively evaluating the left side...
      // Note the type as it will be used to enforce type matching with the right side.
      let left_expression_type = this._add_expression_subtree(left_expression_node, UNDEFINED);

      // If it was an integer expression climb back up to the parent boolean expression node
      if (left_expression_node.children_nodes[0].name === NODE_NAME_INT_EXPRESSION) {
        while (
          (this._current_ast.current_node !== undefined || this._current_ast.current_node !== null)
          && this._current_ast.current_node!.name !== AST_NODE_NAME_BOOLEAN_EQUALS
          && this._current_ast.current_node!.name !== AST_NODE_NAME_BOOLEAN_NOT_EQUALS) {
          if (this._current_ast.current_node!.name !== AST_NODE_NAME_BOOLEAN_EQUALS
            || this._current_ast.current_node!.name !== AST_NODE_NAME_BOOLEAN_NOT_EQUALS) {
            this._current_ast.climb_one_level();
          }// if
        }// while
      }// if

      // Ensures the correct order of nested operators in the ast.
      //
      // Look ahead in the tree on the left side of the 
      // boolean expression and climb if it's an expression and not some value.
      if (left_expression_node.children_nodes[0].children_nodes[0].name == "(") {
        this._climb_ast_one_level();
      }// if

      // Then recursively deal with the right side...
      // To enforce type matching, use the left sides type as the parent type.
      let right_expression_type = this._add_expression_subtree(right_expression_node, left_expression_type);

      // If it was an integer expression climb back up to the parent boolean expression node
      if (right_expression_node.children_nodes[0].name === NODE_NAME_INT_EXPRESSION) {
        while (
          (this._current_ast.current_node !== undefined || this._current_ast.current_node !== null)
          && this._current_ast.current_node!.name !== AST_NODE_NAME_BOOLEAN_EQUALS
          && this._current_ast.current_node!.name !== AST_NODE_NAME_BOOLEAN_NOT_EQUALS) {
          if (this._current_ast.current_node!.name !== AST_NODE_NAME_BOOLEAN_EQUALS
            || this._current_ast.current_node!.name !== AST_NODE_NAME_BOOLEAN_NOT_EQUALS) {
            this._current_ast.climb_one_level();
          }// if
        }// while
      }// if

      // Ensures the correct order of nested operators in the ast.
      //
      // Look ahead in the tree on the right side of the 
      // boolean expression and climb if it's an expression and not some value.
      if (right_expression_node.children_nodes[0].children_nodes[0].name == "(") {
        this._climb_ast_one_level();
      }// if
    }// if

    // Boolean expression is: boolval
    else if (boolean_expression_node.children_nodes.length === 1) {
      this._current_ast.add_node(open_parenthesis_or_boolean_value_node.children_nodes[0].name, NODE_TYPE_LEAF, valid_type, false);
    }// else if

    // Boolean expression is neither: ( Expr BoolOp Expr ) NOR boolval...
    else {
      // Given a valid parse tree, this should never happen...
      throw Error("You messed up Parse: Boolean expression has no children, or negative children.");
    }// else 
  }// add_boolean_expression_subtree_to_ast

  /**
   * Constructs a subtree in the abstract syntax tree rooted with the Keyword Print, adding:
   *   - ( Expr )
   * 
   * Remember, if you built your concrete syntax tree correctly...
   * 
   *   - For PrintStatement ::== print ( Expr )
   *     - Node(Print).children[0] --> Keyword Print [print]
   *     - Node(Print).children[1] --> Open Parenthesis [(]
   *     - Node(Print).children[2] --> Node(Expression)
   *     - Node(Print).children[3] --> Open Parenthesis [)]
   */
  private _add_print_subtree_to_ast(print_node: CustomNode) {
    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        SEMANTIC_ANALYSIS,
        INFO,
        `Adding ${print_node.name} subtree to abstract syntax tree.`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push

    this._current_ast.add_node(print_node.name, NODE_TYPE_BRANCH, false, false, print_node.getToken());

    // Ignore: 
    //   let keyword_print_node = print_node.children_nodes[0]
    //   let open_argument_node = print_node.children_nodes[1]
    //   let close_argument_node = print_node.children_nodes[3]
    //
    // Add Expression Node
    let expression_node = print_node.children_nodes[2];
    this._add_expression_subtree(expression_node, UNDEFINED);
  }// _add_print_subtree_to_ast

  /**
   * Constructs a subtree in the abstract syntax tree rooted with the Keyword While, adding:
   *   - BooleanExpr
   *   - Block
   * 
   * Remember, if you built your concrete syntax tree correctly...
   * 
   *   - For WhileStatement ::== while BooleanExpr Block
   *     - Node(While).children[0] --> Keyword While [while]
   *     - Node(While).children[1] --> Node(Boolean Expression)
   *     - Node(While).children[2] --> Node(Block)
   */
  private _add_while_subtree_to_ast(while_node: CustomNode) {
    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        SEMANTIC_ANALYSIS,
        INFO,
        `Adding ${while_node.name} subtree to abstract syntax tree.`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push

    this._current_ast.add_node(while_node.children_nodes[0].name, NODE_TYPE_BRANCH, false, false, while_node.children_nodes[0].getToken());

    // Recursively add boolean expression subtree
    let node_name = this._add_boolean_expression_subtree_to_ast(while_node.children_nodes[1], BOOLEAN);

    // Add the Block subtree directly under the While Statement Keyword by moving the AST's 
    // current node pointer up one level at a time and stopping when the nearest (first) Node(While).
    this._climb_ast_to_nearest_node(while_node.children_nodes[0].name);

    // Recursively add the while's block
    this._add_block_subtree_to_ast(while_node.children_nodes[2]);
  }// _add_while_subtree_to_ast

  /**
   * Constructs a subtree in the abstract syntax tree rooted with the Keyword If, adding:
   *   - BooleanExpr
   *   - Block
   * 
   * Remember, if you built your concrete syntax tree correctly...
   * 
   *   - For IfStatement ::== if BooleanExpr Block
   *     - Node(If).children[0] --> Keyword If [If]
   *     - Node(If).children[1] --> Node(Boolean Expression)
   *     - Node(If).children[2] --> Node(Block)
   */
  private _add_if_subtree_to_ast(if_node: CustomNode) {
    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        SEMANTIC_ANALYSIS,
        INFO,
        `Adding ${if_node.name} subtree to abstract syntax tree.`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push

    this._current_ast.add_node(if_node.children_nodes[0].name, NODE_TYPE_BRANCH, false, false, if_node.children_nodes[0].getToken());

    // Recursively add boolean expression subtree
    let node_name = this._add_boolean_expression_subtree_to_ast(if_node.children_nodes[1], BOOLEAN);

    // Add the Block subtree directly under the If Statement Keyword by moving the AST's 
    // current node pointer up one level at a time and stopping when the nearest (first) Node(If).
    this._climb_ast_to_nearest_node(if_node.children_nodes[0].name);

    // Recursively add the if's block
    this._add_block_subtree_to_ast(if_node.children_nodes[2]);
  }// _add_if_subtree_to_ast

  /**
   * Validates that the identifier node being read is declared in the current scope table, parents' scope tables. 
   * Outputs a console semantic analysis error if the the identifer is not declared and increases the error count by 1.
   * 
   * @param identifier_node identifier being tested for declaration.
   * @returns identifier metadata if the identifier is declared, null if not.
   */
  private is_variable_declared(identifier_node: CustomNode): VariableMetaData | null | undefined{
    let isDeclared: boolean = false;
    let var_metadata: VariableMetaData | null | undefined = null;
    let curr_scope_table_node: CustomNode | null = this._current_scope_tree.current_node;

    while (curr_scope_table_node !== undefined && curr_scope_table_node !== null && !isDeclared) {
      let scope_table = curr_scope_table_node.getScopeTable();
      isDeclared = scope_table!.has(identifier_node.name);

      // Identifier exists in current scope table.
      if (isDeclared) {
        var_metadata = scope_table!.get(identifier_node.name);
      }// if

      // Identifier doesn't exist in current scope table, check parent.
      else {
        curr_scope_table_node = curr_scope_table_node.parent_node;
      }// else
    }// while

    if (!isDeclared) {
      this._error_count += 1;
      this._curr_prog.isValid = false;
      this._curr_prog.semanticAnalysisOutput.push(
        new OutputConsoleMessage(
          SEMANTIC_ANALYSIS,
          ERROR,
          `Missing variable declaration [${identifier_node.name}] at ${identifier_node.getToken()!.lineNumber}:${identifier_node.getToken()!.linePosition}`
        )// OutputConsoleMessage
      );// this._curr_prog.semanticAnalysisOutput.push
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          SEMANTIC_ANALYSIS,
          ERROR,
          `Missing variable declaration [${identifier_node.name}] at ${identifier_node.getToken()!.lineNumber}:${identifier_node.getToken()!.linePosition}`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push
      return null;
    }// if

    return var_metadata;
  }// is_variable_declared

  /**
   * Validates that the current type matches the parent type. Outputs a console semantic analysis 
   * error if the parent type does not match the current type and increases the error count by 1.
   * 
   * @param parent_var_type type used to enforce matching rule.
   * @param node node in tree where the type enforcing is being applied.
   * @param curr_var_type type tested for matching rule.
   * @returns true on matching types, false if not.
   */
  private check_type(parent_var_type: string | null, node: CustomNode, curr_var_type: string | null): boolean {
    if (parent_var_type !== curr_var_type) {
      this._error_count += 1;
      this._curr_prog.isValid = false;
      this._curr_prog.semanticAnalysisOutput.push(
        new OutputConsoleMessage(
          SEMANTIC_ANALYSIS,
          ERROR,
          `Type mismatch error: tried to perform an operation on [${curr_var_type}] with [${parent_var_type}] at ${node!.getToken()!.lineNumber}:${node!.getToken()!.linePosition}`
        )// OutputConsoleMessage
      );// this._curr_prog.semanticAnalysisOutput.push
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          SEMANTIC_ANALYSIS,
          ERROR,
          `Type mismatch error: tried to perform an operation on [${curr_var_type}] with [${parent_var_type}] at ${node!.getToken()!.lineNumber}:${node!.getToken()!.linePosition}`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push
      return false;
    }// if

    return true;
  }// check_type

  /**
   * Traverses the scope table, looking for a warning, or combination of warnings, including but not limited to:
   *   - Identifier declared but never initialized.
   *   - Identifier declared but never read.
   */
  private check_for_warnings(): void {
    // Stack to store the nodes
    let nodes: Array<CustomNode> = [];

    // Start at root
    nodes.push(this._current_scope_tree.root);

    // Loop while the stack is not empty
    while (nodes.length !== 0) {

      // Store the current node and pop it from the stack
      let curr_scope_tree_node: CustomNode | undefined = nodes.pop();

      // Current node has been travarsed
      if (curr_scope_tree_node != null) {
        let curr_scope_table_entries: any[][] = curr_scope_tree_node.getScopeTable()!.entries();

        // Check each entry for warnings
        for (let i: number = 0; i < curr_scope_table_entries.length; ++i) {
          let key: string = curr_scope_table_entries[i][0];
          let value: VariableMetaData = curr_scope_table_entries[i][1];

          if (!value.isUsed && !value.isInitialized) {
            this._curr_prog.semanticAnalysisOutput.push(
              new OutputConsoleMessage(
                SEMANTIC_ANALYSIS,
                WARNING,
                `'${key}' is declared but its value is never initialized nor read (${value.lineNumber}:${value.linePosition})`
              )// OutputConsoleMessage
            );// this._curr_prog.semanticAnalysisOutput.push

            this._curr_prog.stacktrace.push(
              new OutputConsoleMessage(
                SEMANTIC_ANALYSIS,
                WARNING,
                `'${key}' is declared but its value is never initialized nor read (${value.lineNumber}:${value.linePosition})`
              )// OutputConsoleMessage
            );// this._curr_prog.stacktrace.push
            this._warning_count += 1;
            value.node!.warningFlag = true;
          }// if
          else if (value.isUsed && !value.isInitialized) {
            this._curr_prog.semanticAnalysisOutput.push(
              new OutputConsoleMessage(
                SEMANTIC_ANALYSIS,
                WARNING,
                `'${key}' is declared and read but its value is never initialized (${value.lineNumber}:${value.linePosition})`
              )// OutputConsoleMessage
            );// this._curr_prog.semanticAnalysisOutput.push

            this._curr_prog.stacktrace.push(
              new OutputConsoleMessage(
                SEMANTIC_ANALYSIS,
                WARNING,
                `'${key}' is declared and read but its value is never initialized (${value.lineNumber}:${value.linePosition})`
              )// OutputConsoleMessage
            );// this._curr_prog.stacktrace.push

            this._warning_count += 1;
            value.node!.warningFlag = true;
          }// else if
          else if (!value.isUsed && value.isInitialized) {
            this._curr_prog.semanticAnalysisOutput.push(
              new OutputConsoleMessage(
                SEMANTIC_ANALYSIS,
                WARNING,
                `'${key}' is declared and intialized but its value is never read (${value.lineNumber}:${value.linePosition})`
              )// OutputConsoleMessage
            );// this._curr_prog.semanticAnalysisOutput.push

            this._curr_prog.stacktrace.push(
              new OutputConsoleMessage(
                SEMANTIC_ANALYSIS,
                WARNING,
                `'${key}' is declared and intialized but its value is never read (${value.lineNumber}:${value.linePosition})`
              )// OutputConsoleMessage
            );// this._curr_prog.stacktrace.push

            this._warning_count += 1;
            value.node!.warningFlag = true;
          }// else if
        }// for

        // Store all the children of current node from right to left.
        for (let i: number = curr_scope_tree_node.children_nodes.length - 1; i >= 0; --i) {
          nodes.push(curr_scope_tree_node.children_nodes[i]);
        }// for
      }// if
    }// for
  }// check_for_warnings

  /**
   * Moves the AST's current node pointer up one level in the tree (to the parent node) starting from 
   * the specified node, unless no argument is given, in which the current node is chosen as the start.
   * 
   * @param starting_node relative starting position in the ast.
   */
  private _climb_ast_one_level(starting_node: CustomNode | null = this._current_ast.current_node): void {
    if (this._current_ast.current_node !== undefined || this._current_ast.current_node !== null) {
      this._current_ast.climb_one_level();
    }// if
  }// _climb_ast_one_level

  /**
   * Moves the AST's current node pointer up one level at a time 
   * and stops on the first occurence of the specified node's name.
   * 
   * @param node_name name of the node to climb too.
   */
  private _climb_ast_to_nearest_node(node_name: string | null): void {
    // Climbs to the nearest parent Node(Block)
    while (
      (this._current_ast.current_node !== undefined || this._current_ast.current_node !== null)
      && this._current_ast.current_node!.name !== node_name) {
      if (this._current_ast.current_node!.name !== node_name) {
        this._current_ast.climb_one_level();
      }// if
    }// while
  }// _climb_ast_to_nearest_node

  public get_error_count(): number {
    return this._error_count;
  }// getErrorCount

  public get_warning_count(): number {
    return this._warning_count;
  }// getWarningCount
}// class