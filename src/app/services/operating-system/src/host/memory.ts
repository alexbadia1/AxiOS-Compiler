/* ------------
     Memory.ts
     
     Hopefully, this code models memory at a close hardware level.
     I'm taking a minimalistic approach:
     - The address block is the physical primary memory.
     - Added an abstraction for each physical register in memory
     - Gave memory size as well
    
     Everything else will be done in  MemoryAccess.ts including but not limited to:
     - read
     - write
     - memory metadata
     ------------ */
import { Address } from "./addressBlock";

export class Memory {

    constructor(
        public memorySize = 768,
        public addressBlock: Address[] = []) { } // constructor

    public init(): void {
        /// Initialize 256 bytes of empty data in memory;
        for (var i: number = 0; i < this.memorySize; i++) {
            this.addressBlock.push(new Address(i));
        } // for
    } // init

    // Returns the address in memory requested by the memoryAccessor
    //
    // This is because we need to know if the memory is read enabled,
    // write enabled, and run enabled, as there is a physical lock in memory
    // if I remember correctly from Gormanly's class
    public getAddress(newAddress: number) {
        return this.addressBlock[newAddress];
    } // read

    public size() { return this.memorySize; } // size
} // Memory