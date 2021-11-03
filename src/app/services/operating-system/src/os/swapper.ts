import { Globals } from "../global";
import { Control } from "../host/control";
import { ProcessControlBlock } from "./processControlBlock";

export class Swapper {

    constructor(
        private programRolledOutFromMemory: string = '', /// Hex String
        private programRolledInFromDisk: string = '', /// Hex String
    ) { }/// constructor

    public init() {
        this.programRolledOutFromMemory = '';
        this.programRolledInFromDisk = '';
    }/// init

    public rollIn(programFromDisk: ProcessControlBlock, segmentFromRolledOutProcess: number) {
        Control.hostLog(`Rolling in disk program ${programFromDisk.swapFileName} to memory segment: ${segmentFromRolledOutProcess}`);

        var hexPair = '';
        var logicalAddress = 0;

        /// Set location of the new process in memory segment
        programFromDisk.volumeIndex = segmentFromRolledOutProcess;

        /// Load program from disk into free memory segment
        ///
        /// First read the actual program data from the disk
        this.programRolledInFromDisk = Globals._krnDiskDriver.read(programFromDisk.swapFileName).toUpperCase();

        /// MAX_SIMPLE_VOLUME-CAPACITY * 2 since each pair is 1 Byte and we allow 256 Bytes
        for (var pos: number = 0; pos < Globals.MAX_SIMPLE_VOLUME_CAPACITY * 2; pos += 2) {

            /// Read two characters at a time...
            if (this.programRolledInFromDisk[pos] + this.programRolledInFromDisk[pos + 1]) {
                hexPair = this.programRolledInFromDisk[pos] + this.programRolledInFromDisk[pos + 1];
            }/// if

            else {
                hexPair = '00';
            }/// else

            // /// Write to memory from hex pair list
            // if (_MemoryAccessor.write(_MemoryManager.simpleVolumes[segmentFromRolledOutProcess], logicalAddress, hexPair)) {
            //     Control.hostLog(`Command ${hexPair}: SUCCESSFUL WRITE to logical memory location: ${logicalAddress}!`);
            // }/// if 
            // else {
            //     Control.hostLog(`Command ${hexPair}: FAILED to WRITE to logical memory location: ${logicalAddress}!`);
            // }/// else

            /// console.log(_MemoryAccessor.read(freeSimpleVolume, logicalAddress));

            Globals._MemoryAccessor.write(Globals._MemoryManager.simpleVolumes[segmentFromRolledOutProcess], logicalAddress, hexPair);
            logicalAddress++;
        }/// for

        /// Protect volumes from being written into by accident...
        ///
        /// Each individual address at the memory level will be locked to to prevent such overflow issues
        Globals._MemoryManager.simpleVolumes[segmentFromRolledOutProcess].writeLock();

        /// Program will only be rolled in if it was scheduled in the ready queue, thus the state
        /// should be "Running"
        if (programFromDisk.processState != 'Terminated') {
            programFromDisk.processState = "Running";
        }/// if

        /// Delete the swap file from the disk...
        Globals._krnDiskDriver.deleteFile(programFromDisk.swapFileName);
    }/// rollIn

    public rollOut(programFromMemory: ProcessControlBlock): number {
        Control.hostLog(`Rolling out program from memory segment: ${programFromMemory.volumeIndex}`);
        var prevVolume: number = -1;

        /// Read program from memory
        for (var logicalAddress: number = 0; logicalAddress < Globals.MAX_SIMPLE_VOLUME_CAPACITY; ++logicalAddress) {
            this.programRolledOutFromMemory += Globals._MemoryAccessor.read(Globals._MemoryManager.simpleVolumes[programFromMemory.volumeIndex], logicalAddress);
        }/// for

        /// Try to create a swap file
        if (!Globals._krnDiskDriver.create(`${Globals._krnDiskDriver.hiddenFilePrefix}${Globals._krnDiskDriver.swapFilePrefix}${programFromMemory.processID}`).startsWith('Cannot create')) {
            /// Try to write to the swap file
            if (!Globals._krnDiskDriver.write(`${Globals._krnDiskDriver.hiddenFilePrefix}${Globals._krnDiskDriver.swapFilePrefix}${programFromMemory.processID}`, this.programRolledOutFromMemory).startsWith('Cannot write')) {
                /// File successfully rolled out

                /// Unlock the memory segemnt for the rolled in program
                Globals._MemoryManager.simpleVolumes[programFromMemory.volumeIndex].writeUnlock();

                /// Grab location of process before changing it!
                prevVolume = programFromMemory.volumeIndex;

                /// Update the location of the PCB
                programFromMemory.volumeIndex = -1;
                programFromMemory.swapFileName = `${Globals._krnDiskDriver.hiddenFilePrefix}${Globals._krnDiskDriver.swapFilePrefix}${programFromMemory.processID}`;

                /// Clear memory
                /// Actually, memory should be overwritten during roll in, with the rest of the remaining "left over" bytes being filled in with 0's
                // for (var lAddress: number = 0; lAddress < MAX_SIMPLE_VOLUME_CAPACITY; ++lAddress) {
                //     _MemoryAccessor.write(_MemoryManager.simpleVolumes[prevVolume], lAddress, "00");
                // }/// for
            }/// if
        }/// if

        return prevVolume;
    }/// rollOut
}/// class