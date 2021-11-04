import { NestedTreeControl } from "@angular/cdk/tree";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { MatTreeNestedDataSource } from "@angular/material/tree";
import { MonacoStandaloneCodeEditor } from "@materia-ui/ngx-monaco-editor";
import { fromEvent, Observable } from "rxjs";
import { ConsoleComponent } from "../components/operating-system/console/console.component";
import { CompilerService } from "../services/compiler/compiler.service";
import { PROGRAMS } from "../services/compiler/src/global";
import { Program } from "../services/compiler/src/models/program";
import { TestService } from "../services/compiler/src/test.service";
import { OperatingSystemService } from "../services/operating-system/operating-system.service";


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
  private btnStartOS: HTMLButtonElement;
  private btnHaltOS: HTMLButtonElement;
  private btnSingleStepMode: HTMLButtonElement;
  private btnNextStep: HTMLButtonElement;

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

  private canvas: HTMLElement;
  private keyBoard: Observable<KeyboardEvent>;

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
   * Power Button [Green | Red] State
   */
  public isPoweredOn: boolean = false;
  public isHalted: boolean = false;
  public isSingleStep: boolean = false;
  public axiosStatus: string = "Offline";
  public compilerStatus: string = "Ready";

  /**
   * Binding data
   */
  programs: Array<Program> = [];
  dataSource = new MatTreeNestedDataSource<TestNode>();
  treeControl = new NestedTreeControl<TestNode>(node => node.children);

  constructor(
    private compilerService: CompilerService,
    private testService: TestService,
    private osService: OperatingSystemService,
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
        compilerTestNode.children?.push({ name: k.toLowerCase(), data: c.get(k), type: COMPILER_TEST })
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

  ngOnInit(): void {
    this.canvas = document.getElementById('appConsole')!;
    this.btnStartOS = document.getElementById('btnStartOS')! as HTMLButtonElement;
    this.btnHaltOS = document.getElementById('btnHaltOS')! as HTMLButtonElement;
    this.btnSingleStepMode = document.getElementById('btnSingleStepMode')! as HTMLButtonElement;
    this.btnNextStep = document.getElementById('btnNextStep')! as HTMLButtonElement;

    if (this.canvas != null) {
      this.keyBoard = fromEvent<KeyboardEvent>(this.canvas, 'keydown');
    } // if
  }// ngOnInit

  //================================================================================
  // Monaco Editor Instance
  //================================================================================

  editorInit(editor: MonacoStandaloneCodeEditor): void {
    // Get editor instance
    this.editor = editor;
  }// editorInit

  //================================================================================
  // Compiler UI Buttons
  //================================================================================

  /**
   * Automatically puts test code in Monaco Editor
   * 
   * @param args test written as string
   * @returns void
   */
  onCompilerTestClick(args: string) {
    if (this.editor == null) { return; }
    this.editor.setValue(args);
    this.opened = false;
  }// onTestClick

  /**
   * Runs te compiler implemented as a service.
   * 
   * @returns void 
   */
  async onCompileButtonClick() {
    this.compiling = true;
    this.compilerStatus = "Compiling...";

    // Artificial delay to convince the user we're doing some serious stuff.
    await new Promise(f => setTimeout(f, 1000));

    // Editor hasn't loaded yet
    if (this.editor == null) { this.compiling = false; return; }

    // Editor loaded, let user compile!
    let compilerGenerator: AsyncGenerator<any, void, unknown> = await this.compilerService.compile(this.editor.getValue());

    // Lex
    let lexerOutput: Map<string, any> = (await compilerGenerator.next()).value;

    // Parse
    let parserOutput: Map<string, any> = (await compilerGenerator.next()).value;

    // Semantic Analysis
    let semanticAnalysisOutput: Map<string, any> = (await compilerGenerator.next()).value;

    // Code Generation
    let codeGenerationOutput: Map<string, any> = (await compilerGenerator.next()).value;

    // Update UI state
    this.programs = codeGenerationOutput.get(PROGRAMS);
    this.compiling = false;
    this.compilerStatus = "Compiled - Ready";
    // Output
  }// onCompileButtonClick

  /**
   * Automatically fills the OS input text area with op codes.
   * 
   * @param executableImage raw op codes from compilation
   */
  onExecutableImageClick(executableImage: string) {
    document.getElementById('taProgramInput')!.innerHTML = executableImage;
  } // onExecutableImageClick

  //================================================================================
  // OS UI Buttons
  //================================================================================

  hostBtnStartOS_click() {

    // Turn Off on AxiOS
    if (this.isPoweredOn) {
      // Update GUI
      this.axiosStatus = "Offline";
      this.btnHaltOS.disabled = true;
      this.btnHaltOS.style.color = "#3d3d3d";
      this.btnSingleStepMode.disabled = true;
      this.btnSingleStepMode.style.color = "#3d3d3d";
      this.btnNextStep.disabled = true;
      this.btnNextStep.style.color = "#3d3d3d";
      this.btnStartOS.style.color = "#228B22";

      // Reset halting and single step
      this.isHalted = false;
      this.isSingleStep = false;
    } // if

    // Turn on AxiOS
    else {
      // Activate Input Streams
      this.axiosStatus = "Online - Okay";
      this.osService.startAxiOS();

      // Activate halt OS button
      this.btnHaltOS.disabled = false;
      this.btnHaltOS.style.color = "red";

      // Activate single step mode button
      this.btnSingleStepMode.disabled = false;
      this.btnSingleStepMode.style.color = "rgba(59, 130, 246, 0.5)";

      // Disable next step button
      this.btnNextStep.disabled = true;
      this.btnNextStep.style.color = "#3d3d3d";
      this.btnStartOS.style.color = "red";
    } // else

    // Flip State
    this.isPoweredOn = !this.isPoweredOn;
  } // hostBtnStartOS_click

  hostBtnHaltOS_click(buttonId: string) {
    if (!this.isPoweredOn || this.isHalted) { return; }

    // Halt OS
    if (!this.isHalted) {
      // Halt OS
      this.axiosStatus = "Online - Halted";
      this.isHalted = true;
      this.btnHaltOS.style.color = "#3d3d3d";

      // Disable single step
      this.btnSingleStepMode.disabled = true;
      this.btnSingleStepMode.style.color = "#3d3d3d";
      this.btnNextStep.disabled = true;
      this.btnNextStep.style.color = "#3d3d3d";
      this.isSingleStep = false;
    } // if
  } // hostBtnHaltOS_click

  hostBtnReset_click(buttonId: string) {
    if (!this.isPoweredOn) { return; }

  } // hostBtnReset_click

  hostBtnSingleStep_click(buttonId: string) {
    if (!this.isPoweredOn || this.isHalted) { return; }

    // Turn off single step
    if (this.isSingleStep) {
      this.axiosStatus = "Online- Okay";

      // Disable Next Step Button
      this.btnNextStep.disabled = true;
      this.btnNextStep.style.color = "#3d3d3d";

      // Make this button blue
      this.btnSingleStepMode.style.color = "rgba(59, 130, 246, 0.5)";
    } // if

    // Enter single step
    else {
      // Make this button blue
      this.axiosStatus = "Online- Single Step";
      this.btnSingleStepMode.style.color = "red";

      // Disable Next Step Button
      this.btnNextStep.disabled = false;
      this.btnNextStep.style.color = "#228B22";
    } // else
    
    this.isSingleStep = !this.isSingleStep;
  } // hostBtnSingleStep_click

  hostBtnNextStep_click(buttonId: string) {
    if (!this.isPoweredOn) { return; }

  } // hostBtnNextStep_click

}// DashboardComponent