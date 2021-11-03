/* ------------
   Interrupt.ts
   ------------ */

import { Globals } from "../global";

export class Interrupt {
    constructor(
        public irq: number,
        public params: any[],
        public priority: number = 1,
    ) {
        switch (irq) {
            case Globals.TIMER_IRQ:
                this.priority = 1;
                break;
            case Globals.KEYBOARD_IRQ:
                this.priority = 1;
                break;
            case Globals.SYS_CALL_IRQ: /// Maybe should have a higher priority (lower number)?
                this.priority = 1;
                break;
            case Globals.PS_IRQ:
                this.priority = 1;
                break;
            case Globals.SINGLE_STEP_IRQ:
                this.priority = 1;
                break;
            case Globals.NEXT_STEP_IRQ:
                this.priority = 1;
                break;
            case Globals.CONTEXT_SWITCH_IRQ:
                this.priority = 1;
                break;
            case Globals.CHANGE_QUANTUM_IRQ:
                this.priority = 2;
                break;
            case Globals.RUN_PROCESS_IRQ:
                this.priority = 1;
                break;
            case Globals.RUN_ALL_PROCESSES_IRQ:
                this.priority = 1;
                break;
            case Globals.TERMINATE_PROCESS_IRQ:
                this.priority = 1;
                break;
            case Globals.KILL_PROCESS_IRQ:
                this.priority = 1;
                break;
            case Globals.KILL_ALL_PROCESSES_IRQ:
                this.priority = 1;
                break;
            case Globals.DISK_IRQ:
                this.priority = 1;
                break;
            case Globals.SET_SCHEDULE_ALGORITHM:
                this.priority = 2;
                break;
            default:
                this.priority = 1;
                break;
        } // switch
    } // constructor
} // class