/**
 * CPU SCHEDULER: Whenever the CPU becomes idle, the OS must select one of the processes 
 *                in the READY QUEUE to be executed.
 * READY QUEUE: All the processes are "lined-up" waiting for a chance to run on the CPU. 
 *      Various Implementations: 
 *          0.) First-in, Last-out (FIFO)
 *          1.) Priority Queue
 *          2.) Tree
 *          3.) Unordered Linked 
 *      Having a Ready Queue and Resident List should make calculating the AWT much easier 
 *      later... *Cough* *Cough* time spent in the ready queue *Cough* *Cough*
 */

import { Globals } from "../global";
import { Control } from "../host/control";
import { Interrupt } from "./interrupt";
import { PriorityQueue } from "./priorityQueue";
import { ProcessControlBlock } from "./processControlBlock";

export class Scheduler {

    constructor(
        public quanta: number = 6,
        public fcfsQuanta: number = Number.MAX_SAFE_INTEGER,
        private isFcFcQuantaInUse: boolean = false,
        public startBurst: number = 0,
        public processesMetaData: any[] = [],
        public unInterleavedOutput: string[] = [],
        public processTurnaroundTime: number[] = [],
        public readyQueue = new PriorityQueue(),
        public currentProcess: ProcessControlBlock = null!,
        public schedulingMethod = Globals.ROUND_ROBIN,
    ) {
        /// this.readyQueue = this.schedulingMethod === 'Round Robin'? new Queue() : new PriorityQueue();
    }/// constructor

    public init() {
        this.startBurst = 0;
        /// this.readyQueue = this.schedulingMethod === 'Round Robin'? new Queue() : new PriorityQueue();
        this.readyQueue = new PriorityQueue();
        this.currentProcess = null!;
        this.processesMetaData = [];
        this.unInterleavedOutput = [];
    }/// init

    public scheduleProcess(newPcb: ProcessControlBlock): boolean {
        var success: boolean = false;
        switch (this.schedulingMethod) {
            case Globals.ROUND_ROBIN:
                this.swapToUserQuantum();
                success = this.scheduleAsRoundRobin(newPcb);
                break;
            case Globals.FIRST_COME_FIRST_SERVE:
                /// FCFS is basically round robin with an infinite quantum...
                this.swapToFcFsQuantum();
                success = this.scheduleAsRoundRobin(newPcb);
                break;
            case Globals.PRIORITY:
                success = this.scheduleAsPriority(newPcb);
                break;
            default:
                break;
        }/// switch

        return success;
    }/// scheduleProcess

    public runSchedule(aNewProcessWasLoaded: boolean = true) {
        /// Kernel Mode
        Globals._Mode = 0;
        /// Make sure there are process loaded in the ready queue or
        /// in the current process slot
        if (this.readyQueue.getSize() === 0 && this.currentProcess === null) {
            /// Don't stop the cpu from executing, as it may already be executing other process
            Globals._StdOut.putText("No process found either loaded or not already terminated, running, scheduled.");
            Globals._StdOut.advanceLine();
            Globals._OsShell.putPrompt();
        }/// if
        else if (!aNewProcessWasLoaded) {
            Globals._StdOut.putText("No new process found to run!");
            Globals._StdOut.advanceLine();
            Globals._OsShell.putPrompt();
        }/// else 
        else {
            /// Set first process and update pcb
            if (this.currentProcess === null) {
                this.currentProcess = this.readyQueue.dequeueInterruptOrPcb();
                this.currentProcess.processState === "Running";
                Globals._Dispatcher.setNewProcessToCPU(this.currentProcess);
            }/// if
            Globals._CPU.isExecuting = true;
            /// Program is running so User Mode
            Globals._Mode = 1;
        }/// else
    }/// runSchedule

    public checkSchedule() {
        var success: boolean = false;
        switch (this.schedulingMethod) {
            case Globals.ROUND_ROBIN:
                this.roundRobinCheck();
                break;
            case Globals.FIRST_COME_FIRST_SERVE:
                this.roundRobinCheck();
                break;
            case Globals.PRIORITY:
                this.priorityCheck();
                break;
            default:
                Globals._Kernel.krnTrace(`Scheduling Method ${this.schedulingMethod} not recognized!`);
                break;
        }/// switch

        return success;
    }/// checkSchedule

    public scheduleAsPriority(newProcess: ProcessControlBlock): boolean {
        /// Give feedback if the process was successfuly scheduled or not
        var success = false;
        /// Kernel mode to schedule processes
        Globals._Mode = 0;

        /// Ensure a new process was passed 
        if (newProcess !== null) {
            /// Enqueue the process
            newProcess.processState = "Ready";
            newProcess.swapToUserPriority();
            this.readyQueue.enqueueInterruptOrPcb(newProcess);

            /// Process scheduled successfully
            Globals._Kernel.krnTrace(`Process ${newProcess.processID} added to ready queue`);
            success = true;
        }/// if

        return success;
    }/// public

    public priorityCheck() {
        /// Current Process Terminated...
        if (this.currentProcess.processState === "Terminated") {
            Globals._Kernel.krnTrace(`Current process ${this.currentProcess.processID} terminated.`);

            /// Context Switch
            this.attemptContextSwitch();
        }/// if
    }/// piorityCheck()

    public scheduleAsRoundRobin(newProcess: ProcessControlBlock): boolean {
        /// Give feedback if the process was successfuly scheduled or not
        var success = false;
        /// Kernel mode to schedule processes
        Globals._Mode = 0;

        /// Ensure a new process is passed
        if (newProcess !== null) {
            /// Enqueue the process
            newProcess.processState = "Ready";
            newProcess.swapToDefaultPriority();
            this.readyQueue.enqueueInterruptOrPcb(newProcess);

            /// Process scheduled successfully
            Globals._Kernel.krnTrace(`Process ${newProcess.processID} added to ready queue`);
            success = true;
        }/// if

        return success;
    }/// scheduleAsRoundRobin

    public roundRobinCheck(): void {
        /// Back to kernel mode for quantum and termination check
        Globals._Kernel.krnTrace(`Kernel Mode Activated...`);
        Globals._Kernel.krnTrace(`Round Robin Quantum Check!`);
        Globals._Mode = 0;

        /// Current Process has terminated either Right On or Before quanta limit:
        if (this.currentProcess.processState === "Terminated") {
            Globals._Kernel.krnTrace(`Current process ${this.currentProcess.processID} terminated.`);

            /// Context Switch
            this.attemptContextSwitch();
        }/// if

        /// Current process has not terminated but the quantum was reached:
        else if ((Globals._CPU_BURST - this.startBurst) >= this.quanta) {
            /// Context Switch but put process back in process queue
            if (this.readyQueue.getSize() > 0) {
                Globals._Kernel.krnTrace(`Process ${this.currentProcess.processID} quantum reached, issuing context switch...`);
                /// Queue interrupt for context switch
                Globals._KernelInterruptPriorityQueue.enqueueInterruptOrPcb(new Interrupt(Globals.CONTEXT_SWITCH_IRQ, []));

                /// Reset the starting burst for the next new process
                this.startBurst = Globals._CPU_BURST;

            }/// if
            else {
                Globals._Kernel.krnTrace(`Process ${this.currentProcess.processID} is the final process, renewing quantum...`);
                /// There is one process left "in" the scheduler so keep renewing
                /// its quantum to let the process run as it will termination.
                this.startBurst = Globals._CPU_BURST;
            }///else

            /// Back to running programs
            Globals._Kernel.krnTrace(`User Mode Activated!`);
            Globals._Mode = 0;
        }/// if
    }/// roundRobinCheck

    private attemptContextSwitch(): void {
        /// Context Switch but don't put current process back in process queue
        if (this.readyQueue.getSize() > 0) {
            Globals._Kernel.krnTrace(`Another process was found in Ready Queue, issuing context switch...`);

            /// Queue interrupt for context switch
            Globals._KernelInterruptPriorityQueue.enqueueInterruptOrPcb(new Interrupt(Globals.CONTEXT_SWITCH_IRQ, []));

            /// Grab the procress' output, time spent executing, time spent waiting, turnaround time
            Globals._Kernel.krnTrace(`Collecting process ${this.currentProcess.processID} metadata before context switch.`);
            var turnAroundTime = (this.currentProcess.timeSpentExecuting + this.currentProcess.waitTime);
            this.unInterleavedOutput.push(`Pid ${this.currentProcess.processID}: ${this.currentProcess.outputBuffer}`);
            this.processesMetaData.push([
                this.currentProcess.processID,
                this.currentProcess.timeSpentExecuting,
                this.currentProcess.waitTime,
                turnAroundTime,
            ]);

            /// Reset the starting burst for the next new process
            Globals._Kernel.krnTrace(`Updating relative starting burst...`);
            this.startBurst = Globals._CPU_BURST;

            /// Back to running programs
            Globals._Kernel.krnTrace(`User Mode Activated`);
            Globals._Mode = 1;
        }/// if

        /// Final process terminated!
        /// Stop the CPU, grab scedule metadata and show it to the user and reset the scheduler
        else {
            Globals._Kernel.krnTrace(`No more process found in Ready Queue, preparing to clear scheduler...`);
            /// Stay in Kernel Mode
            Globals._Mode = 0;

            /// Stop CPU execution since all processe are terminated
            Globals._CPU.isExecuting = false;

            /// Grab the final procresses' output, time spent executing, time spent waiting, turnaround time
            Globals._Kernel.krnTrace(`Collecting final process ${this.currentProcess.processID} metadata.`);
            var turnAroundTime = (this.currentProcess.timeSpentExecuting + this.currentProcess.waitTime);
            this.unInterleavedOutput.push(`Pid ${this.currentProcess.processID}: ${this.currentProcess.outputBuffer}`);
            this.processesMetaData.push([
                this.currentProcess.processID,
                this.currentProcess.timeSpentExecuting,
                this.currentProcess.waitTime,
                turnAroundTime,
            ]);

            /// Show user schedule metadata
            Globals._Kernel.krnTrace(`Dumping all processes metadata...`);
            Control.dumpScheduleMetaData();

            /// Clear scheduling metadata
            Globals._Kernel.krnTrace(`Clearing Scheduler...`);
            Globals._CPU_BURST = 0;
            this.init();
        }/// else
    }/// requestContextSwitch

    public swapToFcFsQuantum() {
        if (!this.isFcFcQuantaInUse) {
            var temp: number = this.quanta;
            this.quanta = this.fcfsQuanta;
            this.fcfsQuanta = temp;
            this.isFcFcQuantaInUse = true;
        }/// if
    }///swapToFcFsQuantum

    public swapToUserQuantum() {
        if (this.isFcFcQuantaInUse) {
            var temp: number = this.fcfsQuanta;
            this.fcfsQuanta = this.quanta;
            this.quanta = temp;
            this.isFcFcQuantaInUse = false;
        }/// if
    }///swapToUserQuantum
}/// class