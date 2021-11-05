/* ------------
     memoryAccessor.ts
     
    Hopefully read and write are the only thing we'll need...
    TBH, anythin' low-level OS, Compilers, anything CPU invloving "x86 [insert jargon]" 
    is a nightmare for me and that is exactly why I will be in your compilers class next semester
    as well...
     ------------ */

import { Globals } from "../global";
import { SimpleVolume } from "../os/memoryManager";


export class MemoryAccessor {

    constructor() { }

    public read(newVolume: SimpleVolume, newLogicalAddress: number = -1) {
        var myData: string = null!;

        /// Translate the logical address to the physical address in memory
        ///
        /// Should be: logical address + base of partition
        var physicalAddress: number = this.getPhysicalAddress(newLogicalAddress, newVolume);

        /// Using said "physical address", prevent overflow into other parts of memory
        ///
        /// You WILL get and OFF by ONE error with physicalAddress >= newVolume.physicalLimit
        if ((physicalAddress > newVolume.physicalLimit) || (newLogicalAddress > 255)) {
            Globals._StdOut.advanceLine();
            Globals._StdOut.putText("Memory Upper Bound Limit Reached, Cannot Read Out of Bounds Address!");
            Globals._Kernel.krnTrace("Memory Upper Bound Limit Reached, Cannot Read Out of Bounds Address!");

            /// Terminate Program (don't forget to update the PCB process state)
            if (Globals._CPU.localPCB!.processState !== "Terminated") {
                /// "Program" memory bounds violation, just kill the program for now...
                /// By changing the current process state to "Terminated", the following 
                /// _Scheduler.roundRobinCheck() in Kernel will clean up _CPU process.
                Globals._CPU.localPCB!.processState = "Terminated";
                Globals._Scheduler.currentProcess!.processState = "Terminated";
            }/// if

        }///else-if
        else if ((physicalAddress < newVolume.physicalBase) || (newLogicalAddress < 0)) {
            Globals._StdOut.advanceLine();
            Globals._StdOut.putText("Memory Lower Bound Limit Reached, Cannot Read Out of Bounds Address!");
            Globals._Kernel.krnTrace("Memory Lower Bound Limit Reached, Cannot Read Out of Bounds Address!");

            /// Terminate Program (don't forget to update the PCB process state)
            if (Globals._CPU.localPCB!.processState !== "Terminated") {
                /// "Program" memory bounds violation, just kill the program for now...
                /// By changing the current process state to "Terminated", the following 
                /// _Scheduler.roundRobinCheck() in Kernel will clean up _CPU process.
                Globals._CPU.localPCB!.processState = "Terminated";
                Globals._Scheduler.currentProcess!.processState = "Terminated";
            }/// if

        }///else-if
        else {
            myData = Globals._Memory.getAddress(physicalAddress).read();
        }///else

        return myData; /// null means an error, anything non-null means it worked (hopefully)
    }/// read


    public write(newVolume: any, newLogicalAddress: any, newData: any) {
        var success: number = 0;

        /// (Again) Translate the logical address to the physical address in memory
        ///
        /// Should be: logical address + base of partition
        var physicalAddress: number = this.getPhysicalAddress(newLogicalAddress, newVolume);

        /// Using said "physical address",prevent overflow into other parts of memory
        if ((physicalAddress >= newVolume.physialLimit) || (newLogicalAddress > 255)) {
            /// Let user know what happened
            Globals._Kernel.krnTrace("Memory Upper Bound Limit Reached, Cannot Write Out of Bounds Address!");
            Globals._StdOut.advanceLine();
            Globals._StdOut.putText("Memory Upper Bound Limit Reached, Cannot Write Out of Bounds Address!");
            Globals._OsShell.putPrompt();

            /// Terminate Program (don't forget to update the PCB process state)
            if (Globals._CPU.localPCB!.processState !== "Terminated") {
                /// "Program" memory bounds violation, just kill the program for now...
                /// By changing the current process state to "Terminated", the following 
                /// _Scheduler.roundRobinCheck() in Kernel will clean up _CPU process.
                Globals._CPU.localPCB!.processState = "Terminated";
                Globals._Scheduler.currentProcess!.processState = "Terminated";
            }/// if
        }///else-if
        else if ((physicalAddress < newVolume.physicalBase) || (newLogicalAddress < 0)) {
            /// Let user know what happened
            Globals._Kernel.krnTrace("Memory Lower Bound Limit Reached, Cannot Write Out of Bounds Address!");
            Globals._StdOut.advanceLine();
            Globals._StdOut.putText("Memory Lower Bound Limit Reached, Cannot Write Out of Bounds Address!");
            Globals._OsShell.putPrompt();

            /// Terminate Program (don't forget to update the PCB process state)
            if (Globals._CPU.localPCB!.processState !== "Terminated") {
                /// "Program" memory bounds violation, just kill the program for now...
                /// By changing the current process state to "Terminated", the following 
                /// _Scheduler.roundRobinCheck() in Kernel will clean up _CPU process.
                Globals._CPU.localPCB!.processState = "Terminated";
                Globals._Scheduler.currentProcess!.processState = "Terminated";
            }/// if
        }///else-if
        else {
            Globals._Memory.getAddress(physicalAddress).write(newData);
            success = 1;
        }///else
        return success; ///returns 1 if successful, 0 if not successful
    }/// write

    public getPhysicalAddress(someLogicalAddress: any, someVolume: any) {
        /// Kind of redundant abstraction, maybe for future proofing need be
        return someLogicalAddress + someVolume.physicalBase;
    }/// getPhysicalAddress

    public mainMemorySize() {
        return Globals._Memory.size();
    }/// mainMemorySize
}/// class