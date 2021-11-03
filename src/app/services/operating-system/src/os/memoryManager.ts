import { Globals } from "../global";

export class MemoryManager {

    constructor(
        public simpleVolumes: SimpleVolume[] = [],
    ) {
        this.init();
    }///contsructor

    public init(): void {
        /// Generate Memory Volumes
        ///
        /// While there is room in memory for more volumes, keep making volumes
        ///
        /// Calculate how many partitions you can make from memory
        var memorySize: number = Globals._MemoryAccessor.mainMemorySize();
        while (memorySize > 0) {
            var temp = memorySize;

            /// Well now we effectively lost the volume's capacity worth of memory
            memorySize -= Globals.MAX_SIMPLE_VOLUME_CAPACITY;

            /// Create new volume
            /// setting the physical base and physical limit as well
            var newVolume = new SimpleVolume(memorySize, temp - 1, Globals.MAX_SIMPLE_VOLUME_CAPACITY);

            /// Make sure the volume is writeable too
            newVolume.writeUnlock();
            this.simpleVolumes.push(new SimpleVolume(memorySize, temp - 1, Globals.MAX_SIMPLE_VOLUME_CAPACITY));
        }///while
    } /// init

    public worstFit() {
        /// Loop through the entire list and find the biggest volume...
        ///
        /// O(n) time complexity?
        var maxVol: number = this.simpleVolumes[0].capacity;
        var maxVolIndex: number = -1;

        /// Simple find max (Schwartz taught me this one)
        for (var pos = 0; pos < this.simpleVolumes.length; ++pos) {
            if (this.simpleVolumes[pos].getWriteEnabled()) {
                if (this.simpleVolumes[pos].capacity > maxVol) {
                    maxVol = this.simpleVolumes[pos].capacity;
                    maxVolIndex = pos;
                }/// if
            }/// if
        }///for
        return maxVolIndex;
    }/// worstFit

    public bestFit() {
        /// Loop through the entire list and find the smallest volume...
        ///
        /// Also O(n) time complexity?
        var minVol: number = this.simpleVolumes[0].capacity;
        var minVolIndex: number = -1;

        /// Simple find min (Schwartz taught me this one too)
        for (var pos = 0; pos < this.simpleVolumes.length; ++pos) {
            if (this.simpleVolumes[pos].getWriteEnabled()) {
                if (this.simpleVolumes[pos].capacity < minVol) {
                    minVol = this.simpleVolumes[pos].capacity;
                    minVolIndex = pos;
                }/// if
            }/// if
        }///for

        return minVolIndex;
    }/// bestFit

    public firstFit() {
        /// Loop through the entire list and find the first Write Enabled file...
        ///
        /// Also O(n) time complexity?
        var pos: number = this.simpleVolumes.length - 1;
        var found: boolean = false;
        while (pos >= 0 && !found) {
            if (this.simpleVolumes[pos].getWriteEnabled()) {
                found = true;
            }/// if
            else {
                pos--;
            }/// else
        }/// while

        return pos; ///First write enabled volume's position in the list
    }/// firstFit
}/// class

/// Brought to you by Microsoft
export class SimpleVolume {
    constructor(
        /// Put the required stuff first, sometimes this matters in other languages, I suck at typescript
        public physicalBase: number,
        public physicalLimit: number,
        public capacity: number,
        public readEnabled = true,
        private writeEnabled = true,
        public ExecuteEnabled = false,
        public layout: string = "Simple", /// Serves allusionary purpose to MS only
        public type: string = 'Basic', /// Serves allusionary purpose to MS only
    ) { }

    public getWriteEnabled() {
        return this.writeEnabled;
    }/// getWriteEnabled

    public writeLock() {
        this.writeEnabled = false;

        /// write lock each individual address
        for (var logicalAddress: number = 0; logicalAddress < Globals.MAX_SIMPLE_VOLUME_CAPACITY; ++logicalAddress) {
            Globals._Memory.getAddress(logicalAddress + this.physicalBase).writeLock();
        }/// for
    }/// writeLock

    public writeUnlock() {
        this.writeEnabled = true;
        /// write unlock each individual address
        for (var logicalAddress: number = 0; logicalAddress < Globals.MAX_SIMPLE_VOLUME_CAPACITY; ++logicalAddress) {
            Globals._Memory.getAddress(logicalAddress + this.physicalBase).writeUnlock();
        }/// for
    }/// writeUnlock
}/// class