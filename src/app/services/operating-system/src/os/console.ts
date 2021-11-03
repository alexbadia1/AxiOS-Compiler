/* ------------
     Console.ts
     The OS Console - stdIn and stdOut by default.
     Note: This is not the Shell. The Shell is the "command line interface" (CLI) or interpreter for this console.
     ------------ */

import { Globals } from "../global";
import { Control } from "../host/control";
import { Interrupt } from "./interrupt";

export class Console {

    constructor(
        public lineWrapPadding: Array<number> = new Array(),
        public olderCommands = new Array(),
        public newerCommands = new Array(),
        public olderImages = new Array(),
        public newerImages = new Array(),
        public currentFont = Globals._DefaultFontFamily,
        public currentFontSize = Globals._DefaultFontSize,
        public currentXPosition = 0,
        public currentYPosition = Globals._DefaultFontSize,
        public buffer = "") {
    }/// constructor

    public init(): void {
        this.clearScreen();
        this.resetXY();
    }/// init

    public clearScreen(): void {
        Globals._DrawingContext.clearRect(0, 0, Globals._Canvas.width, Globals._Canvas.height);
    }/// clearScreen

    public resetXY(): void {
        this.currentXPosition = 0;
        this.currentYPosition = this.currentFontSize;
    }/// resetXY

    public putX(position: number = 0): void {
        this.currentXPosition = position;
    }/// This is getting to tiring

    public handleInput(): void {
        while (Globals._KernelInputQueue.getSize() > 0) {
            // Get the next character from the kernel input queue.
            var chr = Globals._KernelInputQueue.dequeue();
            // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).
            ///
            /// Pause the cpu
            if (chr === 'alt-H') {
                Control.hostLog("Emergency halt", "host");
                Control.hostLog("Attempting Kernel shutdown.", "host");
                // Call the OS shutdown routine.
                Globals._Kernel.krnShutdown();
                // Stop the interval that's simulating our clock pulse.
                clearInterval(Globals._hardwareClockID);
            }/// if

            else if (chr === '^C') {
                if (Globals._CPU.isExecuting) {
                    /// Queue an interrupt for termination of the program
                    Globals._KernelInterruptPriorityQueue.enqueueInterruptOrPcb(new Interrupt(Globals.KILL_ALL_PROCESSES_IRQ, []));
                    this.eraseText();
                    this.putText("^c");
                }/// if
                else {
                    /// Just do what MS does
                    this.eraseText();
                    this.putText("^c");
                    this.advanceLine();
                    Globals._OsShell.putPrompt();
                }/// else
            }/// else-if

            else if (chr === String.fromCharCode(13)) { // the Enter key
                // The enter key marks the end of a console command, so ...
                // ... tell the shell ...
                Globals._OsShell.handleInput(this.buffer);

                //Store whatever the user typed in a stack of "commands"
                this.olderCommands.push(this.buffer);

                // ... and reset our buffer.
                this.buffer = "";
            }/// else- if

            /// Handle Tab
            else if (chr === String.fromCharCode(9)) {
                /// Use something advanced like a trie...?
                /// I'm just gonna loop through a list...
                ///
                /// Rather not include "bsod", yah know... the command that crashes the OS.
                var cmds: string[] = [
                    'ver',
                    'help',
                    'shutdown',
                    'cls',
                    'man',
                    'trace',
                    'rot13',
                    'prompt',
                    'date',
                    'whereami',
                    'eightball',
                    'status',
                    'load',
                    'run',
                    'clearmem',
                    'runall',
                    'ps',
                    'kill',
                    'killall',
                    'quantum',
                    'format'
                ];

                var matches: string[] = [];
                for (var pos: number = 0; pos < cmds.length; ++pos) {
                    if (cmds[pos].startsWith(this.buffer)) {
                        matches.push(cmds[pos]);
                    }/// if
                }/// for

                /// If there's only one matching command, replace current buffer
                /// and text with the new command
                if (matches.length === 1) {
                    this.eraseText();
                    this.putText(matches[0]);
                    this.buffer = matches[0];
                }/// if

                /// If there's multiple matching commands print out said matching commands
                else {
                    this.eraseText();
                    this.advanceLine();
                    this.putText("The most similar command is:");
                    this.advanceLine();
                    for (var num: number = 0; num < matches.length; ++num) {
                        this.putText(`  ${matches[num]}`);
                        this.advanceLine();
                    }/// for
                    Globals._OsShell.putPrompt();
                }/// else
            }/// else-if

            /// Basically have one stack hold the old commands, LIFO is important to keep the order of commands correct
            else if (chr === String.fromCharCode(38)) {
                /// Arrow UP so start getting the the older commands
                if (this.olderCommands.length > 0) {
                    if (this.newerCommands.length > 10) {
                        this.newerCommands.unshift();
                    }/// if
                    /// Step 1: Push whatever is typed so far (the current buffer) to the "newer" commands stack.
                    this.newerCommands.push(this.buffer);

                    /// Step 2: Pop whateverver command is in the "older" command stack.
                    var olderCommand = this.olderCommands.pop();

                    /// Step 3: Update the buffer and Canvas with the old command
                    ///
                    /// Must do this before we lose what was in the buffer
                    this.eraseText();

                    /// Don't forget to OVER WRITE what you need
                    this.putText("" + olderCommand);

                    this.buffer = olderCommand;
                }//if
            }/// else-if

            /// Have this stack hold the newer commands, keep the order of commands correct
            else if (chr === String.fromCharCode(40)) {
                /// Arrow DOWN so start getting the more recent commands
                if (this.newerCommands.length > 0) {
                    if (this.olderCommands.length > 10) {
                        this.olderCommands.unshift();
                    }/// if
                    /// Step 1: Push whatever is typed so far (the current buffer) to the "older" commands stack.
                    this.olderCommands.push(this.buffer);

                    /// Step 2: Pop whateverver command is in the "newer" command stack.
                    var newerCommand = this.newerCommands.pop();

                    /// Step 3: Update the buffer and Canvas with the old command
                    ///
                    /// Must do this before we lose what was in the buffer
                    this.eraseText();

                    /// TODO: Don't forget to OVER WRITE what you need
                    this.putText("" + newerCommand);

                    this.buffer = newerCommand;
                }//if
            }///else-if

            /// Erase Character
            else if (chr === String.fromCharCode(8)) {
                this.eraseChar();
            }///else-if
            else {
                // This is a "normal" character, so ...
                // ... draw it on the screen...
                if (chr === String.fromCharCode(32)) {
                    this.putText(" ");
                }/// if
                else {
                    this.putText(chr.trim());
                }/// else
                // ... and add it to our buffer.
                this.buffer += chr;
            }/// else
        }/// while
    }/// handleInput

    public eraseChar(): void {
        if (this.buffer.length > 0) {
            /// Check for line wrap,
            /// Chose 4 as the threshold to give room for rounding errors when deleting letters.
            ///
            /// Why 4? 
            /// Because it's my lucky number! (And the smallest letter is 8 pixels long)
            ///
            /// This prevents me from deleting the last letter on the line but the X position is still not
            /// of the canvas yet.
            ///
            /// Length of a space is...
            if (this.currentXPosition <= 4 + Globals.INDENT_NUMBER) {
                this.reverseLineWrap();
            }/// if

            /// Instead of using text, just want to measure a single character from my buffer
            var offset = Globals._DrawingContext.measureText(this.currentFont, this.currentFontSize, this.buffer.slice(this.buffer.length - 1)); /// Can I use negative indexes...?. PLEASE.... YES!

            /// Must move the X and Y positions back and up
            var moveXback = this.currentXPosition - offset;
            var moveYback = this.currentYPosition - (Globals._DefaultFontSize + Globals._DrawingContext.fontDescent(this.currentFont, this.currentFontSize) + Globals._FontHeightMargin) + 4;

            /// Hopefully this will be a big enough box to delete the character
            ///
            /// Dunno why the 4 works, but 4 works (probably because of the screen resolution or dpi) and like that's the biggest letter you made so far...
            /// Was really hoping to make it font dependent only, and not hard code it...
            Globals._DrawingContext.clearRect(moveXback, moveYback, this.currentXPosition, 4 + (Globals._DefaultFontSize + Globals._DrawingContext.fontDescent(this.currentFont, this.currentFontSize) + Globals._FontHeightMargin));

            /// Remove the last character
            /// Ok now i'm starting to like this...
            this.buffer = this.buffer.substr(0, this.buffer.length - 1);

            /// Move X position backward
            this.currentXPosition -= offset;
        }
    }/// eraseChar


    public eraseText() {
        /// Visually delete characters as the buffer is "shrinking"
        for (var h = this.buffer.length - 1; h >= 0; --h) {
            /// Step 1: Delete a character
            this.eraseChar();
        }/// for

        /// Buffer should be "empty" by now so let's actually empty it
        this.buffer = "";
    }

    public putText(text: String, indent: number = Globals.INDENT_NUMBER): void {
        /*  My first inclination here was to write two functions: putChar() and putString().
            Then I remembered that JavaScript is (sadly) untyped and it won't differentiate
            between the two. (Although TypeScript would. But we're compiling to JavaScipt anyway.)
            So rather than be like PHP and write two (or more) functions that
            do the same thing, thereby encouraging confusion and decreasing readability, I
            decided to write one function and use the term "text" to connote string or char.
        */
        if (text !== "") {
            /// Split text into a list and each letter one at a time.
            /// 
            /// Might be wierd if "chunks" of letters and words started appearing on the screen at a time
            ///
            /// Simplifies the implementation as there's no need to do weird math on strings
            /// and comparing them to the Canvas Width and blah blah blah.
            var sentence = text.split("", text.length);
            for (var pos = 0; pos < sentence.length; ++pos) {
                text = sentence[pos];

                /// Measure the width of the letter
                var offset = Globals._DrawingContext.measureText(this.currentFont, this.currentFontSize, text);

                /// Advance the X position forward based on the letter width
                var nextXPositon = this.currentXPosition + offset;

                /// Check for a line-wrap
                if ((nextXPositon >= Globals._Canvas.width * .99)) {
                    this.lineWrapPadding.push(this.currentXPosition);
                    this.lineWrap(text, indent, offset);
                }/// if

                else {
                    // Draw the text at the current X and Y coordinates.
                    Globals._DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text);

                    // Move the current X position.
                    this.currentXPosition = nextXPositon;
                }/// if-else
            }/// for
        }///if
    }/// This is tiresome

    public reverseLineWrap() {
        /// Move to the previous line by changing Y position.
        this.currentXPosition = Math.ceil(this.lineWrapPadding.pop()!);

        /* (copy-pasted)
        * Font size measures from the baseline to the highest point in the font.
        * Font descent measures from the baseline to the lowest point in the font.
        * Font height margin is extra spacing between the lines.
        */

        /// Move to the previous line by changing Y position.
        this.currentYPosition -= Globals._DefaultFontSize +
            Globals._DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
            Globals._FontHeightMargin;

        /// TODO: Handle reverse scrolling? Wait...
        ///     Probably add some mouse driver first (by capping a scroll up and scroll down event in jQuery)
        ///     then a two stack to hold forward and backward states if we go with the image thing...

        /// Back to where I came from, eraseChar() I think?
    }

    public lineWrap(myText: any, myIndent: any, myOffset: any): void {
        /// Move to the next line by changing Y position, which scrolls forward need be.
        this.advanceLine();

        /// Resetting the X postion moves us to the beiginning of the left side of the screen.
        ///
        /// We COULD add an abstracted version of an indent, but our master MS DOS doesn't so why should I?
        this.currentXPosition = myIndent;

        /// Drawing the remaining letters after the line-wrap.
        /// this.putText("  ");
        Globals._DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, myText);

        /// Move the current X position (copy-pasted).
        this.currentXPosition = this.currentXPosition + myOffset;
    }

    public advanceLine(): void {
        this.currentXPosition = 0;
        /*
         * Font size measures from the baseline to the highest point in the font.
         * Font descent measures from the baseline to the lowest point in the font.
         * Font height margin is extra spacing between the lines.
         */

        /// Move the current Y position down one line
        this.currentYPosition += Globals._DefaultFontSize +
            Globals._DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
            Globals._FontHeightMargin;

        // TODO: Handle scrolling. (iProject 1)

        /// If the Y position goes off the screen...
        if (this.currentYPosition > Globals._Canvas.height) {
            /// Snapshot the current screen
            var img = Globals._DrawingContext.getImageData(0, 0, Globals._Canvas.width, Globals._Canvas.height);

            /// Clear everything off the screen
            this.clearScreen();

            /// Put the snapshot back but shifted up one light
            Globals._DrawingContext.putImageData(img, 0, -(Globals._DefaultFontSize +
                Globals._DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                Globals._FontHeightMargin));

            /// Move the current Y position down another line
            this.currentYPosition = Globals._Canvas.height - this.currentFontSize;
        }
    }
} // Console