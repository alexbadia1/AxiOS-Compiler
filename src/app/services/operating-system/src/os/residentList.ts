/*
residentList.ts
Keeps track of all loaded Process Control Blocks
*/

import { ProcessControlBlock } from "./processControlBlock";

export class ResidentList {
    constructor(
        public residentList: ProcessControlBlock[] = [],
        public size: number = 0,
    ) { }/// constructor

    public init(): void {
        this.size = 0;
        this.residentList = [];
    } /// init
}/// ProcessControlBlockQueue