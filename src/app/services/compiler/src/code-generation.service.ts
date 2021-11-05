import { Injectable } from '@angular/core';
import { AST_NODE_NAME_BOOLEAN_EQUALS, AST_NODE_NAME_BOOLEAN_NOT_EQUALS, AST_NODE_NAME_IF, AST_NODE_NAME_INT_OP, AST_NODE_NAME_WHILE, BOOLEAN, CODE_GENERATION, ERROR, INFO, INT, MAX_MEMORY_SIZE, NODE_NAME_ASSIGNMENT_STATEMENT, NODE_NAME_BLOCK, NODE_NAME_FALSE, NODE_NAME_PRINT_STATEMENT, NODE_NAME_TRUE, NODE_NAME_VARIABLE_DECLARATION, OUTPUT, PROGRAMS, STRING, WARNING } from './global';
import { ExecutableImage } from './models/executable_image';
import { CustomNode } from './models/node';
import { OutputConsoleMessage } from './models/output_console_message';
import { Program } from './models/program';
import { ScopeTable, VariableMetaData } from './models/scope_table';
import { StaticDataMetadata, Jump, StaticTable } from './models/static_table';

export type LoadRegisterWithConstantCallback = (hex_pair: string | null | undefined) => void;
export type LoadRegisterFromMemoryCallback = (leading_hex_pair: string, trailing_hex_pair: string) => void;

@Injectable()
export class CodeGenerationService {
  private _error_count: number = 0;
  private _warning_count: number = 0;
  private _curr_prog: Program = new Program();
  private _output: Array<OutputConsoleMessage> = []
  private _current_static_table: StaticTable = new StaticTable();
  private _current_executable_image: ExecutableImage = new ExecutableImage(0);

  constructor() { }// constructor

  public codeGeneration(programs: Array<Program>): Map<string, any> {
    for (let prog of programs) {

      // Invalid
      if (!prog.isValid) {
        prog.codeGenerationOutput.push(
          new OutputConsoleMessage(
            CODE_GENERATION,
            WARNING,
            `Skipping program ${prog.id} due to semantic analysis errors.`
          ) // OutputConsoleMessage
        );// prog.codeGenerationOutput.push
        prog.stacktrace.push(
          new OutputConsoleMessage(
            CODE_GENERATION,
            WARNING,
            `Skipping program ${prog.id} due to semantic analysis errors.`
          ) // OutputConsoleMessage
        );// prog.stacktrace.push
      } // if

      // Valid
      else {
        prog.codeGenerationOutput.push(
          new OutputConsoleMessage(
            CODE_GENERATION,
            INFO,
            `Performing Code Generation on program ${prog.id}...`
          )// OutputConsoleMessage
        );// prog.codeGenerationOutput.push

        // Create a new executable image of the program
        this._current_executable_image = new ExecutableImage(prog.id);
        prog.executableImage = this._current_executable_image;

        // Create a new static table
        this._current_static_table = new StaticTable();
        prog.staticTable = this._current_static_table;

        // Try to generate a 256 Byte 6502a Executable Image of the user's code
        try {
          // Write "special" values into the heap, as we will point to them later
          this._current_static_table.put_new_string("null", this._convert_decimal_to_one_byte_hex(this._current_executable_image.get_null_address()));
          this._current_static_table.put_new_string("true", this._convert_decimal_to_one_byte_hex(this._current_executable_image.get_true_address()));
          this._current_static_table.put_new_string("false", this._convert_decimal_to_one_byte_hex(this._current_executable_image.get_false_address()));

          // Traverse the valid AST, depth first in order, and generate code
          this.code_gen(prog.ast.root, prog.scopeTree.root.getScopeTable());

          // Teminate the program with a break, so the operating system doesn't read into the static area or heap!
          this._current_executable_image.write_to_code("00");

          // Back patch temp variables
          this._back_patch();
        }// try

        // Code generation error
        catch (error: any) {
          this._error_count++;
          prog.isValid = false;
          prog.codeGenerationOutput.push(
            new OutputConsoleMessage(
              CODE_GENERATION,
              ERROR,
              error.message
            )// OutputConsoleMessage
          );// prog.codeGenerationOutput.push
          prog.stacktrace.push(
            new OutputConsoleMessage(
              CODE_GENERATION,
              ERROR,
              error.message
            )// OutputConsoleMessage
          );// prog.stacktrace.push
        }// catch

        // Finished code generation for current program
        finally {
          prog.codeGenerationOutput.push(
            new OutputConsoleMessage(
              CODE_GENERATION,
              INFO,
              `Finished code generation on program ${prog.id}.`
            )// OutputConsoleMessage
          );// prog.codeGenerationOutput.push
          prog.stacktrace.push(
            new OutputConsoleMessage(
              CODE_GENERATION,
              INFO,
              `Finished code generation on program ${prog.id}.`
            )// OutputConsoleMessage
          );// prog.stacktrace.push
        }// finally
      } // else
    } // for

    this._output.push(
      new OutputConsoleMessage(
        CODE_GENERATION,
        INFO,
        `Code Generation completed with ${this._warning_count} warning(s)`
      )// OutputConsoleMessage
    );// this._output.push
    this._output.push(
      new OutputConsoleMessage(
        CODE_GENERATION,
        INFO,
        `Code Generation completed with  ${this._error_count} error(s)`
      )// OutputConsoleMessage
    );// this._output.push

    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        CODE_GENERATION,
        INFO,
        `Code Generation completed with ${this._warning_count} warning(s)`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push
    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        CODE_GENERATION,
        INFO,
        `Code Generation completed with  ${this._error_count} error(s)`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push


    let map = new Map<string, any[]>();
    map.set(PROGRAMS, programs);
    map.set(OUTPUT, this._output);
    return map;
  } // codeGeneration

  private code_gen(current_node: CustomNode, current_scope_table: ScopeTable | null): void {
    switch (current_node.name) {
      case NODE_NAME_BLOCK:
        this._code_gen_block(current_node, current_scope_table);
        break;
      case NODE_NAME_VARIABLE_DECLARATION:
        this._code_gen_variable_decalration(current_node, current_scope_table);
        break;
      case NODE_NAME_ASSIGNMENT_STATEMENT:
        this._code_gen_assignment_statement(current_node, current_scope_table);
        break;
      case NODE_NAME_PRINT_STATEMENT:
        this._code_gen_print_statement(current_node, current_scope_table);
        break;
      case AST_NODE_NAME_IF:
        this._code_gen_if_statement(current_node, current_scope_table);
        break;
      case AST_NODE_NAME_WHILE:
        this._code_gen_while_statement(current_node, current_scope_table);
        break;
      default:
        throw Error("ERROR: Invalid Node found on the AST: " + current_node.name);
    }// switch
  }// code_gen

  private _code_gen_block(current_node: CustomNode, current_scope_table: ScopeTable | null = null): void {
    if (current_scope_table === null) {
      current_scope_table = current_node.getScopeTable();
    }// if

    for (let i: number = 0; i < current_node.children_nodes.length; ++i) {
      if (current_node.children_nodes[i].name === NODE_NAME_BLOCK) {
        this._code_gen_block(current_node.children_nodes[i]);
      }// if
      else {
        this.code_gen(current_node.children_nodes[i], current_scope_table);
      }// else
    }// for
  }// _code_gen_block

  /**
   * Generates 6502a op codes that reserves a memory location 
   * in the programs stack for a variable that is initialized to zero.
   * 
   * Remember, if you built your ast correctly..
   *   - Variabel Declaration ::== { StatementList }
   *    - Node(Variable Declaration).children[0] --> int | char list | boolean
   *    - Node(Variable Declaration).children[1] --> identifier
   *  
   * @param cst_current_node current node in the ast.
   */
  private _code_gen_variable_decalration(current_node: CustomNode, current_scope_table: ScopeTable | null): void {
    let type: string | null = current_node.children_nodes[0].name;
    let identifier: string | null = current_node.children_nodes[1].name;
    let static_table_size: number = this._current_static_table.size();

    // Find scope table that contains the identifer
    let scope_table_with_identifier: ScopeTable | null = this._get_scope_table_with_identifier(identifier, current_scope_table);

    // Make an entry in the static table, for later backtracking
    let temp_location: string = "T" + static_table_size.toString(16).toUpperCase().padStart(3, "$");
    this._current_static_table.put(
      identifier,
      scope_table_with_identifier!.id,
      new StaticDataMetadata(
        temp_location.substring(0, 2),
        temp_location.substring(2, 4),
        static_table_size
      )// StaticDataMetadata
    );// this._current_static_table.put

    // Integers and boolean
    if (type === INT) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for integer value variable declaration`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push

      // Initialize the variable to zero and store it in memory,
      // where the exact location is to be determined in backtracking.
      this._load_accumulator_with_constant("00");
    }// if 

    else if (type === BOOLEAN) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for boolean variable declaration`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push

      // Booleans get initialized to the string "false" in the heap
      this._load_accumulator_with_constant(this._current_executable_image.get_false_address().toString(16).toUpperCase());
    }// else-if

    // Strings
    else if (type === STRING) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for string variable declaration`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push

      // Initialize strings to the string "null" in the heap
      this._load_accumulator_with_constant(this._current_executable_image.get_null_address().toString(16).toUpperCase());
    }// else-if

    else {
      throw Error(`Variable Declaration: AST variable declaration node uses an invalid type [${type}]!`);
    }// else

    this._store_accumulator_to_memory(temp_location.substring(0, 2), temp_location.substring(2, 4));
  }// _code_gen_variable_decalration

  private _code_gen_assignment_statement(assignment_statement_node: CustomNode, current_scope_table: ScopeTable | null): void {
    let identifier: string = assignment_statement_node.children_nodes[0].name ?? "??";
    let right_child_node_value: string = assignment_statement_node.children_nodes[1].name ?? "??";

    // Find scope table with the identifier
    let scope_table_with_left_identifier: ScopeTable | null = this._get_scope_table_with_identifier(
      identifier,
      current_scope_table
    );// this._get_scope_table_with_identifier

    // Get left hand variable location
    let left_id_static_data: StaticDataMetadata | null | undefined = this._get_identifier_static_data(
      identifier,
      scope_table_with_left_identifier
    );// this._get_identifier_static_data

    // Assigning to another identifier
    if (new RegExp("^[a-z]$").test(right_child_node_value)) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for string assignment statement`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push

      // Find scope table with the identifier
      let scope_table_with_right_identifier: ScopeTable | null = this._get_scope_table_with_identifier(
        right_child_node_value,
        current_scope_table
      );// this._get_scope_table_with_identifier

      // Get right hand variable location
      let right_id_static_data: StaticDataMetadata | null | undefined = this._get_identifier_static_data(
        right_child_node_value,
        scope_table_with_right_identifier
      );// this._get_identifier_static_data

      // Load accumulator with right hand variable value
      this._load_accumulator_from_memory(
        right_id_static_data!.temp_address_leading_hex,
        right_id_static_data!.temp_address_trailing_hex
      );// this._load_accumulator_from_memory
    }// if

    // Integer
    else if (new RegExp("^[0-9]$").test(right_child_node_value)) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for integer assignment statement`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push

      // Load accumulator with right hand integer
      this._load_accumulator_with_constant(this._convert_decimal_to_one_byte_hex(parseInt(right_child_node_value, 10)));
    }// if

    // Value is a boolean false
    else if (new RegExp("^(false)$").test(right_child_node_value)) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for boolean false assignment statement`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push

      // Load the accumulator with pointer to "false" in the heap
      this._load_accumulator_with_constant(this._current_executable_image.get_false_address().toString(16).toUpperCase());
    }// else-if

    // Value is boolean true
    else if (new RegExp("^(true)$").test(right_child_node_value)) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for boolean true assignment statement`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push

      // Load the accumulator with pointer to "true" in the heap
      this._load_accumulator_with_constant(this._current_executable_image.get_true_address().toString(16).toUpperCase());
    }// else-if

    // String expression
    else if (right_child_node_value.startsWith("\"")) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for string assignment statement`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push
      this._load_register_with_string_pointer(
        right_child_node_value,
        (hex_pair: string | null | undefined) => this._load_accumulator_with_constant(hex_pair)
      );// this._load_register_with_string_pointer
    }// else-if

    // Integer Expression
    else if (right_child_node_value === AST_NODE_NAME_INT_OP) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for integer expression assignment statement`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push

      let memory_address_of_sum: StaticDataMetadata = this._code_gen_int_expression(
        assignment_statement_node.children_nodes[1],
        null,
        current_scope_table
      );// _code_gen_int_expression

      this._load_accumulator_from_memory(
        memory_address_of_sum.temp_address_leading_hex,
        memory_address_of_sum.temp_address_trailing_hex
      );// _load_accumulator_from_memory
    }// else-if

    // Boolean expression
    else if (right_child_node_value === AST_NODE_NAME_BOOLEAN_EQUALS || right_child_node_value == AST_NODE_NAME_BOOLEAN_NOT_EQUALS) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for boolean expression assignment statement`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push

      let memory_address_of_boolean_result: StaticDataMetadata | null | undefined = this._code_gen_boolean_expression(
        assignment_statement_node.children_nodes[1],
        current_scope_table
      );// _code_gen_boolean_expression

      this._load_accumulator_from_memory(
        memory_address_of_boolean_result!.temp_address_leading_hex,
        memory_address_of_boolean_result!.temp_address_trailing_hex
      );// _load_accumulator_from_memory
    }// else-if

    else {
      throw Error(`Code Gen Print --> Expected [Int | Boolean Value | StringExpr | IntExpr | BooleanExpr], but got ${right_child_node_value}`);
    }// else

    // Store accumulator in the left hand identifier address
    this._store_accumulator_to_memory(
      left_id_static_data!.temp_address_leading_hex,
      left_id_static_data!.temp_address_trailing_hex
    );// this._store_accumulator_to_memory
  }// _code_gen_assignment_statement

  /**
   * Prints the argument to standard output.
   * 
   * If the abstract syntax tree was built correctly,
   * then the print node should only have one child node.
   * 
   * @param print_node ast parent print node.
   * @param current_scope_table current scope used for identifier lookups.
   */
  private _code_gen_print_statement(print_node: CustomNode, current_scope_table: ScopeTable | null): void {
    let value: string = print_node.children_nodes[0].name ?? "??";
    // Value is an identifier
    if (new RegExp("^[a-z]$").test(value)) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for print identifier`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push

      // Find scope with the identifier
      let scope_table_with_identifier: ScopeTable | null = this._get_scope_table_with_identifier(value, current_scope_table);
      let type: string | null = null;

      // Get start location of string in heap
      let metadata: StaticDataMetadata | null | undefined = null;

      // Given a valid AST, eventually a declared variable should be found
      while (metadata === null && scope_table_with_identifier !== null) {
        metadata = this._current_static_table.get(value, scope_table_with_identifier.id);
        type = scope_table_with_identifier.get(value)!.type;

        if (metadata === null) {
          scope_table_with_identifier = this._get_scope_table_with_identifier(value, scope_table_with_identifier.parent_scope_table);
        }// if
      }// while

      // Get int value from static area or pointer to string in heap
      this._load_y_register_from_memory(metadata!.temp_address_leading_hex, metadata!.temp_address_trailing_hex);

      if (type === INT) {
        this._load_x_register_with_constant("01");
      }// if

      else if (type === BOOLEAN || type === STRING) {
        this._load_x_register_with_constant("02");
      }// else-if

      else {
        throw Error(`Code gen Print --> Scope Table: identifier ${value} has invalid type [${type}]`);
      }// else
    }// if

    // Integer
    else if (new RegExp("^[0-9]$").test(value)) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for print integer`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push

      // Load constant to Y register
      this._load_y_register_with_constant(this._convert_decimal_to_one_byte_hex(parseInt(value, 10)));
      this._load_x_register_with_constant("01");
    }// if

    // Value is a boolean false
    else if (new RegExp("^(false)$").test(value)) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for print false`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push
      this._load_y_register_with_constant(this._current_executable_image.get_false_address().toString(16).toUpperCase());
      this._load_x_register_with_constant("02");
    }// else-if

    // Value is boolean true
    else if (new RegExp("^(true)$").test(value)) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for print true`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push
      this._load_y_register_with_constant(this._current_executable_image.get_true_address().toString(16).toUpperCase());
      this._load_x_register_with_constant("02");
    }// else-if

    // String expression
    else if (value.startsWith("\"")) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for print string expression`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push
      this._load_register_with_string_pointer(
        value,
        (hex_pair: string | null | undefined) => this._load_y_register_with_constant(hex_pair)
      );// this._load_register_with_string_pointer

      this._load_x_register_with_constant("02");
    }// else-if

    // Integer Expression
    else if (value === AST_NODE_NAME_INT_OP) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for print integer expression`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push

      let memory_address_of_sum: StaticDataMetadata = this._code_gen_int_expression(print_node.children_nodes[0], null, current_scope_table);

      // Load the Y register with the sum of the integer expression
      this._load_y_register_from_memory(memory_address_of_sum.temp_address_leading_hex, memory_address_of_sum.temp_address_trailing_hex);

      // Print out number
      this._load_x_register_with_constant("01");
    }// if

    // Boolean expression
    else if (value === AST_NODE_NAME_BOOLEAN_EQUALS || value == AST_NODE_NAME_BOOLEAN_NOT_EQUALS) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for print boolean expression`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push
      let memory_address_of_boolean_result: StaticDataMetadata | null | undefined = this._code_gen_boolean_expression(print_node.children_nodes[0], current_scope_table);

      // Load the Y register with the sum of the integer expression
      this._load_y_register_from_memory(
        memory_address_of_boolean_result!.temp_address_leading_hex,
        memory_address_of_boolean_result!.temp_address_trailing_hex
      );// _load_y_register_from_memory

      // Print out number
      this._load_x_register_with_constant("02");
    }// else-if

    else {
      throw Error(`Code Gen Print --> Expected [Int | Boolean Value | StringExpr | IntExpr | BooleanExpr], but got ${value}`);
    }// else

    // Print
    this.system_call();
  }// _code_gen_print_statement

  private _code_gen_if_statement(if_node: CustomNode, current_scope_table: ScopeTable | null): void {
    let left_child: CustomNode = if_node.children_nodes[0];
    let block_node: CustomNode = if_node.children_nodes[1];
    let memory_address_of_boolean_result: StaticDataMetadata | null | undefined = null;

    // Boolean expression
    if (left_child.name === AST_NODE_NAME_BOOLEAN_EQUALS || left_child.name === AST_NODE_NAME_BOOLEAN_NOT_EQUALS) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for if statement boolean expression`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push
      memory_address_of_boolean_result = this._code_gen_boolean_expression(
        if_node.children_nodes[0],
        current_scope_table
      );// _code_gen_boolean_expression
    }// if

    // true
    else if (left_child.name === NODE_NAME_TRUE) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for if statement true`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push

      memory_address_of_boolean_result = this._get_anonymous_address();

      this._load_accumulator_with_constant(this._current_executable_image.get_true_address().toString(16).toUpperCase());

      this._store_accumulator_to_memory(
        memory_address_of_boolean_result.temp_address_leading_hex,
        memory_address_of_boolean_result.temp_address_trailing_hex
      );// _store_accumulator_to_memory
    }// if

    // false
    else if (left_child.name === NODE_NAME_FALSE) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for if statement false`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push

      memory_address_of_boolean_result = this._get_anonymous_address();

      this._load_accumulator_with_constant(this._current_executable_image.get_false_address().toString(16).toUpperCase());

      this._store_accumulator_to_memory(
        memory_address_of_boolean_result.temp_address_leading_hex,
        memory_address_of_boolean_result.temp_address_trailing_hex
      );// _store_accumulator_to_memory
    }// else if

    else {
      throw Error(`Code Gen If Expected [AST_NODE_NAME_BOOLEAN_EQUALS, AST_NODE_NAME_BOOLEAN_NOT_EQUALS, NODE_NAME_TRUE, NODE_NAME_FALSE] but got ${left_child.name}`);
    }// else if

    // Loads true pointer into the x-regsiter
    this._load_x_register_with_constant(this._current_executable_image.get_true_address().toString(16).toUpperCase());

    this._compare_x_register_to_memory(
      memory_address_of_boolean_result!.temp_address_leading_hex,
      memory_address_of_boolean_result!.temp_address_trailing_hex
    );// _compare_x_register_to_memory

    // Free up memory
    memory_address_of_boolean_result!.isUsable = true;

    // Branch distance is currently unknown
    if (this._current_static_table.get_jump_table_size() > 15) {
      throw Error(`Program ran out of jumps!`);
    }// if
    let temp_jump: string = this._current_static_table.get_jump_table_size().toString(16).toUpperCase().padStart(2, "J");
    this._current_static_table.put_jump(temp_jump, new Jump(-1));
    this._branch_on_zero(temp_jump);

    // Start location of while statement expression
    let jump_base: number = this._current_executable_image.get_code_limit();

    // Contents of the if statement
    this._code_gen_block(block_node);

    // Update temp_distance in the jump table
    this._current_static_table.get_jump(temp_jump)!.distance = this._current_executable_image.get_code_limit() - jump_base;
  }// _code_gen_if_statement

  private _code_gen_while_statement(while_node: CustomNode, current_scope_table: ScopeTable | null): void {
    let left_child: CustomNode = while_node.children_nodes[0];
    let block_node: CustomNode = while_node.children_nodes[1];
    let memory_address_of_boolean_result: StaticDataMetadata | null | undefined = null;

    // Start location of while statement expression
    let while_start: number = this._current_executable_image.get_code_limit();

    // Boolean expression
    if (left_child.name === AST_NODE_NAME_BOOLEAN_EQUALS || left_child.name === AST_NODE_NAME_BOOLEAN_NOT_EQUALS) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for while statement boolean expression`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push
      memory_address_of_boolean_result = this._code_gen_boolean_expression(
        while_node.children_nodes[0],
        current_scope_table
      );// _code_gen_boolean_expression
    }// if

    // true
    else if (left_child.name === NODE_NAME_TRUE) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for while statement true`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push
      memory_address_of_boolean_result = this._get_anonymous_address();

      this._load_accumulator_with_constant(this._current_executable_image.get_true_address().toString(16).toUpperCase());

      this._store_accumulator_to_memory(
        memory_address_of_boolean_result.temp_address_leading_hex,
        memory_address_of_boolean_result.temp_address_trailing_hex
      );// _store_accumulator_to_memory

    }// if

    // false
    else if (left_child.name === NODE_NAME_FALSE) {
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Code generation for while statement false`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push
      memory_address_of_boolean_result = this._get_anonymous_address();

      this._load_accumulator_with_constant(this._current_executable_image.get_false_address().toString(16).toUpperCase());

      this._store_accumulator_to_memory(
        memory_address_of_boolean_result.temp_address_leading_hex,
        memory_address_of_boolean_result.temp_address_trailing_hex
      );// _store_accumulator_to_memory
    }// else if

    else {
      throw Error(`Code Gen If Expected [AST_NODE_NAME_BOOLEAN_EQUALS, AST_NODE_NAME_BOOLEAN_NOT_EQUALS, NODE_NAME_TRUE, NODE_NAME_FALSE] but got ${left_child.name}`);
    }// else if

    // Loads true pointer into the x-regsiter
    this._load_x_register_with_constant(this._current_executable_image.get_true_address().toString(16).toUpperCase());

    this._compare_x_register_to_memory(
      memory_address_of_boolean_result!.temp_address_leading_hex,
      memory_address_of_boolean_result!.temp_address_trailing_hex
    );// _compare_x_register_to_memory

    // Free up memory
    memory_address_of_boolean_result!.isUsable = true;

    // Branch distance is currently unknown
    if (this._current_static_table.get_jump_table_size() > 15) {
      throw Error(`Program ran out of jumps!`);
    }// if
    let temp_jump: string = this._current_static_table.get_jump_table_size().toString(16).toUpperCase().padStart(2, "J");
    this._current_static_table.put_jump(temp_jump, new Jump(-1));
    this._branch_on_zero(temp_jump);

    // Start location of while statement expression
    let jump_start: number = this._current_executable_image.get_code_limit();

    // Contents of the while statement
    this._code_gen_block(block_node);

    // Force branch back to the conditional statement
    this._load_x_register_with_constant(this._current_executable_image.get_false_address().toString(16).toUpperCase());
    this._compare_x_register_to_memory(
      memory_address_of_boolean_result!.temp_address_leading_hex,
      memory_address_of_boolean_result!.temp_address_trailing_hex
    );// _compare_x_register_to_memory
    this._branch_on_zero(this._convert_decimal_to_one_byte_hex(MAX_MEMORY_SIZE - this._current_executable_image.get_code_limit() + while_start - 2));

    // Update jump table for later backpatching
    this._current_static_table.get_jump(temp_jump)!.distance = this._current_executable_image.get_code_limit() - jump_start;
  }// _code_gen_while_statement

  /**
   * Recursively adds two two numbers of an integer expression.
   * 
   * The left child integer (addend) is loaded into the accumulator. Then
   * the current sum is added to the left child integer that was stored in the
   * accumulator. Finally, the new sum is stored back in memory, at the same address
   * of the old sum, effectively replacing the old sum with the new sum.
   * 
   * @param int_op_node ast parent node to the two addends.
   * @param leading_hex_pair leading byte of memory address where the sum is stored.
   * @param trailing_hex_pair trailing byte of memory address where the sum is stored.
   * @param current_scope_table current scope table used to perform identifier lookups.
   * @returns the address in memory where the sum is stored.
   */
  private _code_gen_int_expression(int_op_node: CustomNode, anonymous_address_static_data: StaticDataMetadata | null, current_scope_table: ScopeTable | null): StaticDataMetadata {
    // Load new left digit to the accumulator
    let left_integer: string | null= int_op_node.children_nodes[0].name;
    this._load_accumulator_with_constant(this._convert_decimal_to_one_byte_hex(parseInt(left_integer!, 10)));

    // Base case, make new entry in static table
    if (anonymous_address_static_data === null) {
      // Make an anoymous address entry in the static table, for later backtracking
      anonymous_address_static_data = this._get_anonymous_address();
    }// if

    // Not base case, add current sum from memory to left integer
    else {
      this._add_with_carry(anonymous_address_static_data.temp_address_leading_hex, anonymous_address_static_data.temp_address_trailing_hex);
    }// else

    // Store result back in anonymous location
    this._store_accumulator_to_memory(anonymous_address_static_data.temp_address_leading_hex, anonymous_address_static_data.temp_address_trailing_hex);

    // Integer plus [integer expression]
    if (int_op_node.children_nodes[1].name === AST_NODE_NAME_INT_OP) {
      return this._code_gen_int_expression(int_op_node.children_nodes[1], anonymous_address_static_data, current_scope_table);
    }// if

    // Expression ends with an integer
    else if (new RegExp("^[0-9]$").test(int_op_node.children_nodes[1].name!)) {
      // Load new right digit to the accumulator
      let right_integer: string | null = int_op_node.children_nodes[1].name
      this._load_accumulator_with_constant(this._convert_decimal_to_one_byte_hex(parseInt(right_integer!, 10)));

      // Add current sum from memory to left integer
      this._add_with_carry(anonymous_address_static_data.temp_address_leading_hex, anonymous_address_static_data.temp_address_trailing_hex);

      // Store result back in anonymous location
      this._store_accumulator_to_memory(anonymous_address_static_data.temp_address_leading_hex, anonymous_address_static_data.temp_address_trailing_hex);

      return anonymous_address_static_data;
    }// else-if

    // Expression ends with an identifier
    else if (new RegExp("^[a-z]$").test(int_op_node.children_nodes[1].name!)) {
      // Search for scope table with ID
      let scope_table_with_identifier: ScopeTable | null= this._get_scope_table_with_identifier(int_op_node.children_nodes[1].name, current_scope_table);

      // Get start location of string in heap
      let identifier_metadata: StaticDataMetadata | null | undefined = this._current_static_table.get(int_op_node.children_nodes[1].name!, scope_table_with_identifier!.id);

      // Load new right digit to the accumulator
      this._load_accumulator_from_memory(identifier_metadata!.temp_address_leading_hex, identifier_metadata!.temp_address_trailing_hex);

      // Add current sum from memory to left integer
      this._add_with_carry(anonymous_address_static_data.temp_address_leading_hex, anonymous_address_static_data.temp_address_trailing_hex);

      // Store result back in anonymous location
      this._store_accumulator_to_memory(anonymous_address_static_data.temp_address_leading_hex, anonymous_address_static_data.temp_address_trailing_hex);

      return anonymous_address_static_data;
    }// else-if

    else {
      throw Error(`Code Gen Addition Error: expted integer expression to end with [integer | identifier], but got ${int_op_node.children_nodes[1].name}`);
    }// else
  }// _code_gen_int_expression

  /**
   * Recursively generates code to evaluate a boolean expression.
   *
   * @param boolean_expression_node boolean expression node in ast used to compare two values
   * @param current_scope_table current scope table used for variable lookups
   * @returns address of the resulting boolean value
   */
  private _code_gen_boolean_expression(boolean_expression_node: CustomNode, current_scope_table: ScopeTable | null): StaticDataMetadata | null | undefined {
    let left_node_val: string | null = boolean_expression_node.children_nodes[0].name;
    let right_node_val: string | null = boolean_expression_node.children_nodes[1].name;
    let left_result: StaticDataMetadata | null | undefined = null;
    let right_result: StaticDataMetadata | null | undefined = null;

    // left and right node are two comparable values
    if (![AST_NODE_NAME_BOOLEAN_EQUALS, AST_NODE_NAME_BOOLEAN_NOT_EQUALS].includes(left_node_val!)
      && ![AST_NODE_NAME_BOOLEAN_EQUALS, AST_NODE_NAME_BOOLEAN_NOT_EQUALS].includes(boolean_expression_node.children_nodes[1].name!)) {
      return this._code_gen_boolean_comparison(boolean_expression_node, current_scope_table);
    }// if

    // Go down as far left as possible
    if ([AST_NODE_NAME_BOOLEAN_EQUALS, AST_NODE_NAME_BOOLEAN_NOT_EQUALS].includes(left_node_val!)) {
      left_result = this._code_gen_boolean_expression(boolean_expression_node.children_nodes[0], current_scope_table);
    }// if

    // Store single value in memory
    else {
      left_result = this._store_single_value_in_memory(left_node_val!, boolean_expression_node.children_nodes[0], current_scope_table);
    }// else

    // Go down as far right as possible
    if ([AST_NODE_NAME_BOOLEAN_EQUALS, AST_NODE_NAME_BOOLEAN_NOT_EQUALS].includes(right_node_val!)) {
      right_result = this._code_gen_boolean_expression(boolean_expression_node.children_nodes[1], current_scope_table);
    }// if

    // Store single value in memory
    else {
      right_result = this._store_single_value_in_memory(right_node_val!, boolean_expression_node.children_nodes[1], current_scope_table);
    }// else

    // Compare results
    if (left_result !== null && right_result !== null) {
      // LDX [left result]
      this._load_x_register_from_memory(
        left_result!.temp_address_leading_hex,
        left_result!.temp_address_trailing_hex
      );// _load_x_register_from_memory
      // CPX [right result]
      this._compare_x_register_to_memory(right_result!.temp_address_leading_hex, right_result!.temp_address_trailing_hex);

      // Free up memory 
      left_result!.isUsable = true;
      right_result!.isUsable = false;

      // Store answer
      // Return the boolean expression result’s location in memory
      return this._store_boolean_result(boolean_expression_node);
    }// if

    else if (left_result === null) {
      return right_result;
    }// else if

    else if (right_result == null) {
      return left_result;
    }// else if

    else {
      return null;
    }// else
  }// _code_gen_boolean_expression

  /**
   * Compares two values and sets the zero flag accordingly.
   * 
   * @param boolean_expression_node Boolean "==" or "!=" node that has two values as children. 
   * @param current_scope_table current scope table to perform identifier look ups.
   * @returns address of result [leading hex pair, trailing hex pair].
   */
  private _code_gen_boolean_comparison(boolean_expression_node: CustomNode, current_scope_table: ScopeTable | null): StaticDataMetadata {
    let left_child_value: string | null = boolean_expression_node.children_nodes[0].name;
    let right_child_value: string | null = boolean_expression_node.children_nodes[1].name;

    // Left child is not an expression
    if (left_child_value !== AST_NODE_NAME_BOOLEAN_EQUALS || left_child_value !== AST_NODE_NAME_BOOLEAN_NOT_EQUALS) {
      // Child is a variable
      if (new RegExp("^[a-z]$").test(left_child_value!)) {
        // Find scope with the identifier
        let scope_table_with_identifier: ScopeTable | null = this._get_scope_table_with_identifier(
          left_child_value,
          current_scope_table
        );// _get_scope_table_with_identifier

        // Get start location of string in heap
        let id_static_data: StaticDataMetadata | null | undefined = this._get_identifier_static_data(
          left_child_value!,
          scope_table_with_identifier
        );// _get_identifier_static_data

        // Get int value from static area or pointer to string in heap
        this._load_x_register_from_memory(
          id_static_data!.temp_address_leading_hex,
          id_static_data!.temp_address_trailing_hex
        );// _load_x_register_from_memory
      }// if

      // Child is an integer value 
      else if (new RegExp("^[0-9]$").test(left_child_value!)) {
        this._load_x_register_with_constant(this._convert_decimal_to_one_byte_hex(parseInt(left_child_value!, 10)));
      }// else if

      // Child is a boolean false
      else if (left_child_value === NODE_NAME_FALSE) {
        this._load_x_register_with_constant(this._current_executable_image.get_false_address().toString(16).toUpperCase());
      }// else-if

      // Child is boolean true
      else if (left_child_value === NODE_NAME_TRUE) {
        this._load_x_register_with_constant(this._current_executable_image.get_true_address().toString(16).toUpperCase());
      }// else-if

      // Child is a string expression
      else if (left_child_value!.startsWith("\"")) {
        this._load_register_with_string_pointer(
          left_child_value!,
          (hex_pair: string | null | undefined) => this._load_x_register_with_constant(hex_pair)
        );// this._load_register_with_string_pointer
      }// else-if

      // Child is a int expression
      else if (left_child_value === AST_NODE_NAME_INT_OP) {
        let memory_address_of_sum: StaticDataMetadata = this._code_gen_int_expression(
          boolean_expression_node.children_nodes[0],
          null,
          current_scope_table
        );// _code_gen_int_expression

        // Load the X register with the sum of the integer expression
        this._load_x_register_from_memory(
          memory_address_of_sum.temp_address_leading_hex,
          memory_address_of_sum.temp_address_trailing_hex
        );// _load_x_register_from_memory
      }// else-if

      // Throw error
      else {
        throw Error(`Code Gen Boolean Comparison --> Expected [ID, Int | Boolean Value | StringExpr | IntExpr | BooleanExpr], but got ${left_child_value}`);
      }// else
    }// else


    // Right child is not an expression
    if (right_child_value !== AST_NODE_NAME_BOOLEAN_EQUALS || right_child_value !== AST_NODE_NAME_BOOLEAN_NOT_EQUALS) {
      // Child is a variable
      if (new RegExp("^[a-z]$").test(right_child_value!)) {
        // Find scope with the identifier
        let scope_table_with_identifier: ScopeTable | null = this._get_scope_table_with_identifier(
          right_child_value,
          current_scope_table
        );// _get_scope_table_with_identifier

        // Get start location of string in heap
        let id_static_data: StaticDataMetadata | null | undefined= this._get_identifier_static_data(
          right_child_value!,
          scope_table_with_identifier
        );// _get_identifier_static_data

        // Get int value from static area or pointer to string in heap
        this._compare_x_register_to_memory(
          id_static_data!.temp_address_leading_hex,
          id_static_data!.temp_address_trailing_hex
        );// _load_x_register_from_memory
      }// if

      // Child is an integer value 
      else if (new RegExp("^[0-9]$").test(right_child_value!)) {
        this._load_accumulator_with_constant(this._convert_decimal_to_one_byte_hex(parseInt(right_child_value!, 10)));

        let anonymous_address_static_data: StaticDataMetadata = this._get_anonymous_address();

        this._store_accumulator_to_memory(
          anonymous_address_static_data.temp_address_leading_hex,
          anonymous_address_static_data.temp_address_trailing_hex,
        );// store_accumulator_to_memory

        this._compare_x_register_to_memory(
          anonymous_address_static_data.temp_address_leading_hex,
          anonymous_address_static_data.temp_address_trailing_hex,
        );// compare_x_register_to_memory
      }// else if

      // Child is a boolean false
      else if (right_child_value === NODE_NAME_FALSE || right_child_value === NODE_NAME_TRUE) {
        let memory_address_of_boolean_result = this._get_anonymous_address();

        if (right_child_value === NODE_NAME_FALSE) {
          this._load_accumulator_with_constant(this._current_executable_image.get_false_address().toString(16).toUpperCase());
        }// if
        else {
          this._load_accumulator_with_constant(this._current_executable_image.get_true_address().toString(16).toUpperCase());
        }// else

        this._store_accumulator_to_memory(
          memory_address_of_boolean_result.temp_address_leading_hex,
          memory_address_of_boolean_result.temp_address_trailing_hex
        );// _store_accumulator_to_memory

        this._compare_x_register_to_memory(
          memory_address_of_boolean_result.temp_address_leading_hex,
          memory_address_of_boolean_result.temp_address_trailing_hex
        );// _load_x_register_from_memory
      }// else-if

      // Child is a string expression
      else if (right_child_value!.startsWith("\"")) {
        this._load_register_with_string_pointer(
          right_child_value!,
          (str_pointer: string | null | undefined) => {
            let anonymous_address: StaticDataMetadata = this._get_anonymous_address();

            this._load_accumulator_with_constant(str_pointer);
            this._store_accumulator_to_memory(
              anonymous_address.temp_address_leading_hex,
              anonymous_address.temp_address_trailing_hex
            );// _store_accumulator_to_memory

            this._compare_x_register_to_memory(
              anonymous_address.temp_address_leading_hex,
              anonymous_address.temp_address_trailing_hex
            );// _compare_x_register_to_memory
          }
        );// _load_register_with_string_pointer
      }// else-if

      // Child is a int expression
      else if (right_child_value === AST_NODE_NAME_INT_OP) {
        let memory_address_of_sum: StaticDataMetadata = this._code_gen_int_expression(
          boolean_expression_node.children_nodes[1],
          null,
          current_scope_table
        );// _code_gen_int_expression

        // Load the X register with the sum of the integer expression
        this._compare_x_register_to_memory(
          memory_address_of_sum.temp_address_leading_hex,
          memory_address_of_sum.temp_address_trailing_hex
        );// _compare_x_register_to_memory
      }// else-if

      // Throw error
      else {
        throw Error(`Code Gen Boolean Comparison --> Expected [ID, Int | Boolean Value | StringExpr | IntExpr | BooleanExpr], but got ${right_child_value}`);
      }// else
    }// else

    // Store the boolean result in memory and return its address
    return this._store_boolean_result(boolean_expression_node);
  }// _code_gen_boolean_comparison

  /**
   * If z-flag is 0, stores a pointer to true in an anonymous id in the memory's static area.
   * If the z-flag is 1, stores the pointer to false in an anonymous id in the memory's static area.
   * 
   * TODO: Re-use addresses that are no longer needed.
   * 
   * @returns address in memory of boolean result 
   */
  private _store_boolean_result(boolean_expression_node: CustomNode): StaticDataMetadata {
    // Branch on not equal
    this._branch_on_zero("0C");// Skip 12 bytes

    // Z-flag was 1 and node was "==".
    //
    // Meaning the two values were equal and the 
    // intended comparison was equal so store result as true
    if (boolean_expression_node.name === AST_NODE_NAME_BOOLEAN_EQUALS) {
      this._load_accumulator_with_constant(this._current_executable_image.get_true_address().toString(16).toUpperCase());// 2
    }// if

    // Z-flag was 1 and node was "!=".
    //
    // Meaning the two values were equal and the 
    // intended comparison was not equal so store result as false
    else {
      this._load_accumulator_with_constant(this._current_executable_image.get_false_address().toString(16).toUpperCase());// 2
    }// else

    // Make an anoymous address entry in the static table, for later backtracking
    let anonymous_address_static_data: StaticDataMetadata = this._get_anonymous_address();

    // Store answer in memory
    this._store_accumulator_to_memory(
      anonymous_address_static_data.temp_address_leading_hex,
      anonymous_address_static_data.temp_address_trailing_hex
    );// _store_accumulator_to_memory // 3

    // Force branch out of current branch to skip storing true in memory
    // By setting up an always true condition, comparing "f" to "f"
    this._load_x_register_with_constant("FF");// "f", 2
    this._compare_x_register_to_memory("00", this._current_executable_image.get_false_address().toString(16).toUpperCase());// "f", 3
    this._branch_on_zero("05");// 2

    // Z-flag was 0 and node was "==".
    //
    // Meaning the two values were not equal and the 
    // intended comparison was equal so store result as false
    if (boolean_expression_node.name === AST_NODE_NAME_BOOLEAN_EQUALS) {
      this._load_accumulator_with_constant(this._current_executable_image.get_false_address().toString(16).toUpperCase());// 2
    }// if

    // Z-flag was 0 and node was "!=".
    //
    // Meaning the two values were not equal and the 
    // intended comparison was not equal so store result as true
    else {
      this._load_accumulator_with_constant(this._current_executable_image.get_true_address().toString(16).toUpperCase());// 2
    }// else

    this._store_accumulator_to_memory(
      anonymous_address_static_data.temp_address_leading_hex,
      anonymous_address_static_data.temp_address_trailing_hex
    );// _store_accumulator_to_memory // 3

    // Return the boolean expression result’s location in memory
    return anonymous_address_static_data;
  }// _store_boolean_result

  private _store_single_value_in_memory(value: string, int_op_node: CustomNode, current_scope_table: ScopeTable | null): StaticDataMetadata | null | undefined  {
    let anonymous_address_static_data: StaticDataMetadata = this._get_anonymous_address();

    if (new RegExp("^[a-z]$").test(value)) {
      // Find scope with the identifier
      let scope_table_with_identifier: ScopeTable | null = this._get_scope_table_with_identifier(
        value,
        current_scope_table
      );// _get_scope_table_with_identifier

      // Get start location of string in heap
      let id_static_data: StaticDataMetadata | null | undefined  = this._get_identifier_static_data(
        value,
        scope_table_with_identifier
      );// _get_identifier_static_data

      return id_static_data;
    }// if

    // Child is an integer value 
    else if (new RegExp("^[0-9]$").test(value)) {
      this._load_accumulator_with_constant(this._convert_decimal_to_one_byte_hex(parseInt(value, 10)));
      this._store_accumulator_to_memory(
        anonymous_address_static_data.temp_address_leading_hex,
        anonymous_address_static_data.temp_address_trailing_hex
      );// _store_accumulator_to_memory

      return anonymous_address_static_data;
    }// else if
    else if (value === NODE_NAME_FALSE || value === NODE_NAME_TRUE) {
      let memory_address_of_boolean_result = this._get_anonymous_address();

      if (value === NODE_NAME_FALSE) {
        this._load_accumulator_with_constant(this._current_executable_image.get_false_address().toString(16).toUpperCase());
      }// if
      else {
        this._load_accumulator_with_constant(this._current_executable_image.get_true_address().toString(16).toUpperCase());
      }// else

      this._store_accumulator_to_memory(
        memory_address_of_boolean_result.temp_address_leading_hex,
        memory_address_of_boolean_result.temp_address_trailing_hex
      );// _store_accumulator_to_memory

      return memory_address_of_boolean_result;
    }// else-if

    // Child is a string expression
    else if (value.startsWith("\"")) {
      let address: string | null | undefined = this._load_register_with_string_pointer(
        value,
        (hex_pair: string | null | undefined) => { }
      );// this._load_register_with_string_pointer

      return new StaticDataMetadata(address!.substring(0, 2), address!.substring(2, 4), -1);
    }// else-if

    // Child is a int expression
    else if (value === AST_NODE_NAME_INT_OP) {
      let memory_address_of_sum: StaticDataMetadata = this._code_gen_int_expression(
        int_op_node,
        null,
        current_scope_table
      );// _code_gen_int_expression

      return memory_address_of_sum;
    }// else-if

    // Throw error
    else {
      throw Error(`Code Gen Boolean Comparison --> Expected [ID, Int | Boolean Value | StringExpr | IntExpr | BooleanExpr], but got ${value}`);
    }// else
  }// _store_single_value_in_memory

  /**
   * Back patches identifiers' temporary addresses and anonymous temporary addresses.
   * 
   * TODO: This can be done in ONE pass through the Program Executable Image, don't be lazy and do it!
   */
  private _back_patch(): void {
    // Initialize stack base and limit
    this._current_executable_image.initialize_stack();

    // Back patch all identifiers using the static area
    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        CODE_GENERATION,
        INFO,
        `Back patching identifiers...`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push
    for (let identifier_metadata of this._current_static_table.values()) {

      // Convert the logical stack address to a physical address in memory
      let physical_address: string = (this._current_executable_image.get_stack_base()! + identifier_metadata.logical_stack_address).toString(16).toUpperCase().padStart(4, "0");
      let leading_hex_byte: string = physical_address.substring(0, 2);
      let trailing_hex_byte: string = physical_address.substring(2, 4);
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Identifier [${identifier_metadata.temp_address_leading_hex} ${identifier_metadata.temp_address_trailing_hex}] patched with [${physical_address}].`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push

      // Search for occurences of the temp address in the code area to backpatch
      for (let logical_address: number = 0; logical_address < this._current_executable_image.get_code_area_size(); ++logical_address) {

        // Found temp variable
        if (this._current_executable_image.read_code_area(logical_address) === identifier_metadata.temp_address_leading_hex) {
          if (logical_address !== 0) {
            if (this._current_executable_image.read_code_area(logical_address - 1) === identifier_metadata.temp_address_trailing_hex) {
              // Back patch the leading byte...
              //
              // Since we are using 256 bytes, we only need to worry about
              // 1 byte addresses, so the leading byte in this case should always be: "00"
              this._current_executable_image.write_to_code(leading_hex_byte, logical_address);

              // Back patch trailing byte
              //
              // Remember the ordering is reversed in memory, as it was an 
              // optimization for direct addressing with no offset for the 6502a...
              this._current_executable_image.write_to_code(trailing_hex_byte, logical_address - 1);
            }// if
          }// if
        }// if
      }// for

      // Replace static table entry's current temp address with the real static area address
      identifier_metadata.temp_address_leading_hex = leading_hex_byte;
      identifier_metadata.temp_address_trailing_hex = trailing_hex_byte;
    }// for

    // Back patch anonymous address
    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        CODE_GENERATION,
        INFO,
        `Backpatching anonynmous addresses...`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push
    for (let temp_anonymous_address of this._current_static_table.get_anonymous_addresses()) {
      // Convert the logical stack address to a physical address in memory
      let physical_address: string = (this._current_executable_image.get_stack_base()! + temp_anonymous_address.logical_stack_address).toString(16).toUpperCase().padStart(4, "0");
      let leading_hex_byte: string = physical_address.substring(0, 2);
      let trailing_hex_byte: string = physical_address.substring(2, 4);
      this._curr_prog.stacktrace.push(
        new OutputConsoleMessage(
          CODE_GENERATION,
          INFO,
          `Anonymous address [${temp_anonymous_address.temp_address_leading_hex} ${temp_anonymous_address.temp_address_trailing_hex}] patched with [${physical_address}].`
        )// OutputConsoleMessage
      );// this._curr_prog.stacktrace.push

      // Search for occurences of the temp address in the code area to backpatch
      for (let logical_address: number = 0; logical_address < this._current_executable_image.get_code_area_size(); ++logical_address) {

        // Found temp variable
        if (this._current_executable_image.read_code_area(logical_address) === temp_anonymous_address.temp_address_leading_hex) {
          if (logical_address !== 0) {
            if (this._current_executable_image.read_code_area(logical_address - 1) === temp_anonymous_address.temp_address_trailing_hex) {
              // Back patch the leading byte...
              //
              // Since we are using 256 bytes, we only need to worry about
              // 1 byte addresses, so the leading byte in this case should always be: "00"
              this._current_executable_image.write_to_code(leading_hex_byte, logical_address);

              // Back patch trailing byte
              //
              // Remember the ordering is reversed in memory, as it was an 
              // optimization for direct addressing with no offset for the 6502a...
              this._current_executable_image.write_to_code(trailing_hex_byte, logical_address - 1);
            }// if
          }// if
        }// if
      }// for

      // Replace static table entry's current temp address with the real static area address
      temp_anonymous_address.temp_address_leading_hex = leading_hex_byte;
      temp_anonymous_address.temp_address_trailing_hex = trailing_hex_byte;
    }// for

    // Iterate through executable image and backpatch jumps
    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        CODE_GENERATION,
        INFO,
        `Backpatching jumps...`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push
    for (let logical_address: number = 0; logical_address < this._current_executable_image.get_code_area_size(); ++logical_address) {
      let curr_hex_byte: string = this._current_executable_image.read_code_area(logical_address);
      let curr_jump: Jump | null | undefined = this._current_static_table.get_jump(curr_hex_byte);

      // Found a jump to back patch
      if (curr_jump !== null) {
        // Back patch jumps
        this._curr_prog.stacktrace.push(
          new OutputConsoleMessage(
            CODE_GENERATION,
            INFO,
            `Jump [${curr_hex_byte}] patched with [${curr_jump!.distance.toString(16).toUpperCase().padStart(2, "0")}].`
          )// OutputConsoleMessage
        );// this._curr_prog.stacktrace.push
        this._current_executable_image.write_to_code(curr_jump!.distance.toString(16).toUpperCase().padStart(2, "0"), logical_address);
      }// if
    }// for
  }// back_patch

  /**
   * Re-uses anonymous address in memory, creates one if none are free
   * 
   * @returns an anonymous address
   */
  private _get_anonymous_address(): StaticDataMetadata {
    for (let temp_anonymous_address of this._current_static_table.get_anonymous_addresses()) {
      if (temp_anonymous_address.isUsable === true) {
        this._curr_prog.stacktrace.push(
          new OutputConsoleMessage(
            CODE_GENERATION,
            INFO,
            `Reusing memory location: ${temp_anonymous_address.temp_address_leading_hex, temp_anonymous_address.temp_address_trailing_hex}`
          )// OutputConsoleMessage
        );// this._curr_prog.stacktrace.push
        temp_anonymous_address.isUsable = false;
        return temp_anonymous_address;
      }// if
    }// for

    // Make an anoymous address entry in the static table, for later backtracking
    let static_table_size: number = this._current_static_table.size();
    let temp_location: string = "T" + static_table_size.toString(16).toUpperCase().padStart(3, "$");
    let temp_anonymous_address = new StaticDataMetadata(
      temp_location.substring(0, 2),
      temp_location.substring(2, 4),
      static_table_size
    )// StaticDataMetadata

    this._current_static_table.add_anonymous_address(temp_anonymous_address);

    return temp_anonymous_address;
  }// _create_anonymous_address

  private _get_scope_table_with_identifier(identifier: string | null, current_scope_table: ScopeTable | null): ScopeTable | null {
    let identifier_metadata: VariableMetaData | null | undefined = null;

    // Check parents for identfier
    while (identifier_metadata === null && current_scope_table !== null) {
      identifier_metadata = current_scope_table.get(identifier);

      // Keep searching
      if (identifier_metadata === null) {
        current_scope_table = current_scope_table.parent_scope_table;
      }// if
    }// while

    return current_scope_table;
  }// _get_identifier_from_scope_table

  private _get_identifier_static_data(identfier: string, scope_table_with_identifier: ScopeTable | null): StaticDataMetadata | null | undefined {
    let id_static_data: StaticDataMetadata | null | undefined = null;

    while (id_static_data === null && scope_table_with_identifier !== null) {
      // Use scope table's id to look for identifier in the static table
      id_static_data = this._current_static_table.get(identfier, scope_table_with_identifier.id);

      // If not found keep searching
      if (id_static_data === null) {
        scope_table_with_identifier = this._get_scope_table_with_identifier(
          identfier,
          scope_table_with_identifier.parent_scope_table
        );// this._get_scope_table_with_identifier
      }// if
    }// while

    return id_static_data;
  }// _get_identifier_static_data

  private _convert_decimal_to_one_byte_hex(int: number): string {
    if (int < 0) {
      throw Error(`Cannot write negative number [${int}] to memory.`);
    }// if

    else if (int > 255) {
      throw Error(`Cannot write a number [${int}] bigger than 1 byte to memory.`);
    }// if

    else {
      return int.toString(16).toUpperCase().padStart(2, "0");
    }// else
  }// convert_decimal_to_one_byte_hex

  /**
   * Loads a specified register with a pointer to the string argument.
   * 
   * If a heap instance of the string argument is found, the existent 
   * pointer will be loaded into the register. If no heap instance is found, a new
   * heap entry for the string argument will be made and its pointer loaded to the register.
   * 
   * @param str string to be looked up in heap, created if non-existent.
   * @param load_register_callback the register to load the string pointer to.
   */
  private _load_register_with_string_pointer(str: string, load_register_callback: LoadRegisterWithConstantCallback): string | null | undefined {
    // Remove quotations from string
    str = str.split("\"").join("");

    // Check if string is already in heap
    let string_in_heap_address: string | null | undefined = this._current_static_table.get_string_in_heap(str);

    // String already exists in the heap, point to it instead of making a new entry.
    if (string_in_heap_address !== null) {
      load_register_callback(string_in_heap_address);
      return string_in_heap_address;
    }// if

    // Make new entry in heap for new string
    else {
      let string_start_address: string = this._current_executable_image.write_string_to_heap(str);
      this._current_static_table.put_new_string(str, string_start_address);
      load_register_callback(string_start_address);
      return string_start_address;
    }// else
  }// _load_some_register_with_string_pointer

  /**
   * Load the accumulator with a constant.
   * 
   * @param hex_pair_constant 1 byte constant being loaded into the accumulator
   */
  private _load_accumulator_with_constant(hex_pair_constant: string | null | undefined): void {
    let max_static_area_size = this._current_executable_image.get_heap_limit() - this._current_executable_image.get_code_limit() - 1;
    if (this._current_static_table.size() - this._current_static_table.get_number_of_anonymous_address() >= max_static_area_size) {
      throw Error(`Program static area is not big enough to support LDA [${hex_pair_constant}]!`);
    }// if

    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        CODE_GENERATION,
        INFO,
        `LDA [${hex_pair_constant}]`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push
    this._current_executable_image.write_to_code("A9");
    this._current_executable_image.write_to_code(hex_pair_constant);
  }// loadAccumulatorWithConstant

  /**
   * Load the X register from memory.
   * 
   * @param leading_hex_pair first byte in the 2 byte address.
   * @param trailing_hex_pair second byte in the 2 byte address.
   */
  private _load_accumulator_from_memory(leading_hex_pair: string, trailing_hex_pair: string): void {
    let max_static_area_size = this._current_executable_image.get_heap_limit() - this._current_executable_image.get_code_limit() - 1;
    if (this._current_static_table.size() - this._current_static_table.get_number_of_anonymous_address() >= max_static_area_size) {
      throw Error(`Program static area is not big enough to support LDA [${leading_hex_pair} ${trailing_hex_pair}]!`);
    }// if

    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        CODE_GENERATION,
        INFO,
        `LDA [${leading_hex_pair} ${trailing_hex_pair}]`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push
    this._current_executable_image.write_to_code("AD");

    // Remember to reverse the order, as this used to be 
    // an optimaztion for direct addressing in the old 6502a days.
    this._current_executable_image.write_to_code(trailing_hex_pair);
    this._current_executable_image.write_to_code(leading_hex_pair);
  }// _load_accumulator_from_memory

  /**
   * Store the contents of the accumulator in memory.
   * 
   * @param leading_hex_pair first byte in the 2 byte address.
   * @param trailing_hex_pair second byte in the 2 byte address.
   */
  private _store_accumulator_to_memory(leading_hex_pair: string, trailing_hex_pair: string): void {
    let max_static_area_size = this._current_executable_image.get_heap_limit() - this._current_executable_image.get_code_limit() - 1;
    if (this._current_static_table.size() - this._current_static_table.get_number_of_anonymous_address() >= max_static_area_size) {
      throw Error(`Program static area is not big enough to support STA [${leading_hex_pair} ${trailing_hex_pair}]!`);
    }// if

    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        CODE_GENERATION,
        INFO,
        `STA [${leading_hex_pair} ${trailing_hex_pair}]`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push

    this._current_executable_image.write_to_code("8D");
    // Remember to reverse the order, as this used to be 
    // an optimaztion for direct addressing in the old 6502a days.
    this._current_executable_image.write_to_code(trailing_hex_pair);
    this._current_executable_image.write_to_code(leading_hex_pair);
  }// store_accumulator_to_memory

  /**
   * Adds contents of an address in memory to the contents
   * of the accumulator and keeps the result in the accumulator.
   * 
   * @param leading_hex_pair first byte in the 2 byte address.
   * @param trailing_hex_pair second byte in the 2 byte address.
   */
  private _add_with_carry(leading_hex_pair: string, trailing_hex_pair: string): void {
    let max_static_area_size = this._current_executable_image.get_heap_limit() - this._current_executable_image.get_code_limit() - 1;
    if (this._current_static_table.size() - this._current_static_table.get_number_of_anonymous_address() >= max_static_area_size) {
      throw Error(`Program static area is not big enough to support ADC [${leading_hex_pair} ${trailing_hex_pair}]!`);
    }// if

    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        CODE_GENERATION,
        INFO,
        `ADC [${leading_hex_pair} ${trailing_hex_pair}]`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push
    this._current_executable_image.write_to_code("6D");

    // Remember to reverse the order, as this used to be 
    // an optimaztion for direct addressing in the old 6502a days.
    this._current_executable_image.write_to_code(trailing_hex_pair);
    this._current_executable_image.write_to_code(leading_hex_pair);
  }// _add_with_carry

  /**
   * Load the X register with a constant.
   * 
   * @param hex_pair_constant 1 byte constant being loaded into the X Register
   */
  private _load_x_register_with_constant(hex_pair_constant: string | null | undefined): void {
    let max_static_area_size = this._current_executable_image.get_heap_limit() - this._current_executable_image.get_code_limit() - 1;
    if (this._current_static_table.size() - this._current_static_table.get_number_of_anonymous_address() >= max_static_area_size) {
      throw Error(`Program static area is not big enough to support LDX [${hex_pair_constant}]!`);
    }// if

    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        CODE_GENERATION,
        INFO,
        `LDX [${hex_pair_constant}]`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push
    this._current_executable_image.write_to_code("A2");
    this._current_executable_image.write_to_code(hex_pair_constant);
  }// load_x_register_with_constant

  /**
   * Load the X register from memory.
   * 
   * @param leading_hex_pair first byte in the 2 byte address.
   * @param trailing_hex_pair second byte in the 2 byte address.
   */
  private _load_x_register_from_memory(leading_hex_pair: string, trailing_hex_pair: string): void {
    let max_static_area_size = this._current_executable_image.get_heap_limit() - this._current_executable_image.get_code_limit() - 1;
    if (this._current_static_table.size() - this._current_static_table.get_number_of_anonymous_address() >= max_static_area_size) {
      throw Error(`Program static area is not big enough to support LDX [${leading_hex_pair} ${trailing_hex_pair}]!`);
    }// if

    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        CODE_GENERATION,
        INFO,
        `LDX [${leading_hex_pair} ${trailing_hex_pair}]`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push
    this._current_executable_image.write_to_code("AE");

    // Remember to reverse the order, as this used to be 
    // an optimaztion for direct addressing in the old 6502a days.
    this._current_executable_image.write_to_code(trailing_hex_pair);
    this._current_executable_image.write_to_code(leading_hex_pair);
  }// load_x_register_from_memory

  /**
   * Load the y-register with a constant.
   * 
   * @param hex_pair_constant 1 byte constant being loaded into the Y register
   */
  private _load_y_register_with_constant(hex_pair_constant: string | null | undefined): void {
    let max_static_area_size = this._current_executable_image.get_heap_limit() - this._current_executable_image.get_code_limit() - 1;
    if (this._current_static_table.size() - this._current_static_table.get_number_of_anonymous_address() >= max_static_area_size) {
      throw Error(`Program static area is not big enough to support LDY [${hex_pair_constant}]!`);
    }// if

    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        CODE_GENERATION,
        INFO,
        `LDY [${hex_pair_constant}]`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push
    this._current_executable_image.write_to_code("A0");
    this._current_executable_image.write_to_code(hex_pair_constant);
  }// _load_y_register_with_constant

  /**
   * Load the y-register from memory.
   * 
   * @param leading_hex_pair first byte in the 2 byte address.
   * @param trailing_hex_pair second byte in the 2 byte address.
   */
  private _load_y_register_from_memory(leading_hex_pair: string, trailing_hex_pair: string): void {
    let max_static_area_size = this._current_executable_image.get_heap_limit() - this._current_executable_image.get_code_limit() - 1;
    if (this._current_static_table.size() - this._current_static_table.get_number_of_anonymous_address() >= max_static_area_size) {
      throw Error(`Program static area is not big enough to support LDY [${leading_hex_pair} ${trailing_hex_pair}]!`);
    }// if
    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        CODE_GENERATION,
        INFO,
        `LDY [${leading_hex_pair} ${trailing_hex_pair}]`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push
    this._current_executable_image.write_to_code("AC");

    // Remember to reverse the order, as this used to be 
    // an optimaztion for direct addressing in the old 6502a days.
    this._current_executable_image.write_to_code(trailing_hex_pair);
    this._current_executable_image.write_to_code(leading_hex_pair);
  }// load_y_register_from_memory

  /**
   * Compares the contents of the X register to 
   * the value stored at the specified memory location.
   * 
   * @param leading_hex_pair first byte in the 2 byte address.
   * @param trailing_hex_pair second byte in the 2 byte address.
   */
  private _compare_x_register_to_memory(leading_hex_pair: string, trailing_hex_pair: string): void {
    let max_static_area_size = this._current_executable_image.get_heap_limit() - this._current_executable_image.get_code_limit() - 1;
    if (this._current_static_table.size() - this._current_static_table.get_number_of_anonymous_address() >= max_static_area_size) {
      throw Error(`Program static area is not big enough to support CPX [${leading_hex_pair} ${trailing_hex_pair}]!`);
    }// if

    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        CODE_GENERATION,
        INFO,
        `CPX [${leading_hex_pair} ${trailing_hex_pair}]`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push
    this._current_executable_image.write_to_code("EC");

    // Remember to reverse the order, as this used to be 
    // an optimaztion for direct addressing in the old 6502a days.
    this._current_executable_image.write_to_code(trailing_hex_pair);
    this._current_executable_image.write_to_code(leading_hex_pair);
  }// compare_x_register_to_memory

  /**
   * Branches when the zero flag is set to 0.
   * 
   * @param hex_pair number of bytes to skip
   */
  private _branch_on_zero(hex_pair: string): void {
    let max_static_area_size = this._current_executable_image.get_heap_limit() - this._current_executable_image.get_code_limit() - 1;
    if (this._current_static_table.size() - this._current_static_table.get_number_of_anonymous_address() >= max_static_area_size) {
      throw Error(`Program static area is not big enough to support BNE [${hex_pair}]!`);
    }// if

    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        CODE_GENERATION,
        INFO,
        `BNE [${hex_pair}]`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push
    this._current_executable_image.write_to_code("D0");

    // Bytes to skip
    this._current_executable_image.write_to_code(hex_pair);
  }// _branch_on_zero

  /**
   * Writes a system call.
   */
  private system_call(): void {
    let max_static_area_size = this._current_executable_image.get_heap_limit() - this._current_executable_image.get_code_limit() - 1;
    if (this._current_static_table.size() - this._current_static_table.get_number_of_anonymous_address() >= max_static_area_size) {
      throw Error(`Program static area is not big enough to support SYS CALL [FF]!`);
    }// if

    this._curr_prog.stacktrace.push(
      new OutputConsoleMessage(
        CODE_GENERATION,
        INFO,
        `SYS CALL`
      )// OutputConsoleMessage
    );// this._curr_prog.stacktrace.push
    this._current_executable_image.write_to_code("FF");
  }// system_call

  public get_warning_count(): number {
    return this._warning_count;
  }// get_warning_count

  public get_error_count(): number {
    return this._error_count;
  }// get_error_count
} // CodeGenerationService
