/* ------------
     Devices.ts
     Routines for the hardware simulation, NOT for our client OS itself.
     These are static because we are never going to instantiate them, because they represent the hardware.
     In this manner, it's A LITTLE BIT like a hypervisor, in that the Document environment inside a browser
     is the "bare metal" (so to speak) for which we write code that hosts our client OS.
     But that analogy only goes so far, and the lines are blurred, because we are using TypeScript/JavaScript
     in both the host and client environments.
     This (and simulation scripts) is the only place that we should see "web" code, like
     DOM manipulation and TypeScript/JavaScript event handling, and so on.  (Index.html is the only place for markup.)
     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */

import { Globals } from "../global";
import { Interrupt } from "../os/interrupt";

export class Devices {

    constructor() {
        Globals._hardwareClockID = -1;
    } // constructor

    //
    // Hardware/Host Clock Pulse
    //
    public static hostClockPulse(): void {
        // Increment the hardware (host) clock.
        Globals._OSclock++;
        // Call the kernel clock pulse event handler.
        Globals._Kernel.krnOnCPUClockPulse();
    } // hostClockPulse

    //
    // Keyboard Interrupt, a HARDWARE Interrupt Request. (See pages 560-561 in our text book.)
    //
    public static hostEnableKeyboardInterrupt(): void {
        // Listen for key press (keydown, actually) events in the Document
        // and call the simulation processor, which will in turn call the
        // OS interrupt handler.
        document.addEventListener("keydown", Devices.hostOnKeypress, false);
    } // hostEnableKeyboardInterrupt

    public static hostDisableKeyboardInterrupt(): void {
        document.removeEventListener("keydown", Devices.hostOnKeypress, false);
    } // hostDisableKeyboardInterrupt

    public static hostOnKeypress(event: any): void {
        // The canvas element CAN receive focus if you give it a tab index, which we have.
        // Check that we are processing keystrokes only from the canvas's id (as set in index.html).
        if (event.target.id === "display") {
            event.preventDefault();
            // Note the pressed key code in the params (Mozilla-specific).
            ///
            /// TODO: Check to see if this will work: event.getModifierState("CapsLock")
            var params = new Array(event.which, event.shiftKey, event.ctrlKey, event.altKey);
            // Enqueue this interrupt on the kernel interrupt queue so that it gets to the Interrupt handler.
            Globals._KernelInterruptPriorityQueue!.enqueueInterruptOrPcb(new Interrupt(Globals.KEYBOARD_IRQ, params));
        } // if
    } // hostOnKeypress
} // Devices