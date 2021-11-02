import { NestedTreeControl } from "@angular/cdk/tree";
import { Component, OnInit } from "@angular/core";
import { MatTreeNestedDataSource } from "@angular/material/tree";
import { MonacoStandaloneCodeEditor } from "@materia-ui/ngx-monaco-editor";
import { CompilerService } from "../services/compiler.service";
import { PROGRAMS } from "../services/compiler/global";
import { Program } from "../services/compiler/models/program";
import { TestService } from "../services/compiler/test.service";


const COMPILER_TEST = "COMPILER_TEST";
const OPERATING_SYSTEM_TEST = "OPERATING_SYSTEM_TEST";
const codePrompt: string =
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

interface TestNode {
  name: string;
  data?: string;
  type?: string;
  children?: TestNode[];
}


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})


export class DashboardComponent implements OnInit {
  /**
   * Monaco Code Editor Plugin
   */
  private editor: any = null;
  editorOptions = {
    theme: 'vs-dark',
    language: '',
    fontSize: 13
  };
  code: string = codePrompt;
  originalCode: string = codePrompt;

  /**
   * Sidebar [Open | Close] State
   */
  public opened: boolean = false;

  /**
   * Compile Button [Show | Hide] State
   * AND Progress Icon [Show | Hide] State
   */
  public compiling: boolean = false;

  /**
   * Binding data
   */
  programs: Array<Program> = [];
  dataSource = new MatTreeNestedDataSource<TestNode>();
  treeControl = new NestedTreeControl<TestNode>(node => node.children);

  constructor(
    private compilerService: CompilerService,
    private testService: TestService,
  ) {
    // Create a root Compiler 'directory'
    let compilerTestNode: TestNode = {
      name: "Compiler Tests",
      children: [
        { name: "Lexer", children: [] },
        { name: "Parser", children: [] },
        { name: "Semantic Analysis", children: [] },
        { name: "Code Generation", children: [] },
      ]
    } // compilerTestNode

    // Load default test cases at root 'directory'
    for (let c of this.testService.defaultTests) {
      for (let k of c.keys()) {
        compilerTestNode.children?.push({ name: k.toLowerCase(), data: c.get(k), type: COMPILER_TEST})
      } // for
    }// for

    // Load Lexer test cases in Lexer 'directory'
    for (let c of this.testService.lexerTests) {
      for (let k of c.keys()) {
        compilerTestNode.children![0].children?.push({ name: k.toLowerCase(), data: c.get(k), type: COMPILER_TEST })
      } // for
    }// for

    // Load Parser test cases in Parser 'directory'
    for (let c of this.testService.parserTests) {
      for (let k of c.keys()) {
        compilerTestNode.children![1].children?.push({ name: k.toLowerCase(), data: c.get(k), type: COMPILER_TEST })
      } // for
    }// for

    // Load Semantic Analysis test cases in Semantic Analysis 'directory'
    for (let c of this.testService.semanticAnalysisTests) {
      for (let k of c.keys()) {
        compilerTestNode.children![2].children?.push({ name: k.toLowerCase(), data: c.get(k), type: COMPILER_TEST })
      } // for
    }// for

    // Load Code Generation test cases in Code Generation 'directory'
    for (let c of this.testService.codeGenerationTests) {
      for (let k of c.keys()) {
        compilerTestNode.children![3].children?.push({ name: k.toLowerCase(), data: c.get(k), type: COMPILER_TEST })
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
    let compilerGenerator: AsyncGenerator<any, void, unknown> = await this.compilerService.compile(this.editor.getValue());

    // Lex
    let lexerOutput: Map<string, any> = (await compilerGenerator.next()).value;
    console.log(lexerOutput)

    // Parse
    let parserOutput: Map<string, any> = (await compilerGenerator.next()).value;
    console.log(parserOutput)

    // Semantic Analysis
    let semanticAnalysisOutput: Map<string, any> = (await compilerGenerator.next()).value;
    console.log(semanticAnalysisOutput)

    // Code Generation

    this.programs = semanticAnalysisOutput.get(PROGRAMS);
    this.compiling = false;
    // Output
  }// onCompileButtonClick
}// DashboardComponent