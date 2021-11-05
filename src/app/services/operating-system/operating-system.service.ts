import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Control } from './src/host/control';


export class HostLogData {
  constructor(
    public clock: string = "[Clock]",
    public source: string = "[Source]",
    public message: string = "[Message]",
    public now: string = "[Now]"
  ) { } // constuctor
} // HostLog


@Injectable({
  providedIn: 'root'
})
export class OperatingSystemService {
  private hostLogSnapshot$: Subject<HostLogData> | null = null;
  private cpuSnapshot$: Subject<any> | null = null;
  private processesSnapshot$: Subject<any> | null = null;
  private memorySnapshot$: Subject<any> | null = null;
  public keys: Array<string> = [];

  constructor() { } // constructor

  public power() {
      // Setup channels for communication from AxiOS
      this.setupSubjects();

      // Run the AxiOS
      Control.hostInit(
        this.hostLogSnapshot$,
      );
      Control.hostBtnStartOS_click();
  } //startAxiOS

  public shutdown() {
    this.tearDownSubjects();
  } // shutdown

  /**
   * Allows AxiOS to send data back to the UI.
   */
  public setupSubjects() {
    this.hostLogSnapshot$ = new Subject();
    this.cpuSnapshot$ = new Subject();
    this.processesSnapshot$ = new Subject();
    this.memorySnapshot$ = new Subject();
  } // setUpSubjects

  /**
   * Shutdown AxiOS communication channels.
   */
  public tearDownSubjects() {
    this.hostLogSnapshot$ = null;
    this.cpuSnapshot$ = null;
    this.processesSnapshot$ = null;
    this.memorySnapshot$ = null;
  } // tearDownSubjects

  public hostLog$(): Subject<any> { return this.hostLogSnapshot$!; } // hostLog$
  public cpu$(): Subject<any> { return this.cpuSnapshot$!; } // cpu$
  public processes$(): Subject<any> { return this.processesSnapshot$!; } // processes$
  public memory$(): Subject<any> { return this.memorySnapshot$!; } // memory$
} // OperatingSystemService
