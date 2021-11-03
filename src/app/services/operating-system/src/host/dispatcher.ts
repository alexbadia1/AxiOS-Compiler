import { Globals } from "../global";
import { ProcessControlBlock } from "../os/processControlBlock";
import { Queue } from "../os/queue";

export class Dispatcher {

    constructor() { }/// constructor

    public contextSwitch() {
        Globals._Kernel.krnTrace("Switching context...");

        /// if (current process isn't terminated)
        ///     put the process back at the end of the ready queue
        ///
        /// else (current process is terminated)
        ///     let the terminated current process get overwritten by the next process
        ///     dequeud from the ready queue, WITHOUT re-queueing the terminated current process
        ///     effectivley "removing" the terminated current process
        if (Globals._Scheduler.currentProcess.processState !== "Terminated") {
            /// Save current process cpu context
            this.saveOldContextFromCPU(Globals._Scheduler.currentProcess);

            Globals._Kernel.krnTrace(`Releasing process ${Globals._Scheduler.currentProcess.processID} to cpu.`);

            /// Enqueue the current process to end of Ready Queue
            Globals._Scheduler.currentProcess.processState = "Ready";
            Globals._Scheduler.readyQueue.enqueueInterruptOrPcb(Globals._Scheduler.currentProcess);
        }/// if

        /// if (there are more processes)
        ///     dequeue a process from the ready queue and set it as the new "current process"
        ///
        /// else (no more process)
        ///     don't try to deqeueue and process from the ready queue, instead let the current
        ///     process keep running until termination.
        if (Globals._Scheduler.readyQueue.getSize() > 0) {
            /// Dequeue process from front of ready queue
            Globals._Scheduler.currentProcess = Globals._Scheduler.readyQueue.dequeueInterruptOrPcb();

            /// Load CPU context with new process context
            if (Globals._Scheduler.currentProcess.processState !== "Terminated") {
                Globals._Scheduler.currentProcess.processState = "Running";
            }/// if
            this.setNewProcessToCPU(Globals._Scheduler.currentProcess);
        }/// if
    }/// contextSwitch

    public setNewProcessToCPU(newPcb: any) {
        var segment: number = -1;

        /// Make sure the process is in memory
        /// I wonder how many people actually write out (pseudocode for) their ideas before programming away...
        /// if (current process is on disk)
        ///     if (ready queue length > 1)
        ///         roll out the process at the end of the ready queue (ready queue length - 1)
        ///     else if (this is the last process)
        ///         roll out any terminated process in memory... maybe automatically roll out processes they terminate?
        ///     Roll in process to memory segment that was rolled out
        if (newPcb.volumeIndex === -1) {
            var numProcessesInMemory: number = 0;
            var pos: number = 0;

            /// See how many process are in memory
            while (pos < Globals._ResidentList.residentList.length && numProcessesInMemory < 3) {
                if (Globals._ResidentList.residentList[pos].volumeIndex >= 0 && Globals._ResidentList.residentList[pos].volumeIndex <= 2) {
                    numProcessesInMemory++;
                }/// if
                pos++;
            }/// for

            switch (numProcessesInMemory) {
                case 0:
                    /// No processes in memory, roll into first segment
                    Globals._Swapper.rollIn(newPcb, 0);
                    Globals._Swapper.init();
                    break;
                case 1:
                    /// One process in memory, roll into second segment
                    Globals._Swapper.rollIn(newPcb, 1);
                    Globals._Swapper.init();
                    break;
                case 2:
                    /// Second process in memory, roll into third segment
                    Globals._Swapper.rollIn(newPcb, 2);
                    Globals._Swapper.init();
                    break;
                default:
                    /// Memory is full, pick a victim
                    ///
                    /// Processes to be rolled out
                    if (Globals._Scheduler.readyQueue.getSize() > 1) {
                        /// Of the three processes on the disk, choose the one that is closest to the end of the ready queue
                        // _StdOut.putText(`${this.victim()}`);
                        segment = Globals._Swapper.rollOut(this.victim());
                        /// _StdOut.putText(`Roll Out Segment number: ${segment}`);
                    }/// if
                    else {
                        var pos: number = 0;
                        var found: boolean = false;
                        while (pos < Globals._ResidentList.residentList.length && !found) {
                            if (Globals._ResidentList.residentList[pos].volumeIndex !== -1 && Globals._ResidentList.residentList[pos].processState === "Terminated") {
                                found = true;
                                segment = Globals._Swapper.rollOut(Globals._ResidentList.residentList[pos]);
                                ///_StdOut.putText(`Roll Out Segment number: ${segment}`);
                            }/// if
                            else {
                                pos++;
                            }/// else
                        }/// while

                        /// If no terminated processes, roll out the first segment
                        if (!found) {
                            var i: number = 0;
                            var firstProcessFound: boolean = false;
                            while (i < Globals._ResidentList.residentList.length && !firstProcessFound) {
                                if (Globals._ResidentList.residentList[i].volumeIndex === 1) {
                                    firstProcessFound = true;
                                    segment = Globals._Swapper.rollOut(Globals._ResidentList.residentList[i]);
                                    ///_StdOut.putText(`Roll Out Segment number: ${segment}`);
                                }/// if
                                else {
                                    i++;
                                }/// else
                            }/// while
                        }/// if
                    }/// else
                    Globals._Swapper.rollIn(newPcb, segment);
                    Globals._Swapper.init();
                    break;
            }/// switch
        }/// if

        Globals._Kernel.krnTrace(`Attaching process ${newPcb.processID} to cpu.`);
        Globals._CPU.PC = newPcb.programCounter;
        Globals._CPU.IR = newPcb.instructionRegister;
        Globals._CPU.Acc = newPcb.accumulator;
        Globals._CPU.Xreg = newPcb.xRegister;
        Globals._CPU.Yreg = newPcb.yRegister;
        Globals._CPU.Zflag = newPcb.zFlag;
        Globals._CPU.localPCB = Globals._Scheduler.currentProcess;
    }/// setNewProcessToCPU

    public saveOldContextFromCPU(pcb: any) {
        Globals._Kernel.krnTrace(`Saving process ${pcb.processID} context from cpu.`);
        pcb.programCounter = Globals._CPU.PC;
        pcb.instructionRegister = Globals._CPU.IR;
        pcb.accumulator = Globals._CPU.Acc;
        pcb.xRegister = Globals._CPU.Xreg;
        pcb.yRegister = Globals._CPU.Yreg;
        pcb.zFlag = Globals._CPU.Zflag;
    }/// saveContextFromCPU

    public victim(): ProcessControlBlock {
        var max: number = -1;
        var lastQueue: Queue | null = null;
        // _StdOut.putText(`Ready queue size: ${_Scheduler.readyQueue.queues.length}`)
        for (var i = 1 + Math.floor(Globals._Scheduler.readyQueue.queues.length / 2); i < Globals._Scheduler.readyQueue.queues.length; ++i) {
            if (Globals._Scheduler.readyQueue.getIndex(i).priority > max) {
                max = Globals._Scheduler.readyQueue.getIndex(i).priority;
                lastQueue = Globals._Scheduler.readyQueue.getIndex(i);
            }/// if
        }/// for

        return lastQueue!.getIndex(lastQueue!.getSize() - 1);
    }/// victim
}/// class