import { Component, OnInit } from '@angular/core';
import { MonacoStandaloneCodeEditor } from '@materia-ui/ngx-monaco-editor';
import { CompilerService } from '../services/compiler.service';
import { Subject } from "rxjs";
import { Program } from '../services/compiler/models/program';
import { TestService } from '../services/compiler/test.service';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';


interface TestNode {
  name: string;
  data?: string;
  children?: TestNode[];
}


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})


export class DashboardComponent implements OnInit {
  programs: Array<Program> = [];
  compiling: boolean = false;
  /**
   * Monaco Code Editor Plugin
   */
  private editor: any = null;
  editorOptions = {
    theme: 'vs-dark',
    language: '',
    fontSize: 13
  };
  code: string = 
  `/*Long Test Case - Everything Except Boolean Declaration */
  {
    /* Int Declaration */
    int a
    int b
    a = 0
    b=0
    /* While Loop */
    while (a != 3) {
      print(a)
      while (b != 3) {
        print(b)
        b = 1 + b
        if (b == 2) {
          /* Print Statement */
          print("there is no spoon" /* This will do nothing */ )
        }
      }
      b = 0
      a = 1+a
    }
  }
  $`;
  originalCode: string = 'function x() { // TODO }';

  /**
   * Sidebar [open | close] state
   */
  public opened: boolean = false;

  /**
   * Compiler will send updates as each phase is passed
   */
  private compilerSubject = new Subject();

  /**
   * Test Cases
   */
  treeControl = new NestedTreeControl<TestNode>(node => node.children);
  dataSource = new MatTreeNestedDataSource<TestNode>();

  defaultTestCases: Array<Map<string, string>> = [];
  lexerTestCases: Array<Map<string, string>> = [];
  parserTestCases: Array<Map<string, string>> = [];
  semanticAnalysisTestCases: Array<Map<string, string>> = [];
  codeGenerationTestCases: Array<Map<string, string>> = [];

  constructor(
    private compilerService: CompilerService,
    private testService: TestService,
  ) {

    // Load test cases from services and bind to 
    this.semanticAnalysisTestCases = this.testService.semanticAnalysisTests;
    this.codeGenerationTestCases = this.testService.codeGenerationTests;
    
    // Create a root Compiler 'directory'
    let compilerTestNode: TestNode = {
      name: "Compiler Tests",
      children: [
        {name: "Lexer", children: []},
        {name: "Parser", children: []},
        {name: "Semantic Analysis", children: []},
        {name: "Code Generation", children: []},
      ]
    } // compilerTestNode

    // Load default test cases at root 'directory'
    for (let c of this.testService.defaultTests) {
      for (let k of c.keys()) {
        compilerTestNode.children?.push({name: k.toLowerCase(), data: c.get(k)})
      } // for
    }// for

    // Load Lexer test cases in Lexer 'directory'
    for (let c of this.testService.lexerTests) {
      for (let k of c.keys()) {
        compilerTestNode.children![0].children?.push({name: k.toLowerCase(), data: c.get(k)})
      } // for
    }// for

    // Load Parser test cases in Parser 'directory'
    for (let c of this.testService.parserTests) {
      for (let k of c.keys()) {
        compilerTestNode.children![1].children?.push({name: k.toLowerCase(), data: c.get(k)})
      } // for
    }// for

    // Load Semantic Analysis test cases in Semantic Analysis 'directory'
    for (let c of this.testService.semanticAnalysisTests) {
      for (let k of c.keys()) {
        compilerTestNode.children![2].children?.push({name: k.toLowerCase(), data: c.get(k)})
      } // for
    }// for

    // Load Code Generation test cases in Code Generation 'directory'
    for (let c of this.testService.codeGenerationTests) {
      for (let k of c.keys()) {
        compilerTestNode.children![3].children?.push({name: k.toLowerCase(), data: c.get(k)})
      } // for
    }// for

    // TODO: Create a root Operating Systems 'directory'
    // let osTestNode: TestNode = {
    //   name: "Operating System Tests",
    //   children: []
    // } // osTestNode

    // Bind to component
    this.dataSource.data = [
      compilerTestNode,
      // TODO: osTestNode,
    ];
  } // constructor

  hasChild = (_: number, node: TestNode) => !!node.children && node.children.length > 0;

  ngOnInit(): void { }// ngOnInit

  editorInit(editor: MonacoStandaloneCodeEditor): void {
    // Get editor instance
    this.editor = editor;
  }// editorInit

  onTestClick(args: string) {
    if (this.editor == null) { return; }
    this.editor.setValue(args);
    this.opened = false;
  }// onTestClick

  async onCompileButtonClick() {
    this.compiling = true;

    // Artificial delay to convince the user we're doing some serious stuff.
    await new Promise(f => setTimeout(f, 400));

    // Editor hasn't loaded yet
    if (this.editor == null) { this.compiling = false; return; }

    // Editor loaded, let user compile!
    let copmilerGenerator: AsyncGenerator<any, void, unknown> = await this.compilerService.compile(this.editor.getValue());

    // Step 1: Lex
    let lexerOutput: Map<string, any> = (await copmilerGenerator.next()).value;
    this.compilerSubject.next(lexerOutput);

    // Step 2: Parse
    let parserOutput: Map<string, any> = (await copmilerGenerator.next()).value;
    this.compilerSubject.next(parserOutput);
    console.log(parserOutput)

    this.programs = parserOutput.get('programs');

    this.compiling = false;
    // Output
  }// onCompileButtonClick
}// DashboardComponent