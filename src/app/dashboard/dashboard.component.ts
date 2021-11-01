import { Component, ComponentFactoryResolver, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MonacoStandaloneCodeEditor } from '@materia-ui/ngx-monaco-editor';
import { CompilerService } from '../services/compiler.service';
import { Subject } from "rxjs";
import { CstComponent } from '../cst/cst.component';
import { Program } from '../services/compiler/models/program';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})


export class DashboardComponent implements OnInit {
  programs: Array<Program> = [];

  /**
   * Monaco Code Editor Plugin
   */
  private editor: any = null;
  editorOptions = {
    theme: 'vs-dark',
    language: ''
  };
  code: string = 'function x() {\nconsole.log("Hello world!");\n}';
  originalCode: string = 'function x() { // TODO }';

  /**
   * Sidebar [open | close] state
   */
  public opened: boolean = false;

  /**
   * Compiler will send updates as each phase is passed
   */
  private compilerSubject = new Subject();

  constructor(
    private compilerService: CompilerService,
    private _componentFactoryResolver: ComponentFactoryResolver
  ) { }

  ngOnInit(): void { }// ngOnInit

  editorInit(editor: MonacoStandaloneCodeEditor): void {
    // Get editor instance
    this.editor = editor;
  }// editorInit

  async onCompileButtonClick() {
    // Editor hasn't loaded yet
    if (this.editor == null) { return; }

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
    // Output
  }// onCompileButtonClick
}// DashboardComponent