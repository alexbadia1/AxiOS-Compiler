import { animate, state, style, transition, trigger } from "@angular/animations";
import { NestedTreeControl } from "@angular/cdk/tree";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { MatTreeNestedDataSource } from "@angular/material/tree";
import { MonacoStandaloneCodeEditor } from "@materia-ui/ngx-monaco-editor";
import { Subject } from "rxjs";
import { CompilerService } from "../services/compiler/compiler.service";
import { PROGRAMS } from "../services/compiler/src/global";
import { Program } from "../services/compiler/src/models/program";
import { TestService } from "../services/compiler/src/test.service";
import { CpuData, HostLogData, OperatingSystemService, PcbData } from "../services/operating-system/operating-system.service";
import { Address } from "../services/operating-system/src/host/addressBlock";


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
} // TestNode

export interface AddressMap {
  physicalAddress: number,
  value: string,
} // locationMap

/**
 * Represents a row of 8 memory locations
 */
export class MemoryRow {
  constructor(
    public baseInHex: string,
    public addresses: Array<AddressMap>
  ) { } //constuctor
} // MemoryRow

export class MemoryMap {
  public rows: Array<MemoryRow> = [];
  constructor(
    newRows: Array<MemoryRow>
  ) {
    if (newRows != null) {
      this.rows = newRows;
      return;
    } // if
    let tmp: Array<AddressMap> = [];
    for (let i: number = 0; i <= 768; ++i) {
      if (i % 8 == 0 && i != 0) {
        this.rows.push(
          new MemoryRow(
            (i - 8).toString(16).padStart(3, "0"),
            tmp
          ) // MemoryRow
        ); // this.rows.push

        tmp = [];
      } // if

      tmp.push({ physicalAddress: i, value: "00" });
    } // for
  } // constructor
} // MemoryMap

@Component({
  selector: 'app-dashboard',
  animations: [
    trigger('openClose', [
      // ...
      state('open', style({
        height: '200px',
        opacity: 1,
        color: 'yellow'
      })),
      state('closed', style({
        height: '100px',
        opacity: 0.8,
        color: 'blue'
      })),
      transition('open => closed', [
        animate('1s')
      ]),
      transition('closed => open', [
        animate('0.5s')
      ]),
    ]),
  ],
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

  //================================================================================
  // Nightingale Comiler Instance Variables
  //================================================================================

  /**
   * Compile Button [Show | Hide] State
   * AND Progress Icon [Show | Hide] State
   */
  public compiling: boolean = false;
  public compilerStatus: string = "Ready";

  /**
   * Compiler UI Binding
   */
  isPasted: boolean = false;
  programs: Array<Program> = [];
  dataSource = new MatTreeNestedDataSource<TestNode>();
  treeControl = new NestedTreeControl<TestNode>(node => node.children);

  //================================================================================
  // AxiOS Instance Variables
  //================================================================================

  /**
   * AxiOS power button state
   */
  public isPoweredOn: boolean = false;
  private btnStartOS: HTMLButtonElement;
  public axiosStatus: string = "Offline";


  /**
   * AxiOS single step button state
   */
  public isSingleStep: boolean = false;
  private btnSingleStepMode: HTMLButtonElement;

  /**
   * AxiOS GUI references
   */
  private canvas: HTMLCanvasElement;
  private btnNextStep: HTMLButtonElement;

  /**
   * AxiOS Subscribers
   */
  private hostLog$: Subject<any> | null = null;
  private cpu$: Subject<any> | null = null;
  private processes$: Subject<any> | null = null;
  private memory$: Subject<any> | null = null;
  public opCodeInput$: Subject<string> = new Subject<string>();
  private terminateProcess$: Subject<any> = null!;

  /**
   * AxiOS Component Data Binding
   */
  public pc: string = "00"
  public hostLogData: Array<HostLogData> = [];
  public cpuData: CpuData = new CpuData();
  public memory: MemoryMap = new MemoryMap(null!);
  public processes: Array<PcbData> = [];
  public opCodeInput: string = "";
  testModel: string;

  constructor(
    private compilerService: CompilerService,
    private testService: TestService,
    private osService: OperatingSystemService,
  ) {
    // Send Axios text input subject
    this.osService.setOpCodeSubject(this.opCodeInput$);

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
    this.canvas = document.getElementById('display')! as HTMLCanvasElement;
    this.btnStartOS = document.getElementById('btnStartOS')! as HTMLButtonElement;
    this.btnSingleStepMode = document.getElementById('btnSingleStepMode')! as HTMLButtonElement;
    this.btnNextStep = document.getElementById('btnNextStep')! as HTMLButtonElement;
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
    // Send new op code input to AxiOS
    this.opCodeInput$.next(executableImage);

    // Show the visual changes
    this.opCodeInput = executableImage;
  } // onExecutableImageClick

  onOpCodeInputChange(newOpCodes: string) {
    // Send new op code input to AxiOS
    this.opCodeInput$.next(newOpCodes);

    // Show the visual changes
    this.opCodeInput = newOpCodes;
  } // onOpCodeInputChange

  //================================================================================
  // OS UI Buttons
  //================================================================================

  hostBtnStartOS_click() {

    // Shutdown AxiOS
    if (this.isPoweredOn) {
      // Update GUI
      this.axiosStatus = "Offline";
      this.btnSingleStepMode.disabled = true;
      this.btnSingleStepMode.style.color = "#3d3d3d";
      this.btnNextStep.disabled = true;
      this.btnNextStep.style.color = "#3d3d3d";
      this.btnStartOS.style.color = "#228B22";

      // Reset halting and single step
      this.isSingleStep = false;

      // Shutdown and clear canvas
      this.osService.shutdown();
      let ctx = this.canvas?.getContext('2d');
      ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.osService = new OperatingSystemService();
    } // if

    // Power AxiOS
    else {
      // Clear Host Log
      this.hostLogData = [];

      // Power on and setup scubscriptions
      this.osService.power();
      this.setupAxiosSubscriptions();

      // Get op codes if user loaded them before AxiOS was powered.
      this.opCodeInput$.next(this.opCodeInput);
      this.axiosStatus = "Online - Okay";

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

  hostBtnSingleStep_click() {
    if (!this.isPoweredOn) { return; }

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
    this.osService.onSingleStepButtonClick();
  } // hostBtnSingleStep_click

  hostBtnNextStep_click() {
    if (!this.isPoweredOn || !this.isSingleStep) { return; }
    this.osService.onNextStepButtonClick();
  } // hostBtnNextStep_click

  //================================================================================
  // AxiOS Subscriptions
  //================================================================================

  private setupAxiosSubscriptions() {
    // Retrieve Axios Subjects
    this.hostLog$ = this.osService.hostLog$();
    this.cpu$ = this.osService.cpu$();
    this.processes$ = this.osService.processes$();
    this.memory$ = this.osService.memory$();
    this.terminateProcess$ = this.osService.terminateProcess$();

    // Subscribe and map to UI functions
    this.hostLog$.subscribe(val => this.hostLogReaction(val));
    this.cpu$.subscribe(val => this.cpuReaction(val));
    this.processes$.subscribe(val => this.processesReaction(val));
    this.memory$.subscribe(val => this.memoryReaction(val));
    this.terminateProcess$.subscribe(val => this.terminateProcessReaction(val));
  } // setUpSubscriptions

  private teardownAxiosSubscriptions() {
    this.hostLog$ = null;
    this.cpu$ = null;
    this.processes$ = null;
    this.memory$ = null;
  } // teardownSubscriptions

  /**
   * Updates the UI based on the new Host Log Data passed in.
   * 
   * @param newHostLog AxiOS Host Log Data for current cpu cycle.
   */
  private hostLogReaction(newHostLog: HostLogData) {
    this.hostLogData.push(newHostLog);
    this.autoScrollToBottom('appHostLog');
  } // hostLogReaction

  /**
   * Current state of the CPU.
   * 
   * @param newCpuData AxiOS Host Log Data for current cpu cycle.
   */
  private cpuReaction(newCpuData: CpuData) {
    this.cpuData = newCpuData;
  } // cpuReaction

  /**
   * Display current snapshot of memory in the GUI
   * 
   * @param newMemoryAddresses 
   */
  private memoryReaction(newMemoryAddresses: Array<Address>) {
    let tmp: Array<AddressMap> = [];
    let memoryRows: Array<MemoryRow> = [];
    let memoryAddressesSize: number = newMemoryAddresses.length;
    for (let i: number = 0; i <= memoryAddressesSize; ++i) {
      if (i % 8 == 0 && i != 0) {
        memoryRows.push(
          new MemoryRow(
            (i - 8).toString(16).padStart(3, "0"),
            tmp
          ) // MemoryRow
        ); // this.rows.push

        tmp = [];
      } // if

      if (i != memoryAddressesSize) {
        tmp.push({ physicalAddress: newMemoryAddresses[i].physicalAddress, value: newMemoryAddresses[i].data });
      } // if
    } // for
    this.memory = new MemoryMap(memoryRows);
  } // memoryReaction

  /**
   * Display current resident list in the GUI
   * 
   * @param newProcesses 
   */
  private processesReaction(newProcesses: Array<PcbData>) {
    this.processes = newProcesses;
  } // processesReaction

  /**
   * Turn off single step
   */
  private terminateProcessReaction(val: any) {
    console.log(val);
    this.axiosStatus = "Online- Okay";

    // Disable Next Step Button
    this.btnNextStep.disabled = true;
    this.btnNextStep.style.color = "#3d3d3d";

    // Make this button blue
    this.btnSingleStepMode.style.color = "rgba(59, 130, 246, 0.5)";

    this.isSingleStep = false;
  } // terminateProcessReaction

  onAxiOsTabChange(event: MatTabChangeEvent) {
    switch (event.index) {
      case 4:
        this.autoScrollToBottom('appHostLog');
        break;
      default:
        break;
    } // switch
  } // onAxiOsTabChange

  private autoScrollToBottom(id: string) {
    // Autoscroll
    let el = document.getElementById(id);
    if (el != null || el != undefined) {
      el.scrollTop = el.scrollHeight;
    } // if
  } // autoScrollToBottom
}// DashboardComponent