/* ------------
     Control.ts
     Routines for the hardware simulation, NOT for our client OS itself.
     These are static because we are never going to instantiate them, because they represent the hardware.
     In this manner, it's A LITTLE BIT like a hypervisor, in that the Document environment inside a browser
     is the "bare metal" (so to speak) for which we write code that hosts our client OS.
     But that analogy only goes so far, and the lines are blurred, because we are using TypeScript/JavaScript
     in both the host and client environments.
     This (and other host/simulation scripts) is the only place that we should see "web" code, such as
     DOM manipulation and event handling, and so on.  (Index.html is -- obviously -- the only place for markup.)
     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */

import { Scheduler } from "../os/scheduler";
import { Globals } from "../global";
import { CanvasTextFunctions } from "../os/canvas";
import { Interrupt } from "../os/interrupt";
import { ResidentList } from "../os/residentList";
import { Swapper } from "../os/swapper";
import { Cpu } from "./cpu";
import { Devices } from "./devices";
import { Dispatcher } from "./dispatcher";
import { Memory } from "./memory";
import { MemoryAccessor } from "./memoryAccessor";
import { Kernel } from "../os/kernel";
import { Subject } from 'rxjs';
import { CpuData, HostLogData, PcbData } from "../../operating-system.service";
import { Address } from "./addressBlock";
import { SessionStorageVal } from "src/app/dashboard/dashboard.component";

//
// Control Services
//
export class Control {
    public static hostInit(
        hostLog$: Subject<HostLogData> | null,
        cpu$: Subject<CpuData> | null,
        memory$: Subject<Array<Address>> | null,
        processes$: Subject<Array<PcbData>> | null,
        opCodeInput$: Subject<string> | null,
        sessionStorage$: Subject<any>
    ): void {
        // This is called from OS Service's power() method
        //
        // Make injected subjects available to the enitre operating system.
        Globals._hostLog$ = hostLog$;
        Globals._cpu$ = cpu$;
        Globals._memory$ = memory$;
        Globals._processes = processes$;
        Globals._sessionStorage$ = sessionStorage$;

        // Listen for op code input changes
        if (opCodeInput$ != undefined && opCodeInput$ != null) {
            opCodeInput$.subscribe(newOpCodes => { Globals._taProgramInput = newOpCodes; });
        } // if

        // Get a global reference to the canvas.
        //
        // TODO: Should we move this stuff into a Display Device Driver?
        Globals._Canvas = <HTMLCanvasElement>document.getElementById('display');

        // Get a global reference to the drawing context.
        Globals._DrawingContext = Globals._Canvas.getContext("2d");

        // Enable the added-in canvas text functions (see canvastext.ts for provenance and details).
        CanvasTextFunctions.enable(Globals._DrawingContext);   // Text functionality is now built in to the HTML5 canvas. But this is old-school, and fun, so we'll keep it.
    }/// hostInit

    /**
     * Sends Host Log Data back to the UI.
     * 
     * @param msg string
     * @param source string
     */
    public static hostLog(msg: string, source: string = "?"): void {
        if (Globals._hostLog$ != undefined && Globals._hostLog$ != null) {
            Globals._hostLog$.next(
                new HostLogData(
                    Globals._OSclock.toString(),  // Note the OS CLOCK.
                    source,
                    msg,
                    new Date().getTime().toString()  // Note the REAL clock in milliseconds since January 1, 1970.
                ),
            ); // Globals._hostLog$.next
        } // if
        // Update the log console.
    } // hostLog


    //
    // Host Events
    //
    public static hostBtnStartOS_click(): void {
        // .. set focus on the OS console display ...
        document.getElementById("display")?.focus();

        // ... Create and initialize the CPU (because it's part of the hardware)  ...
        Globals._CPU = new Cpu();  // Note: We could simulate multi-core systems by instantiating more than one instance of the CPU here.
        Globals._CPU.init();       //       There's more to do, like dealing with scheduling and such, but this would be a start. Pretty cool.
        Globals._CPU_BURST = 0; /// Starts on CPU burst 0 have been performed.

        /// ... Create and initialize the Memory
        Globals._Memory = new Memory();
        Globals._Memory.init();

        /// ... Create and initialize Memory Accessor
        Globals._MemoryAccessor = new MemoryAccessor();

        /// ...Create a PCB queue to keep track of currently running pcb's
        Globals._ResidentList = new ResidentList();
        Globals._ResidentList.init();

        /// ... Create and initialize Dispatcher
        Globals._Dispatcher = new Dispatcher();

        /// ... Create and initialixe Swapper
        Globals._Swapper = new Swapper();

        /// ... Create and initialize Scheduler
        Globals._Scheduler = new Scheduler();

        // ... then set the host clock pulse ...
        Globals._hardwareClockID = setInterval(Devices.hostClockPulse, Globals.CPU_CLOCK_INTERVAL);
        // .. and call the OS Kernel Bootstrap routine.

        Globals._Kernel = new Kernel();
        Globals._Kernel.krnBootstrap();  // _GLaDOS.afterStartup() will get called in there, if configured.
    }/// hostBtnStartOS_click

    public static hostBtnHaltOS_click(): void {
        Control.hostLog("Emergency halt", "host");
        Control.hostLog("Attempting Kernel shutdown.", "host");
        // Call the OS shutdown routine.
        Globals._Kernel.krnShutdown();
        // Stop the interval that's simulating our clock pulse.
        clearInterval(Globals._hardwareClockID);
        // TODO: Is there anything else we need to do here?
        document.getElementById('divLog--status')!.innerText = "";
    } // hostBtnHaltOS_click

    /************************************************************************************************
    iProject2 Buttons and Display: 
        Provides the ability to single-step execution (via GUI buttons):
            - hostBtnSingleStep_click(): toggles single step mode on or off
            - hostBtnNextStep_click(): performs one kernel clock pulse per button press
            - intializeVisualMemory(): called on start up of os to create the table for memory
            - updateVisualMemory(): called after every cpu cycle to visually update the memory table
            - updateVisualCpu(): called after every cpu cycle to visually update the cpu table
            - visualizeInstructionRegister()
            - formatToHexWithPadding(): formats decimal string to hexadecimal
    **************************************************************************************************/

    public static hostBtnSingleStep_click(): void {
        Globals._SingleStepMode = !Globals._SingleStepMode;
        Globals._KernelInterruptPriorityQueue!.enqueueInterruptOrPcb(new Interrupt(Globals.SINGLE_STEP_IRQ, []));
    }/// hostBtnSingleStep_click

    public static hostBtnNextStep_click(): void {
        /// Process single step interrupt
        Globals._KernelInterruptPriorityQueue!.enqueueInterruptOrPcb(new Interrupt(Globals.NEXT_STEP_IRQ, []));
    }/// hostBtnNextStep_click

    /**
     * Sends Memory Snapshot back to the UI
     */
    public static updateVisualMemory() {
        if (Globals._memory$ != undefined && Globals._memory$ != null) {
            Globals._memory$.next(Globals._Memory.addressBlock);
        } // if
    }/// updateVisualMemory

    /**
     * Sends CPU Data back to the UI
     */
    public static updateVisualCpu() {
        if (Globals._cpu$ != undefined && Globals._cpu$ != null) {
            Globals._cpu$.next(
                new CpuData(
                    this.formatToHexWithPadding(Globals._CPU.PC),
                    Globals._CPU.IR,
                    Globals._CPU.Acc,
                    Globals._CPU.Xreg,
                    Globals._CPU.Yreg,
                    Globals._CPU.Zflag.toString()
                ) // CpuData
            ); // Globals._cpu$.next
        } // if
    }/// updateVisualCpu

    public static visualizeInstructionRegister(newInsruction: string) {
        /// Instruction Register
        Globals._CPU.IR = newInsruction;
        Globals._CPU.localPCB!.instructionRegister = newInsruction;
    }/// visualizeInstructionRegister


    public static formatToHexWithPadding(decimalNum: number) {
        var hexNumber: string = decimalNum.toString(16);

        /// Add left 0 padding
        var paddedhexNumber: string = "00" + hexNumber;
        paddedhexNumber = paddedhexNumber.substr(paddedhexNumber.length - 2).toUpperCase();

        return paddedhexNumber;
    }/// formatToHexWithPadding

    public static formatToHexWithPaddingTwoBytes(decimalNum: number) {
        var hexNumber: string = decimalNum.toString(16);

        /// Add left 0 padding
        var paddedhexNumber: string = "0000" + hexNumber;
        paddedhexNumber = paddedhexNumber.substr(paddedhexNumber.length - 4).toUpperCase();

        return paddedhexNumber;
    }/// formatToHexWithPadding

    public static formatToHexWithPaddingSevenBytes(date: string) {
        var monthInHex = parseInt(date.substring(0, 2)).toString(16).padStart(2, '0'); /// Month
        var dayInHex = parseInt(date.substring(2, 4)).toString(16).padStart(2, '0'); /// Day
        var yearInHex = parseInt(date.substring(4, 8)).toString(16).padStart(4, '0'); /// Year
        var hoursInHex = parseInt(date.substring(8, 10)).toString(16).padStart(2, '0'); /// Hours
        var minutesInHex = parseInt(date.substring(10, 12)).toString(16).padStart(2, '0');/// Minutes
        var secondsInHex = parseInt(date.substring(12, 14)).toString(16).padStart(2, '0'); /// Seconds
        return monthInHex + dayInHex + yearInHex + hoursInHex + minutesInHex + secondsInHex;
    }/// formatToHexWithPadding

    /*************************************************************************************
    iProject3 Display: 
        calculateAvergeWaitTime()
        calculateAverageTurnAroundTime()
        showCPUBurstUsage()
        showWaitTimes()
        showTurnaroundTimes()
        showProcessOutputs()
        dumpScheduleMetaData()
        dumpResidentList()
    ***************************************************************************************/

    /// Calculate the average wait time by summing all the wait times divided by the number of processes
    public static calculateAverageWaitTime(): number {
        var totalWaitTime: number = 0;
        for (var i: number = 0; i < Globals._Scheduler.processesMetaData.length; ++i) {
            /// _Scheduler.processWaitTimes contains a list of lists where the nested list contains:
            ///     [processID, processTimeSpentExecuting, processWaitTime, processTurnaroundTime]
            totalWaitTime += Globals._Scheduler.processesMetaData[i][2];
        }///for
        return (totalWaitTime / Globals._Scheduler.processesMetaData.length);
    }/// calculateAverageWaitTime

    /// Calculate the average wait time by summing all the wait times divided by the number of processes
    public static calculateAverageTurnaroundTime(): number {
        var totalTurnaroundTime: number = 0;
        for (var i: number = 0; i < Globals._Scheduler.processesMetaData.length; ++i) {
            /// _Scheduler.processWaitTimes contains a list of lists where the nested list contains:
            ///     [processID, processTimeSpentExecuting, processWaitTime, processTurnaroundTime]
            /// Ex:
            ///     [[0, 11, 2, 4], [1, 5, 4, 8], ...]
            totalTurnaroundTime += Globals._Scheduler.processesMetaData[i][3];
        }/// for
        return totalTurnaroundTime / Globals._Scheduler.processesMetaData.length;
    }/// calculateAverageWaitTime


    public static showCPUBurstUsage(): void {
        /// Header
        Globals._StdOut.putText("Scheduled Processes CPU Burst Usage (cycles):");
        Globals._StdOut.advanceLine();

        /// _Scheduler.processWaitTimes contains a list of lists where the nested list contains:
        ///     [processID, processTimeSpentExecuting, processWaitTime, processTurnaroundTime]
        /// Ex:
        ///     [[0, 11, 2, 4], [1, 5, 4, 8], ...]
        for (var i: number = 0; i < Globals._Scheduler.processesMetaData.length; ++i) {
            i === 0 ?
                /// Indent on first Pid
                Globals._StdOut.putText(`  Pid ${Globals._Scheduler.processesMetaData[i][0]}: ${Globals._Scheduler.processesMetaData[i][1]}`)

                /// No Indent on all the other pid's
                : Globals._StdOut.putText(`Pid ${Globals._Scheduler.processesMetaData[i][0]}: ${Globals._Scheduler.processesMetaData[i][1]}`)

            /// Don't add a comma after the last pid
            if (i !== Globals._Scheduler.processesMetaData.length - 1) {
                Globals._StdOut.putText(", ");
            }/// if
        }///for
        Globals._StdOut.advanceLine();
        Globals._StdOut.putText("...");
        Globals._StdOut.advanceLine();
    }/// showCPUBurstUsage

    public static showWaitTimes(): void {
        Globals._StdOut.putText("Scheduled Processes Wait Time (cycles):");
        Globals._StdOut.advanceLine();
        Globals._StdOut.putText(`  AWT: ${Math.ceil(this.calculateAverageWaitTime())}, `);
        for (var i: number = 0; i < Globals._Scheduler.processesMetaData.length; ++i) {
            /// _Scheduler.processWaitTimes contains a list of lists where the nested list contains:
            ///     [processID, processTimeSpentExecuting, processWaitTime, processTurnaroundTime]
            /// Ex:
            ///     [[0, 11, 2, 4], [1, 5, 4, 8], ...]
            Globals._StdOut.putText(`Pid ${Globals._Scheduler.processesMetaData[i][0]}: ${Globals._Scheduler.processesMetaData[i][2]}`);

            /// Again, don't add a comma after the last pid
            if (i !== Globals._Scheduler.processesMetaData.length - 1) {
                Globals._StdOut.putText(", ");
            }/// if
        }///for
        Globals._StdOut.advanceLine();
        Globals._StdOut.putText("...");
        Globals._StdOut.advanceLine();
    }/// showWaitTimes()

    public static showTurnaroundTimes(): void {
        Globals._StdOut.putText("Scheduled Processes Turnaround Time (cycles):");
        Globals._StdOut.advanceLine();
        Globals._StdOut.putText(`  ATT: ${Math.ceil(this.calculateAverageTurnaroundTime())}, `);
        for (var i: number = 0; i < Globals._Scheduler.processesMetaData.length; ++i) {
            /// Globals._Scheduler.processWaitTimes contains a list of lists where the nested list contains:
            ///     [processID, processTimeSpentExecuting, processWaitTime, processTurnaroundTime]
            /// Ex:
            ///     [[0, 11, 2, 4], [1, 5, 4, 8], ...]
            Globals._StdOut.putText(`Pid ${Globals._Scheduler.processesMetaData[i][0]}: ${Globals._Scheduler.processesMetaData[i][3]}`);
            if (i !== Globals._Scheduler.processesMetaData.length - 1) {
                Globals._StdOut.putText(", ");
            }/// if
        }///for
        Globals._StdOut.advanceLine();
        Globals._StdOut.putText("...");
        Globals._StdOut.advanceLine();
    }/// showTurnaroundTimes

    public static showProcessesOutputs(): void {
        Globals._StdOut.putText("Dumping Processes Output(s):");
        Globals._StdOut.advanceLine();
        for (var i: number = 0; i < Globals._Scheduler.unInterleavedOutput.length; ++i) {
            Globals._StdOut.putText(`  ${Globals._Scheduler.unInterleavedOutput[i]}`);
            if (i !== Globals._Scheduler.unInterleavedOutput.length - 1)
                Globals._StdOut.advanceLine();
        }///for
    }/// showProcessesOutputs

    public static dumpScheduleMetaData(): void {
        Globals._StdOut.advanceLine();
        Globals._StdOut.putText("Schedule Terminated!");
        Globals._StdOut.advanceLine();
        Globals._StdOut.putText("...");
        Globals._StdOut.advanceLine();
        Globals._StdOut.putText("Schedule Metadata:");
        Globals._StdOut.advanceLine();
        Globals._StdOut.putText(`  Quantum used: ${Globals._Scheduler.quanta}, Total CPU Bursts: ${Globals._CPU_BURST}`);
        Globals._StdOut.advanceLine();
        Globals._StdOut.putText("...");
        Globals._StdOut.advanceLine();

        /// Show scheduling and processes data
        this.showCPUBurstUsage();
        this.showTurnaroundTimes();
        this.showWaitTimes();
        this.showProcessesOutputs();
        Globals._StdOut.advanceLine();
        Globals._OsShell.putPrompt();
    }/// dumpScheduleMetaData

    public static visualizeResidentList() {
        if (Globals._processes != undefined || Globals._processes != null) {
            let tmp: Array<PcbData> = [];

            // Get the current pcb
            tmp.push(
                new PcbData(
                    Globals._CPU.localPCB.processID.toString(),
                    this.formatToHexWithPadding(Globals._CPU.PC),
                    Globals._CPU.IR,
                    Globals._CPU.Acc,
                    Globals._CPU.Xreg,
                    Globals._CPU.Yreg,
                    Globals._CPU.Zflag.toString(),
                    Globals._CPU.localPCB.priority.toString(),
                    Globals._CPU.localPCB.processState,
                    Globals._CPU.localPCB.volumeIndex === -1 ? `Disk` : `Seg ${Globals._CPU.localPCB.volumeIndex + 1}`,
                ) // PcbData
            ); // tmp.push

            // Show the resident list
            for (var index: number = 0; index < Globals._Scheduler.readyQueue.getSize(); ++index) {
                for (var nestedIndex = 0; nestedIndex < Globals._Scheduler.readyQueue.queues[index].getSize(); ++nestedIndex) {
                    tmp.push(
                        new PcbData(
                            Globals._Scheduler.readyQueue.queues[index].q[nestedIndex].processID.toString(),
                            this.formatToHexWithPadding(Globals._Scheduler.readyQueue.queues[index].q[nestedIndex].programCounter),
                            Globals._Scheduler.readyQueue.queues[index].q[nestedIndex].instructionRegister,
                            Globals._Scheduler.readyQueue.queues[index].q[nestedIndex].accumulator,
                            Globals._Scheduler.readyQueue.queues[index].q[nestedIndex].xRegister,
                            Globals._Scheduler.readyQueue.queues[index].q[nestedIndex].yRegister,
                            Globals._Scheduler.readyQueue.queues[index].q[nestedIndex].zFlag.toString(),
                            Globals._Scheduler.readyQueue.queues[index].q[nestedIndex].priority.toString(),
                            Globals._Scheduler.readyQueue.queues[index].q[nestedIndex].processState,
                            Globals._Scheduler.readyQueue.queues[index].q[nestedIndex].volumeIndex === -1 ? `Disk` : `Seg ${Globals._Scheduler.readyQueue.queues[index].q[nestedIndex].volumeIndex + 1}`,
                        ) // PcbData
                    ); // tmp.push
                } // for
            } // for
            Globals._processes.next(tmp);
        } // if
    }/// visualizeResidentList

    /**
     * iProject4 Control Methods
     * 
     */

    public static updateVisualDisk(): void {
        Globals._Kernel.krnTrace('Updated visual disk!');

        /// Check to see if disk is formatted
        if (!Globals._krnDiskDriver!.formatted) {
            Globals._Kernel.krnTrace('Not formatted');
            return;
        }/// if

        /// Create each block in the 16KB Disk
        let tmp: Array<SessionStorageVal> = [];
        for (var trackNum: number = 0; trackNum < Globals.TRACK_LIMIT; ++trackNum) {
            for (var sectorNum: number = 0; sectorNum < Globals.SECTOR_LIMIT; ++sectorNum) {
                for (var blockNum: number = 0; blockNum < Globals.BLOCK_LIMIT; ++blockNum) {
                    tmp.push({
                        key: `(${trackNum}, ${sectorNum}, ${blockNum})`,
                        value: `${sessionStorage.getItem(`${Control.formatToHexWithPadding(trackNum)}${Control.formatToHexWithPadding(sectorNum)}${Control.formatToHexWithPadding(blockNum)}`)}`
                    }); // tmp.push
                }/// for
            }/// for
        }/// for

        Globals._sessionStorage$.next(tmp);
    }/// updateVisualDisk
}/// class