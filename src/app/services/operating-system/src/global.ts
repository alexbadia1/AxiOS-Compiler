/* ------------
   Globals.ts
   Global CONSTANTS and _Variables.
   (Global over both the OS and Hardware Simulation / Host.)
   This code references page numbers in our text book:
   Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */
import { Subject } from "rxjs";
import { CpuData, HostLogData } from "../operating-system.service";
import { Address } from "./host/addressBlock";
import { Cpu } from "./host/cpu";
import { Disk } from "./host/disk";
import { Dispatcher } from "./host/dispatcher";
import { Memory } from "./host/memory";
import { MemoryAccessor } from "./host/memoryAccessor";
import { Console } from "./os/console";
import { DeviceDriverDisk } from "./os/deviceDriverDisk";
import { DeviceDriverKeyboard } from "./os/deviceDriverKeyboard";
import { Kernel } from "./os/kernel";
import { PriorityQueue } from "./os/priorityQueue";
import { Queue } from "./os/queue";
import { ResidentList } from "./os/residentList";
import { Scheduler } from "./os/scheduler";
import { Shell } from "./os/shell";
import { Swapper } from "./os/swapper";

export class Globals {
   constructor () { } // constructor
   //
   // Global CONSTANTS (TypeScript 1.5 introduced const. Very cool.)
   //
   // 'cause Bob and I were at a loss for a better name. What did you expect?
   public static readonly APP_NAME: string = "TSOS";
   public static readonly APP_VERSION: string = "0.07";

   /// Consolents
   public static readonly INDENT_STRING = '  ';
   public static readonly INDENT_NUMBER = 16;

   // This is in ms (milliseconds) so 1000 = 1 second.
   public static readonly CPU_CLOCK_INTERVAL: number = 100;

   // Pages 23 (timer), 9 (interrupts), and 561 (interrupt priority).
   // NOTE: The timer is different from hardware/host clock pulses. Don't confuse these.
   public static readonly TIMER_IRQ: number = 0;

   /// Hardware Interrupt
   public static readonly KEYBOARD_IRQ: number = 1;
   public static readonly DISK_IRQ: number = 13; /// uh oh, unlucky 13...

   /// Read/Write Console Interrupts
   public static readonly SYS_CALL_IRQ: number = 2;
   public static readonly PS_IRQ: number = 3;

   /// Single Step Interrupts
   public static readonly SINGLE_STEP_IRQ: number = 4;
   public static readonly NEXT_STEP_IRQ: number = 5;

   /// Scheduling Interrupts
   public static readonly CONTEXT_SWITCH_IRQ: number = 6;
   public static readonly CHANGE_QUANTUM_IRQ: number = 7;
   public static readonly SET_SCHEDULE_ALGORITHM: number = 14;
   public static readonly PRIORITY: string = 'priority';
   public static readonly ROUND_ROBIN: string = 'rr';
   public static readonly FIRST_COME_FIRST_SERVE: string = 'fcfs';

   /// Create Process Interrupts
   public static readonly RUN_PROCESS_IRQ: number = 8;
   public static readonly RUN_ALL_PROCESSES_IRQ: number = 9;

   /// Exit Process Interrupts
   ///
   /// When a process ends, it sends its own termination interrupt
   public static readonly TERMINATE_PROCESS_IRQ: number = 10;

   /// This is the user "killing" the process,
   /// NOT the process sending its own termination interrupt
   public static readonly KILL_PROCESS_IRQ: number = 11;
   public static readonly KILL_ALL_PROCESSES_IRQ: number = 12;

   /// Priority Queuents
   public static readonly ROOT_NODE = 0;

   /// Disknts
   ///
   /// 16KB limit means 4 tracks, 8 sectors, 8 blocks (each 64 Bytes)
   public static readonly TRACK_LIMIT = 4;
   public static readonly SECTOR_LIMIT = 8;
   public static readonly BLOCK_LIMIT = 8;
   public static readonly BLOCK_SIZE_LIMIT = 64;
   public static readonly DATA_BLOCK_DATA_LIMIT = 59;
   public static readonly DIRECTORY_BLOCK_DATA_LIMIT = 50;
   public static readonly METADATA_BYTE_SIZE = 13;
   public static readonly FLAG_INDEXES = { start: 0, end: 3 };
   public static readonly POINTER_INDEXES = { start: 4, end: 9 };
   public static readonly DATE_INDEXES = { start: 10, end: 23 };
   public static readonly FILE_SIZE_INDEXES = { start: 24, end: 27 };
   public static readonly DIRECTORY_DATA_INDEXES = { start: 28, end: 128 };
   public static readonly DATA_DATA_INDEXES = { start: 10, end: 128 }
   public static readonly BLOCK_NULL_POINTER = "FFFFFF";
   public static readonly NEGATIVE_ZERO = 32_768;
   public static readonly FILE_META_DATA_LENGTH = 15;

   //
   // Global Variables
   // TODO: Make a global object and use that instead of the "_" naming convention in the global namespace.
   //
   public static _CPU: Cpu;  // Utilize TypeScript's type annotation system to ensure that _CPU is an instance of the Cpu class.
   public static _CPU_BURST: number; /// Keep track of the number of bursts the CPU has performed

   /// Step -1: Learn from past mistakes and READ the fudgin' HINTS...
   ///
   /// Hardware (host)
   public static _Memory: Memory;
   public static _MemoryAccessor: MemoryAccessor;

   public static _Dispatcher: Dispatcher;
   public static _Swapper: Swapper;
   public static _Scheduler: Scheduler;

   public static _Disk: Disk;

   // Subjects
   public static _hostLog$: Subject<HostLogData> | null;
   public static _cpu$: Subject<CpuData> | null;
   public static _memory$: Subject<Array<Address>> | null;

   /// Software (OS)
   public static _MemoryManager: any = null;
   public static _ResidentList: ResidentList;

   public static _OSclock: number = 0;  // Page 23.

   public static _Mode: number = 0;     // (currently unused)  0 = Kernel Mode, 1 = User Mode.  See page 21.
   public static _SingleStepMode: boolean = false;
   public static _NextStep: boolean = false;

   public static _Canvas: HTMLCanvasElement;          // Initialized in Control.hostInit().
   public static _DrawingContext: any;                // = _Canvas.getContext("2d");  // Assigned here for type safety, but re-initialized in Control.hostInit() for OCD and logic.
   public static _taProgramInput: any;
   public static _visualResidentList: any;            // global variable for the residentlis
   public static _DefaultFontFamily: string = "sans"; // Ignored, I think. The was just a place-holder in 2008, but the HTML canvas may have use for it.
   public static _DefaultFontSize: number = 10;
   public static _FontHeightMargin: number = 4;       // Additional space added to font size when advancing a line.

   public static _Trace: boolean = true;              // Default the OS trace to be on.

   // The OS Kernel and its queues.
   public static _Kernel: Kernel;
   public static _KernelInterruptPriorityQueue: PriorityQueue = null!;
   public static _KernelInputQueue: Queue | null = null;
   public static _KernelBuffers: any = null;

   // Standard input and output
   public static _StdIn: Console;
   public static _StdOut: Console;

   // UI
   public static _Console: Console;
   public static _OsShell: Shell;

   // At least this OS is not trying to kill you. (Yet.)
   public static _SarcasticMode: boolean = false;
   public static _TwentyFourHourClock: boolean = false;

   // Global Device Driver Objects - page 12
   public static _krnKeyboardDriver: DeviceDriverKeyboard | null = null;
   public static _krnDiskDriver: DeviceDriverDisk = null!;

   public static _hardwareClockID: any = null;

   // For testing (and enrichment)...
   public static Glados: any = null;  // This is the function Glados() in glados-ip*.js http://alanclasses.github.io/TSOS/test/ .
   public static _GLaDOS: any = null; // If the above is linked in, this is the instantiated instance of Glados.

   /// Define max number of volumes and their max size
   public static MAX_NUMBER_OF_VOlUMES: number = 3;
   public static MAX_SIMPLE_VOLUME_CAPACITY: number = 256;
} // Globals