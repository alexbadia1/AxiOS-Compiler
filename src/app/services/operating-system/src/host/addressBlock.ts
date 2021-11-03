/*
    * I might be making this up but I thought there were physical lights and "lock gates"
    * in memory that would represent read, write, etc access...
    * Am I delusional for doing this?
*/
export class Address {
    constructor(
        public physicalAddress: any,
        public data: string = '00',
        public wLock: boolean = true,
        public xLock: boolean = false,
    ) { }
    public writeLock() { this.wLock = false; }
    public writeUnlock() { this.wLock = true; }
    public executeLock() { this.xLock = false; }
    public executeUnlock() { this.xLock = true; }
    public getWriteLock() { return this.wLock; }
    public getExecuteLock() { return this.xLock; }
    public read() { return this.data }

    public write(newData: string) {
        if (this.getWriteLock()) {
            this.data = newData;
        } // if 
        else {
            _Kernel.krnTrapError(`Place: ${this.physicalAddress} is WRITE Protected`);
        } // else
    } //  write
} // Address