/*
processControlBlock.ts
Might include:
    - Process ID
    - Process State
    - Program Counter
    - CPU registers
    - CPU scheduling
    - Memory-management information
    - Input/output information
    - List of open files
*/
export class ProcessControlBlock {
    constructor(
        public processID: number = 0,
        public programCounter: number = 0,
        public instructionRegister: string = "00",
        public accumulator: string = "00",
        public xRegister: string = "00",
        public yRegister: string = "00",
        public zFlag: number = 0,
        public priority: number = 1,
        private defaultPriority = 1,
        public isDefaultPriorityInUse = false,
        public processState: string = 'New',
        public volumeIndex: number = -1,
        public outputBuffer: string = "",
        public timeSpentExecuting: number = 0,
        public waitTime: number = 0,
        public swapFileName: string = null!,
    ) { }

    public init(): void { } /// init

    public swapToDefaultPriority() {
        if (!this.isDefaultPriorityInUse) {
            var temp: number = this.priority;
            this.priority = this.defaultPriority;
            this.defaultPriority = temp;
            this.isDefaultPriorityInUse = true;
        } // if
    } // getRoundRobinPriority

    public swapToUserPriority() {
        if (this.isDefaultPriorityInUse) {
            var temp: number = this.defaultPriority;
            this.defaultPriority = this.priority;
            this.priority = temp;
            this.isDefaultPriorityInUse = false;
        }/// if
    }/// getRoundRobinPriority
}/// ProcessControlBlock