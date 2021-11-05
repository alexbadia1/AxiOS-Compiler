import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Address } from './src/host/addressBlock';
import { Control } from './src/host/control';


export class HostLogData {
  constructor(
    public clock: string = "[Clock]",
    public source: string = "[Source]",
    public message: string = "[Message]",
    public now: string = "[Now]"
  ) { } // constuctor
} // HostLog

export class CpuData {
  constructor(
    public pc: string = "00",
    public ir: string = "00",
    public acc: string = "00",
    public x: string = "00",
    public y: string = "00",
    public z: string = "0"
  ) { } // constuctor
} // CpuData

export class PcbData {
  constructor(
    public pid: string = "00",
    public pc: string = "00",
    public ir: string = "00",
    public acc: string = "00",
    public x: string = "00",
    public y: string = "00",
    public z: string = "0",
    public priority: string = "0",
    public state: string = "-----",
    public location: string = "-----"
  ) { } // constuctor
} // CpuData

@Injectable({
  providedIn: 'root'
})
export class OperatingSystemService {
  private hostLogSnapshot$: Subject<HostLogData> | null = null;
  private cpuSnapshot$: Subject<CpuData> | null = null;
  private processesSnapshot$: Subject<Array<PcbData>> | null = null;
  private memorySnapshot$: Subject<Array<Address>> | null = null;
  public keys: Array<string> = [];

  constructor() { } // constructor

  public power() {
      // Setup channels for communication from AxiOS
      this.setupSubjects();

      // Run the AxiOS
      Control.hostInit(
        this.hostLogSnapshot$,
        this.cpuSnapshot$,
        this.memorySnapshot$,
        this.processesSnapshot$
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
