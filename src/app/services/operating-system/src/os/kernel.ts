/* ------------
     Kernel.ts
     Routines for the Operating System, NOT the host.
     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */

import { Globals } from "../global";
import { Control } from "../host/control";
import { Devices } from "../host/devices";
import { Disk } from "../host/disk";
import { Console } from "./console";
import { DeviceDriverDisk } from "./deviceDriverDisk";
import { DeviceDriverKeyboard } from "./deviceDriverKeyboard";
import { MemoryManager } from "./memoryManager";
import { PriorityQueue } from "./priorityQueue";
import { ProcessControlBlock } from "./processControlBlock";
import { Queue } from "./queue";
import { Shell } from "./shell";


export class Kernel {
    ///
    /// OS Startup and Shutdown Routines
    ///
    /// Page 8
    public krnBootstrap() {
        /// Use hostLog because we ALWAYS want this, even if _Trace is off.
        Control.hostLog("bootstrap", "host");

        /// Initialize our global queues.
        /// 
        /// A (currently) priority queue for interrupt requests (IRQs).
        Globals._KernelInterruptPriorityQueue = new PriorityQueue();

        /// Buffers... for kernel
        Globals._KernelBuffers = new Array();

        /// Where device input lands before being processed out somewhere.
        Globals._KernelInputQueue = new Queue();

        /// Initialize the console.
        /// The command line interface / console I/O device.
        Globals._Console = new Console();
        Globals._Console.init();

        /// Initialize standard input and output to the Globals._Console.
        Globals._StdIn = Globals._Console;
        Globals._StdOut = Globals._Console;

        /// Load the Keyboard Device Driver
        this.krnTrace("Loading the keyboard device driver.");

        /// "Construct" the "actual" KeyboardDevice Drives.
        Globals._krnKeyboardDriver = new DeviceDriverKeyboard();

        /// Call the driverEntry() initialization routine.
        Globals._krnKeyboardDriver.driverEntry();
        this.krnTrace(Globals._krnKeyboardDriver.status);

        /// Load the Disk Device Driver
        this.krnTrace("Loading the disk device driver");

        /// "Construct" the "actual" DiskDevice Drives.
        Globals._krnDiskDriver = new DeviceDriverDisk();

        /// Call the driverEntry() initialization routine.
        Globals._krnDiskDriver.driverEntry();
        this.krnTrace(Globals._krnDiskDriver.status);

        //
        // ... more?
        //
        Globals._Disk = new Disk();
        Globals._Disk.init();
        Globals._MemoryManager = new MemoryManager();

        /// Enable the OS Interrupts.  (Not the CPU clock interrupt, as that is done in the hardware sim.)
        this.krnTrace("Enabling the interrupts.");
        this.krnEnableInterrupts();

        /// Launch the shell.
        this.krnTrace("Creating and Launching the shell.");
        Globals._OsShell = new Shell();
        Globals._OsShell.init();


        Globals._StdOut.putText("New Volume does not contain a recognized file system. Please format disk before use!");
        Globals._StdOut.advanceLine();
        Globals._OsShell.putPrompt();

        /// Finally, initiate student testing protocol.
        // if (_GLaDOS) {
        //     _GLaDOS.afterStartup();
        // }/// if
    }/// krBootstrap

    public krnShutdown() {
        this.krnTrace("begin shutdown OS");
        // TODO: Check for running processes.  If there are some, alert and stop. Else...
        // ... Disable the Interrupts.
        this.krnTrace("Disabling the interrupts.");
        this.krnDisableInterrupts();
        //
        // Unload the Device Drivers?
        // More?
        //
        this.krnTrace("end shutdown OS");
    }/// krnShutdown


    public krnOnCPUClockPulse() {
        /* 
           This gets called from the host hardware simulation every time there is a hardware clock pulse.
           This is NOT the same as a TIMER, which causes an interrupt and is handled like other interrupts.
           This, on the other hand, is the clock pulse from the hardware / VM / host that tells the kernel
           that it has to look for interrupts and process them if it finds any.                          
        */

        /// Check for an interrupt, if there are any. Page 560
        if (Globals._KernelInterruptPriorityQueue!.getSize() > 0) {

            // Process the first interrupt on the interrupt queue.
            /// Implemented a priority queue of queues (not the most efficient I know)
            var interrupt = Globals._KernelInterruptPriorityQueue!.dequeueInterruptOrPcb();
            this.krnInterruptHandler(interrupt.irq, interrupt.params);
        }/// if

        /// Globals._CPU.isExecuting: controls if the cpu will try to read an instruction from memory
        ///
        /// Various things will change this including but not limited to:
        ///     - Interrupts
        ///     - CLI / Shell Commands
        ///     - Error handling
        ///     - Maybe processes themselves?
        ///     - etc.
        else if (Globals._CPU.isExecuting) {

            /// Perform One Single Step
            if (Globals._SingleStepMode) {
                if (Globals._NextStep) {
                    this.countCpuBurst();
                    Globals._CPU.cycle();
                    Globals._Scheduler.checkSchedule();
                    Control.updateVisualMemory();
                    Control.updateVisualCpu();
                    Control.visualizeResidentList();
                    Globals._NextStep = false;
                }/// if
            }/// if

            /// Run normally
            else {
                this.countCpuBurst();
                Globals._CPU.cycle();
                Globals._Scheduler.checkSchedule();
                Control.updateVisualMemory();
                Control.updateVisualCpu();
                Control.visualizeResidentList();
            }/// else

            /// TODO: Make the date and time update NOT dependent on the cpu actually cycling
            this.getCurrentDateTime();
        }/// else

        /// If there are no interrupts and there is nothing being executed then just be idle.
        else {
            this.getCurrentDateTime();
            this.krnTrace("Idle");
        }/// else
    } /// krnOnCPUClockPulse

    public countCpuBurst(): void {
        /// Increase cpu burst count
        ///
        /// Single Step is special as you can force count to keep increasing in single step...
        /// so reset Globals._CPU_BURST when in Single Step and the scheduler is empty
        ///
        /// Not the best solution I could think of, but the first,
        /// Call this a "temporary fix"
        if (Globals._Scheduler.currentProcess === null && Globals._Scheduler.readyQueue.getSize() === 0) {
            Globals._CPU_BURST = 0;
        }/// if
        else { Globals._CPU_BURST++; }

        /// Wait time is time spent in the ready queue soo...
        /// Loop through Ready Queue and increment each pcb's wait time by 1 cycle
        for (var i = 0; i < Globals._Scheduler.readyQueue.getSize(); ++i) {
            for (var h = 0; h < Globals._Scheduler.readyQueue.queues[i].getSize(); ++h) {
                Globals._Scheduler.readyQueue.queues[i].q[h].waitTime += 1;
            }/// for
        }/// for

        /// Turnaround Time is time running and in waiting queue...
        /// So track nummber of cpu cycles used per process and add cpu cycles used and wait time for turnaround time
        if (Globals._Scheduler.currentProcess != null) {
            Globals._Scheduler.currentProcess.timeSpentExecuting += 1;
        } // if
    }/// countCpuBurst

    /// Hopefully Updates the Date and Time
    public getCurrentDateTime(): string {
        var current = new Date();
        var day = String(current.getDate()).padStart(2, '0');
        var month = String(current.getMonth() + 1).padStart(2, '0');/// Well shit, months are 0 based
        var year = String(current.getFullYear()).padStart(2, '0');
        var hours = String(current.getHours()).padStart(2, '0');
        var minutes = String(current.getMinutes()).padStart(2, '0');
        var seconds = String(current.getSeconds()).padStart(2, '0');

        alert(`${month}${day}${year}${hours}${minutes}${seconds}: this feature is deprecated.`);

        // document.getElementById('divLog--date').innerText = `${month}/${day}/${year}`;
        // document.getElementById('divLog--time').innerText = `${hours}:${minutes}:${seconds}`;

        return `${month}${day}${year}${hours}${minutes}${seconds}`;
    }/// getCurrentDateTime

    //////////////////////////
    /// Interrupt Handling ///
    //////////////////////////
    public krnEnableInterrupts() {
        // Keyboard
        Devices.hostEnableKeyboardInterrupt();
        // Put more here.
    }/// krnEnableInterrupts

    public krnDisableInterrupts() {
        // Keyboard
        Devices.hostDisableKeyboardInterrupt();
        // Put more here.
    }/// krnDisableInterrupts

    public krnInterruptHandler(irq: any, params: any) {
        // This is the Interrupt Handler Routine.  See pages 8 and 560.
        // Trace our entrance here so we can compute Interrupt Latency by analyzing the log file later on. Page 766.
        this.krnTrace("Handling IRQ~" + irq);

        // Invoke the requested Interrupt Service Routine via Switch/Case rather than an Interrupt Vector.
        // TODO: Consider using an Interrupt Vector in the future.
        // Note: There is no need to "dismiss" or acknowledge the interrupts in our design here.
        //       Maybe the hardware simulation will grow to support/require that in the future.
        switch (irq) {
            /// Kernel built-in routine for timers (not the clock).
            case Globals.TIMER_IRQ:
                this.krnTimerISR();
                break;

            /// Hardware Interrupt
            case Globals.KEYBOARD_IRQ:
                // Kernel mode device driver
                Globals._krnKeyboardDriver!.isr(params);
                Globals._StdIn.handleInput();
                break;

            case Globals.DISK_IRQ:
                /// Kernel mode device driver
                this.diskISR(params);
                break;

            /// Read/Write Console Interrupts
            case Globals.SYS_CALL_IRQ:
                this.sysCallISR(params);
                break;
            case Globals.PS_IRQ:
                this.psISR();
                break;

            /// Single Step Interrupts
            case Globals.SINGLE_STEP_IRQ:
                this.singleStepISR();
                break;
            case Globals.NEXT_STEP_IRQ:
                this.nextStepISR();
                break;

            /// Scheduling Interrupts
            case Globals.CONTEXT_SWITCH_IRQ:
                this.contextSwitchISR();
                break;
            case Globals.CHANGE_QUANTUM_IRQ:
                this.changeQuantumISR(params);
                break;

            /// Create Process Interrupts
            case Globals.RUN_PROCESS_IRQ:
                this.runProcessISR(params);
                break;
            case Globals.RUN_ALL_PROCESSES_IRQ:
                this.runAllProcesesISR();
                break;
            case Globals.SET_SCHEDULE_ALGORITHM:
                this.setSchedule(params);
                break;
            ///////////////////////////////
            /// Exit Process Interrupts ///
            ///////////////////////////////

            /// When a process ends, it sends its own termination interrupt
            case Globals.TERMINATE_PROCESS_IRQ:
                this.terminateProcessISR();
                break;

            /// This is the user "killing" the process,
            /// NOT the process sending its own termination interrupt
            case Globals.KILL_PROCESS_IRQ:
                this.killProcessISR(params);
                break;
            case Globals.KILL_ALL_PROCESSES_IRQ:
                this.killAllProcessesISR();
                break;

            /// Invalid interrupt doofus, make sure you defined it in global.ts and added it to the switch case, 
            /// Otherwise the system should not be requesting unknown interrupts, dummy...
            default:
                this.krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
        }/// switch
    }/// krnInterruptHandler

    public krnTimerISR() {
        // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver). {
        // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
        // Or do it elsewhere in the Kernel. We don't really need this.
    }/// krnTimerISR

    public sysCallISR(params: any) {
        var myPcb: ProcessControlBlock = params[0];
        /// Print out the Y-reg if X-reg has 01
        if (parseInt(Globals._CPU.Xreg, 16) === 1) {
            Globals._StdOut.putText(` ${Globals._CPU.Yreg} `);
            myPcb.outputBuffer += ` ${Globals._CPU.Yreg} `;
        }/// if

        /// Print from memeory starting at address
        if (parseInt(Globals._CPU.Xreg, 16) === 2) {
            var ans: string = "";

            /// I'm assuming the program is using the logical address
            ///
            /// I'll find out the hard-way if I'm right or wrong...
            var logicalCurrAddress: number = parseInt(Globals._CPU.Yreg, 16);

            /// Use Y-reg to find out which memory location to start reading from
            ///
            /// Convert to decimal char chode as well
            var decimalCharCode: number = parseInt(Globals._MemoryAccessor.read(Globals._MemoryManager.simpleVolumes[Globals._CPU.localPCB!.volumeIndex], logicalCurrAddress)!, 16);

            /// Keep going until we hit a 00 which represents the end of the string
            while (decimalCharCode !== 0) {
                ans += String.fromCharCode(decimalCharCode);

                /// Read nex character
                logicalCurrAddress++;
                decimalCharCode = parseInt(Globals._MemoryAccessor.read(Globals._MemoryManager.simpleVolumes[Globals._CPU.localPCB!.volumeIndex], logicalCurrAddress)!, 16);
            }/// while
            Globals._StdOut.putText(ans);
            myPcb.outputBuffer += ans;
        }/// if
    }/// sysCallISR

    public psISR() {
        for (var pos = 0; pos < Globals._ResidentList.residentList.length; ++pos) {
            pos === 0 ?
                Globals._StdOut.putText(`  pid ${Globals._ResidentList.residentList[pos].processID}: ${Globals._ResidentList.residentList[pos].processState} - Priority ${Globals._ResidentList.residentList[pos].priority} `)
                : Globals._StdOut.putText(`pid ${Globals._ResidentList.residentList[pos].processID}: ${Globals._ResidentList.residentList[pos].processState} - Priority ${Globals._ResidentList.residentList[pos].priority}`);

            if (pos !== Globals._ResidentList.residentList.length - 1) {
                Globals._StdOut.putText(`, `);
            }/// if
        }/// for
        Globals._StdOut.advanceLine();
        Globals._OsShell.putPrompt();
    }/// psISR

    public singleStepISR() {
        if (Globals._SingleStepMode) {
            /// Stop the CPU from executing
            Globals._CPU.isExecuting = false;
        }/// if
        else {
            /// Go back to cpu executing
            if (Globals._ResidentList.size > 0 && Globals._Scheduler.currentProcess != null) {
                Globals._CPU.isExecuting = true;
            } // if
        }/// else
    }/// singleStepISR

    public nextStepISR() {
        /// If we're in single step mode
        if (Globals._SingleStepMode) {
            /// Run 1 cycle
            Globals._NextStep = true;

            if (Globals._ResidentList.size > 0 && Globals._Scheduler.currentProcess != null) {
                Globals._CPU.isExecuting = true;
            } // if
        }/// if
    }/// singleStepISR

    public contextSwitchISR() {
        this.krnTrace("Calling dispatcher for context switch");
        Globals._Dispatcher.contextSwitch();
    }/// contextSwitch

    public changeQuantumISR(params: any[]) {
        this.krnTrace(`Quantum ISR- Quatum was: ${oldDecimalQuanta}, Quantum now: ${Globals._Scheduler.quanta}`);
        var oldDecimalQuanta = params[0];
        var newQuanta = params[1];
        Globals._Scheduler.quanta = newQuanta;
        Globals._StdOut.putText(`Quatum was: ${oldDecimalQuanta}, Quantum now: ${Globals._Scheduler.quanta}`);
        Globals._StdOut.advanceLine();
        Globals._OsShell.putPrompt();
    }/// changeQuantumISR

    public runProcessISR(params: any): void {
        /// Arguments: params [curr, args[0]];
        ///     params[0]: is the current position in the resident list the process
        ///                the user specified to "run" was found.
        ///     params[1]: is the pid of the process the user specified to "run"
        ///
        /// TODO: Move if-else to _Schedule.scheduleProcess()
        ///
        /// Process is already running!
        if (Globals._ResidentList.residentList[params[0]].processState === "Running") {
            Globals._StdOut.putText(`Process with pid: ${parseInt(params[1])} is already running!`);
            Globals._StdOut.advanceLine();
            Globals._OsShell.putPrompt();
        }/// if

        /// Process is already "Terminated"!
        else if (Globals._ResidentList.residentList[params[0]].processState === "Terminated") {
            Globals._StdOut.putText(`Process with pid: ${parseInt(params[1])} already terminated!`);
            Globals._StdOut.advanceLine();
            Globals._OsShell.putPrompt();
        }/// else-if

        /// Process is already scheduled... "Ready"!
        else if (Globals._ResidentList.residentList[params[0]].processState === "Ready") {
            Globals._StdOut.putText(`Process with pid: ${parseInt(params[1])} is already scheduled!`);
            Globals._StdOut.advanceLine();
            Globals._OsShell.putPrompt();
        }/// else-if

        /// Schedule the new process
        else {
            /// Schedule the process using round robin
            Globals._Scheduler.scheduleProcess(Globals._ResidentList.residentList[params[0]]);

            /// Now we run it...
            Globals._Scheduler.runSchedule();
        }/// else
    }/// runProcessISR

    public runAllProcesesISR() {
        var processWasLoaded: boolean = false;
        /// Load the Ready Queue with ALL Loaded Processes so...
        /// Enqueue all NON-TERMINATED, Non-Running, Non-Waiting Processes from the Resident List
        for (var processID: number = 0; processID < Globals._ResidentList.residentList.length; ++processID) {
            /// Only get Non-Terminated Processes
            var temp: boolean = false;
            if (Globals._ResidentList.residentList[processID].processState === "Resident") {
                temp = Globals._Scheduler.scheduleProcess(Globals._ResidentList.residentList[processID]);
            }/// if 
            if (processWasLoaded === false && temp === true) {
                processWasLoaded = true;
            }/// if
        }/// for

        // if (Globals._Scheduler.currentProcess! !== null){
        //     processWasLoaded = true;
        // }/// if
        Globals._Scheduler.runSchedule(processWasLoaded);
    }/// runAllProcessISR

    public terminateProcessISR() {
        try {
            /// Set current process state to "Terminated" for clean up
            Globals._Scheduler.currentProcess!.processState === "Terminated";

            if (Globals._Scheduler.currentProcess!.processState === "Terminated" && Globals._Scheduler.readyQueue.getSize() === 0) {
                /// Remove the last process from the Ready Queue
                /// by removing the last process from current process
                Globals._Scheduler.currentProcess = null!;

                /// "Turn Off" CPU
                Globals._CPU.isExecuting = false;

                /// Turn "off Single Step"
                Globals._SingleStepMode = false;
                Globals._NextStep = false;

                /// Reset visuals for Single Step
                Globals._terminateProcess$.next(true);

                /// Prompt for more input
                Globals._StdOut.advanceLine();
                Globals._OsShell.putPrompt();
            }/// if
        }/// try

        catch (e) {
            Globals._Kernel.krnTrace(e as string);
        }/// catch
    }/// terminateProcessISR

    public killProcessISR(params: any) {
        /// Apparently Javascripts tolerance of NaN completly defeats the purpose of using this 
        /// try catch... nice!
        try {
            /// Check if the process exists with basic linear search
            var curr: number = 0;
            var found: boolean = false;
            while (curr < Globals._ResidentList.residentList.length && !found) {
                if (Globals._ResidentList.residentList[curr].processID == parseInt(params[0][0])) {
                    found = true;
                }/// if
                else {
                    curr++;
                }/// else
            }/// while

            if (!found) {
                Globals._StdOut.putText(`No process control blocks found with pid: ${parseInt(params[0][0])}.`);
                Globals._StdOut.advanceLine();
                Globals._OsShell.putPrompt();
            }/// if

            /// Process exists in the resident queue
            else {

                /// Use interrupt to allow for seemless killing of process
                /// For example:
                ///     > kill 0
                ///     ...
                ///     > kill 2
                ///     > kill 1
                /// No matter what order, should still kill process, finishing the schedule...
                /// Use Single Step to see what's "really" happening...
                switch (Globals._ResidentList.residentList[curr].processState) {
                    case "Terminated":
                        Globals._StdOut.putText("Process is already Terminated!");
                        Globals._StdOut.advanceLine();
                        break;
                    case "Ready":
                        Globals._StdOut.putText("Ready process removed from Ready Queue!");
                        Globals._StdOut.advanceLine();
                        Globals._ResidentList.residentList[curr].processState = "Terminated";
                        break;
                    case "Running":
                        Globals._StdOut.putText("Running process is now terminated!");
                        Globals._StdOut.advanceLine();
                        Globals._ResidentList.residentList[curr].processState = "Terminated";
                        break;
                    default:
                        Globals._StdOut.putText("Process was not scheduled to run yet!");
                        Globals._StdOut.advanceLine();
                        break;
                }/// switch
            }/// else
        }/// try
        catch (e) {
            Globals._StdOut.putText(`${e}`);
            Globals._StdOut.putText(`Usage: run <int> please supply a process id.`);
            Globals._OsShell.putPrompt();
        }/// catch
    }/// killProcessISR

    public killAllProcessesISR() {
        /// There are scheduled processes to kill
        if (Globals._Scheduler.readyQueue.getSize() > 0 || Globals._Scheduler.currentProcess! !== null) {

            /// Mark all process in the schedule queue as terminated
            Globals._Scheduler.currentProcess!.processState = "Terminated";

            for (var i = 0; i < Globals._Scheduler.readyQueue.getSize(); ++i) {
                for (var h = 0; h < Globals._Scheduler.readyQueue.queues[i].getSize(); ++h) {
                    Globals._Scheduler.readyQueue.getIndex(i).getIndex(h).processState = "Terminated";
                }/// for
            }/// for
            // Globals._Scheduler.terminatedAllProcess();
        }/// if

        /// There are no scheduled processes to kill
        else {
            Globals._StdOut.putText("No Proceses were scheduled to run yet!");
            Globals._StdOut.advanceLine();
            Globals._OsShell.putPrompt();
        }/// else
    }/// runAllProcessISR

    public diskISR(params: any) {
        /// params[0] == disk operation
        if (params[0] === 'format') {
            /// params [1] == -quick || -full
            if (!Globals._CPU.isExecuting) {
                if (!Globals._SingleStepMode) {
                    Globals._krnDiskDriver!.format(params[1]);
                }/// if 
                else {
                    Globals._StdOut.putText(`Disk cannot be formatted while in single step mode`);
                    Globals._StdOut.advanceLine();
                    Globals._StdOut.putText(`To be honest I ran out of time to fix this, so I just disabled it...`);
                    Globals._StdOut.advanceLine();
                    Globals._OsShell.putPrompt();
                }/// else
            }/// if
            else {
                Globals._StdOut.putText(`Disk cannot be formatted while processes are running!`);
                Globals._StdOut.advanceLine();
                Globals._StdOut.putText(`Well, hello there! Evil Professor...`);
                Globals._StdOut.advanceLine();
                Globals._OsShell.putPrompt();
            }
        }/// if

        /// Only allow disk functions on formatted disks
        else if (Globals._krnDiskDriver!.formatted) {
            Globals._krnDiskDriver!.isr(params);
        }/// if

        /// Not formatted, don't do anyting
        else {
            this.krnTrace("Disk is not yet formatted!");
            Globals._StdOut.putText(`You must format the drive disk before use!`);
            Globals._StdOut.advanceLine();
            Globals._OsShell.putPrompt();
        }/// else
    }/// diskISR

    public setSchedule(params: string[]) {
        var schedulingAgorithm: string = params[0];

        /// Scheduling algorithm is already set to the one being passed
        if (Globals._Scheduler.schedulingMethod === schedulingAgorithm) {
            Globals._StdOut.putText(`Scheduling is already ${schedulingAgorithm}`);
            Globals._StdOut.advanceLine();
            Globals._OsShell.putPrompt();
        }/// if

        else if (!Globals._CPU.isExecuting) {
            Globals._Scheduler.schedulingMethod = schedulingAgorithm;
            Globals._StdOut.putText(`Scheduling algorithm set to: ${schedulingAgorithm}`);
            Globals._StdOut.advanceLine();
            Globals._OsShell.putPrompt();
        }/// else-if

        /// Scheduling algorithm is different than the one being passed
        else {
            switch (schedulingAgorithm) {
                case Globals.ROUND_ROBIN:
                    var tempRoundRobin: ProcessControlBlock[] = [];

                    /// Set scheduling method to Round Robin
                    Globals._Scheduler.schedulingMethod = Globals.ROUND_ROBIN;
                    Globals._Scheduler.swapToUserQuantum();
                    Globals._Scheduler.startBurst = Globals._CPU_BURST;

                    /// Don't forget current process
                    if (Globals._Scheduler.currentProcess! !== null) {
                        Globals._Scheduler.currentProcess!.swapToDefaultPriority();
                        tempRoundRobin.push(Globals._Scheduler.currentProcess!);
                        Globals._Scheduler.currentProcess = null!;
                    }/// if

                    /// Dequeue every process and swap back to using the user defined priority
                    while (Globals._Scheduler.readyQueue.getSize() > 0) {
                        var pcb: ProcessControlBlock = Globals._Scheduler.readyQueue.dequeueInterruptOrPcb();
                        pcb.swapToDefaultPriority();
                        tempRoundRobin.push(pcb);
                    }/// while

                    /// Re-enqueue all process
                    for (var p: number = 0; p < tempRoundRobin.length; ++p) {
                        Globals._Scheduler.readyQueue.enqueueInterruptOrPcb(tempRoundRobin[p]);
                    }/// for

                    /// Re-attach first process back to cpu...
                    if (Globals._Scheduler.currentProcess === null) {
                        Globals._Scheduler.currentProcess = Globals._Scheduler.readyQueue.dequeueInterruptOrPcb();
                        Globals._Scheduler.currentProcess!.processState === "Running";
                        Globals._Dispatcher.setNewProcessToCPU(Globals._Scheduler.currentProcess!);
                    }/// if
                    Globals._StdOut.putText(`Scheduling algorithm set to: ${schedulingAgorithm}`);
                    Globals._StdOut.advanceLine();
                    Globals._OsShell.putPrompt();
                    break;

                case Globals.FIRST_COME_FIRST_SERVE:
                    var tempFcFs: number[] = [];

                    /// Set scheduling method to First Come First Serve
                    Globals._Scheduler.schedulingMethod = Globals.FIRST_COME_FIRST_SERVE;
                    Globals._Scheduler.swapToFcFsQuantum();
                    Globals._Scheduler.startBurst = Globals._CPU_BURST;

                    /// Don't forget current process
                    if (Globals._Scheduler.currentProcess! !== null) {
                        tempFcFs.push(Globals._Scheduler.currentProcess!.processID);
                        Globals._Scheduler.currentProcess = null!;
                    }/// if

                    /// Dequeue every process and swap back to using the user defined priority
                    while (Globals._Scheduler.readyQueue.getSize() > 0) {
                        tempFcFs.push(Globals._Scheduler.readyQueue.dequeueInterruptOrPcb().processID);
                    }/// while

                    /// Re-enqueue all process
                    for (var p: number = 0; p < Globals._ResidentList.residentList.length; ++p) {
                        /// Only re-enqueue scheduled processes
                        if (tempFcFs.includes(Globals._ResidentList.residentList[p].processID)) {
                            Globals._ResidentList.residentList[p].swapToDefaultPriority();
                            Globals._Scheduler.readyQueue.enqueueInterruptOrPcb(Globals._ResidentList.residentList[p]);
                        }/// if
                    }/// for

                    /// Re-attach first process back to cpu...
                    if (Globals._Scheduler.currentProcess === null) {
                        Globals._Scheduler.currentProcess = Globals._Scheduler.readyQueue.dequeueInterruptOrPcb();
                        Globals._Scheduler.currentProcess!.processState === "Running";
                        Globals._Dispatcher.setNewProcessToCPU(Globals._Scheduler.currentProcess!);
                    }/// if
                    Globals._StdOut.putText(`Scheduling algorithm set to: ${schedulingAgorithm}`);
                    Globals._StdOut.advanceLine();
                    Globals._OsShell.putPrompt();
                    break;
                case Globals.PRIORITY:
                    var tempPriority: ProcessControlBlock[] = [];

                    /// Set scheduling method to Priority
                    Globals._Scheduler.schedulingMethod = Globals.PRIORITY;

                    /// Don't forget current process
                    if (Globals._Scheduler.currentProcess! !== null) {
                        Globals._Scheduler.currentProcess!.swapToUserPriority();
                        tempPriority.push(Globals._Scheduler.currentProcess!);
                        Globals._Scheduler.currentProcess = null!;
                    }/// if

                    /// Dequeue every process and swap back to using the user defined priority
                    while (Globals._Scheduler.readyQueue.getSize() > 0) {
                        var pcb: ProcessControlBlock = Globals._Scheduler.readyQueue.dequeueInterruptOrPcb();
                        pcb.swapToUserPriority();
                        tempPriority.push(pcb);
                    }/// while

                    /// Re-enqueue all process
                    for (var p: number = 0; p < tempPriority.length; ++p) {
                        Globals._Scheduler.readyQueue.enqueueInterruptOrPcb(tempPriority[p]);
                    }/// for

                    /// Re-attach first process back to cpu...
                    if (Globals._Scheduler.currentProcess === null) {
                        Globals._Scheduler.currentProcess = Globals._Scheduler.readyQueue.dequeueInterruptOrPcb();
                        Globals._Scheduler.currentProcess!.processState === "Running";
                        Globals._Dispatcher.setNewProcessToCPU(Globals._Scheduler.currentProcess!);
                    }/// if
                    Globals._StdOut.putText(`Scheduling algorithm set to: ${schedulingAgorithm}`);
                    Globals._StdOut.advanceLine();
                    Globals._OsShell.putPrompt();
                    break;
                default:
                    Globals._StdOut.putText(`Scheduling algorithm: ${schedulingAgorithm} not recognized!`);
                    Globals._StdOut.advanceLine();
                    Globals._OsShell.putPrompt();
                    break;
            }/// switch
        }/// else
    }/// setSchedule

    //
    // System Calls... that generate software interrupts via tha Application Programming Interface library routines.
    //
    /// Ahh Now this makes sense...
    // Some ideas:
    // - ReadConsole
    // - WriteConsole
    // - CreateProcess
    // - ExitProcess
    // - WaitForProcessToExit
    // - CreateFile
    // - OpenFile
    // - ReadFile
    // - WriteFile
    // - CloseFile


    ///////////////////////////
    /// OS Utility Routines ///
    ///////////////////////////

    public krnTrace(msg: string) {
        // Check globals to see if trace is set ON.  If so, then (maybe) log the message.
        if (Globals._Trace) {
            if (msg === "Idle") {
                // We can't log every idle clock pulse because it would quickly lag the browser quickly.
                if (Globals._OSclock % 10 == 0) {
                    // Check the CPU_CLOCK_INTERVAL in globals.ts for an
                    // idea of the tick rate and adjust this line accordingly.
                    Control.hostLog(msg, "OS");
                }/// if
            }/// if 
            else {
                Control.hostLog(msg, "OS");
            }/// else
        }/// if
    }/// krnTrace

    public krnTrapError(msg: any) {
        Control.hostLog("OS ERROR - TRAP: " + msg);
        // TODO: Display error on console, perhaps in some sort of colored screen. (Maybe blue?)
        // document.getElementById('bsod').style.visibility = "visible"; /// Making layered image visible
        this.krnShutdown();
    }/// krnTrapError
}/// Kernel