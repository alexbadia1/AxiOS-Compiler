/* ------------
   Shell.ts
   The OS Shell - The "command line interface" (CLI) for the console.
    Note: While fun and learning are the primary goals of all enrichment center activities,
          serious injuries may occur when trying to write your own Operating System.
    Hint: A shell command should kinda follow this template:
        public thisIsAShellCommand(args[]) {
            if (args.length equals number of required shell arguments)
                /// Cleanse the arguments
                ///     Meaning, trim them, check for invalid characters, etc.
                /// If (all arguments are "good")
                ///     Enqueue interrupt in kernel interrupt queue OR call function from MemoryManager.ts, Disk.ts, etc.
                ////        - This will depend on what the shell command is...
                /// Else
                ///     Tell user why they fuc -I mean- "did not meet the requirements" for the shell command...
            else 
                -StdOut.putText("Shell command expected [insert number of arguments], but got [insert how many arguments the user actually gave]");
        }/// thisIsAShellCommand
   ------------ */

import { Globals } from "../global";
import { Control } from "../host/control";
import { Utils } from "../util";
import { Interrupt } from "./interrupt";
import { SimpleVolume } from "./memoryManager";
import { ProcessControlBlock } from "./processControlBlock";
import { ShellCommand } from "./shellCommand";
import { UserCommand } from "./userCommands";

/// TODO: Write a base class / prototype for system services and let Shell inherit from it.

export class Shell {
    /// Properties
    public promptStr = "C:\\AxiOS>"; /// Ohhhh *lightbulb goes off*, too bad we don't have a multi-level file system...
    public commandList: any = [];
    public curses = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
    public apologies = "[sorry]";

    constructor() { }

    public init() {
        /*************************************************************************************
        Loading the SHELL COMMAND LIST
            help - Lists all available commands
            shutdown - Shuts down AxiOS
            cls - Clears the screen
            man <string> - Displays the manual page for <string>
            trace <on | off> - Enables/disables the AxiOS trace
            rot13 <string> - Does rot13 encryption of <string>
            prompt <string> - sets the prompt
            ...
            ver - Displays the current version data
            date - Displays the current date and time
            whereami - displays the users current location (use your imagination)
            status <string> - Sets the status message
            bsod - Enables the blue screen of death
            load [<priority>] - Loads the specified user program 
            eightball <string> - Eightball will answer all of your questions
            ...
            run <int> - Executes a program in memory
            ...
            clearmem - clear all memory partitions
            runall - execute all programs at once
            ps - display the PID and state of all processes
            kill <pid> - kill one process
            killall - kill all processes
            quantum <int> - let the user set the Round Robin Quantum (measured in CPU cycles)
            ...
        ***************************************************************************************/
        var sc: ShellCommand;

        /*************************************************************************************
        Alan's Base Commands: 
            help - Lists all available commands
            shutdown - Shuts down AxiOS
            cls - Clears the screen
            man <string> - Displays the manual page for <string>
            trace <on | off> - Enables/disables the AxiOS trace
            rot13 <string> - Does rot13 encryption of <string>
            prompt <string> - sets the prompt
        ***************************************************************************************/

        /// help - Lists all available commands
        sc = new ShellCommand(this.shellHelp,
            "help",
            "- This is the help command. Seek help.");
        this.commandList[this.commandList.length] = sc;

        /// shutdown - Shuts down AxiOS
        sc = new ShellCommand(this.shellShutdown,
            "shutdown",
            "- Shuts down the virtual OS but leaves the underlying host / hardware simulation running.");
        this.commandList[this.commandList.length] = sc;

        /// cls - Clears the screen
        sc = new ShellCommand(this.shellCls,
            "cls",
            "- Clears the screen and resets the cursor position.");
        this.commandList[this.commandList.length] = sc;

        /// man <string> - Displays the manual page for <string>
        sc = new ShellCommand(this.shellMan,
            "man",
            "<topic> - Displays the MANual page for <topic>.");
        this.commandList[this.commandList.length] = sc;

        /// trace <on | off> - Enables/disables the AxiOS trace
        sc = new ShellCommand(this.shellTrace,
            "trace",
            "<on | off> - Turns the OS trace on or off.");
        this.commandList[this.commandList.length] = sc;

        /// rot13 <string> - Does rot13 encryption of <string>
        sc = new ShellCommand(this.shellRot13,
            "rot13",
            "<string> - Does rot13 obfuscation on <string>.");
        this.commandList[this.commandList.length] = sc;

        /// prompt <string> - sets the prompt
        sc = new ShellCommand(this.shellPrompt,
            "prompt",
            "<string> - Sets the prompt.");
        this.commandList[this.commandList.length] = sc;


        /*************************************************************************************
        iProject1 Commands: 
            ver - Displays the current version data
            date - Displays the current date and time
            whereami - Displays the users current location (use your imagination)
            status <string> - Sets the status message
            bsod - Enables the blue screen of death
            load [<priority>] - Loads the specified user program 
            eightball <string> - Eightball will answer all of your questions
        ***************************************************************************************/
        /// ver - Displays the current version data
        sc = new ShellCommand(this.shellVer,
            "ver",
            "- Displays the current version data.");
        this.commandList[this.commandList.length] = sc;

        /// date - Displays the current date and time
        sc = new ShellCommand(this.shellDate,
            'date',
            'Displays the current date and time.');
        this.commandList[this.commandList.length] = sc;

        /// whereami - displays the users current location (use your imagination)
        sc = new ShellCommand(this.shellWhereAmI,
            'whereami',
            'Displays the users current location (use your imagination.');
        this.commandList[this.commandList.length] = sc;

        /// eightball <string> - Eightball will answer all of your questions
        sc = new ShellCommand(this.shellMagicEightball,
            'eightball',
            '<string> - Ask me anything...');
        this.commandList[this.commandList.length] = sc;

        /// status <string> - Sets the status message
        sc = new ShellCommand(this.shellStatus,
            'status',
            '<string> - Sets the status message.');
        this.commandList[this.commandList.length] = sc;

        /// bsod - Enables the blue screen of death
        sc = new ShellCommand(this.shellBSOD,
            'bsod',
            'Enables the blue screen of death');
        this.commandList[this.commandList.length] = sc;

        /// load [<priority>] - Loads the specified user program
        sc = new ShellCommand(this.shellLoad,
            'load',
            'Loads the specified user program');
        this.commandList[this.commandList.length] = sc;

        /*************************************************************************************
        iProject2 Commands:
            run <int> - Executes a program in memory
        ***************************************************************************************/
        /// run <int> - Executes a program in memory
        sc = new ShellCommand(this.shellRun,
            'run',
            '<int> - Runs process id in cpu');
        this.commandList[this.commandList.length] = sc;

        /*************************************************************************************
        iProject3 Commands: 
            clearmem - Clear all memory partitions
            runall - Execute all programs at once
            ps - Display the PID and state of all processes
            kill <pid> - Kill one process
            killall - Kill all processes
            quantum <int> - Let the user set the Round Robin Quantum (measured in CPU cycles)
        ***************************************************************************************/

        /// clearmem - Clear all memory partitions
        sc = new ShellCommand(this.shellClearMem,
            'clearmem',
            'Clear all memory partitions.');
        this.commandList[this.commandList.length] = sc;

        /// runall - Execute all programs at once
        sc = new ShellCommand(this.shellRunAll,
            'runall',
            'Execute all programs at once.');
        this.commandList[this.commandList.length] = sc;

        /// ps - Display the PID and state of all processes
        sc = new ShellCommand(this.shellPs,
            'ps',
            'Display the PID and state of all processes.');
        this.commandList[this.commandList.length] = sc;

        /// kill <pid> - Kill one process
        sc = new ShellCommand(this.shellKill,
            'kill',
            'Kill one process.');
        this.commandList[this.commandList.length] = sc;

        /// killall - Kill all processes
        sc = new ShellCommand(this.shellKillAll,
            'killall',
            'Kill all processes.');
        this.commandList[this.commandList.length] = sc;

        /// quantum <int> - Let the user set the Round Robin Quantum (measured in CPU cycles)
        sc = new ShellCommand(this.shellQuantum,
            'quantum',
            'Let the user set the Round Robin Quantum (measured in CPU cycles).');
        this.commandList[this.commandList.length] = sc;

        /*************************************************************************************
        iProject4 Commands: 
        Disk Operations
            create <filename>: Create the file [filename] and display a message denoting success or failure
            read <filename>: Read and display the contents of [filename] or display an error if something went wrong
            write <filename> "data": Write data inside the quotes to [filename] and display a message denoting success or failure
            delete <filename>: Remove [filename] from storage and display a message denoting success or failure
            format: Initialize all blocks in all sectors in all tracks and display a message denoting success or failure
            ls: List files currently stored on the disk
            format -quick: initialize the first four bytes of every directory and data block
            format -full: same as quick and also initializes bytes 4-63 in directory and data blocks too.
            ls -l: lists all filenames [even hidden ones] as well as their size and create date.
        Scheduling
            setSchedule <rr, fcfs, priority> - selects a CPU scheduling algorithm
            getSchedule - returns the current CPU scheduling program
        ***************************************************************************************/

        /// format - Initialize all blocks in all sectors in all tracks and display a message denoting success or failure
        /// Optional parameters: 
        ///     format -quick: initialize the first four bytes of every directory and data block
        ///     format -full: same as quick and also initializes bytes 4-63 in directory and data blocks too.
        sc = new ShellCommand(this.shellFormat,
            'format',
            'Initialize blocks, sectors and tracks in disk');
        this.commandList[this.commandList.length] = sc;

        /// create <filename>: Create the file [filename] and display a message denoting success or failure
        sc = new ShellCommand(this.shellCreate,
            'create',
            'Create the file [filename]');
        this.commandList[this.commandList.length] = sc;

        /// ls - List files currently stored on the disk
        /// Optional parameters: 
        ///     ls -l: lists all filenames [even hidden ones] as well as their size and create date.
        sc = new ShellCommand(this.shellList,
            'ls',
            'List files currently stored on the disk');
        this.commandList[this.commandList.length] = sc;

        /// read <filename>: Read and display the contents of [filename] or display an error if something went wrong
        sc = new ShellCommand(this.shellRead,
            'read',
            'Read and display the contents of [filename]');
        this.commandList[this.commandList.length] = sc;

        /// write <filename> "data": Write data inside the quotes to [filename] and display a message denoting success or failure
        sc = new ShellCommand(this.shellWrite,
            'write',
            'Write data inside the quotes to [filename]');
        this.commandList[this.commandList.length] = sc;

        /// delete <filename>: Remove [filename] from storage and display a message denoting success or failure
        sc = new ShellCommand(this.shellDelete,
            'delete',
            'Remove [filename] from storage');
        this.commandList[this.commandList.length] = sc;

        /// defrag: defragment disk drive and display a message denoting success or failure
        sc = new ShellCommand(this.shellDefrag,
            'defrag',
            'defragment disk drive');
        this.commandList[this.commandList.length] = sc;

        /// getSchedule: returns currently selected sheduling algorithm
        sc = new ShellCommand(this.shellGetSchedule,
            'getschedule',
            'returns currently selected sheduling algorithm');
        this.commandList[this.commandList.length] = sc;

        /// setSchedule <rr, fcfs, priority>: defragment disk drive and display a message denoting success or failure
        sc = new ShellCommand(this.shellSetSchedule,
            'setschedule',
            'sets the currently selected scheduling algorithm');
        this.commandList[this.commandList.length] = sc;

        /// rename <file> <new filename>: changes the filename to the new name specified
        sc = new ShellCommand(this.shellRename,
            'rename',
            'changes the filename to the new name specified');
        this.commandList[this.commandList.length] = sc;

        /// recover <filename>: attempts recovers the delete file
        sc = new ShellCommand(this.shellRecover,
            'recover',
            'attempts recovers the delete file');
        this.commandList[this.commandList.length] = sc;

        /// copy <filename>: attempts copy the file
        sc = new ShellCommand(this.shellCopy,
            'copy',
            'attempts copy the file');
        this.commandList[this.commandList.length] = sc;

        /// Display the initial prompt.
        ///
        /// If I somehow make it into the "Hall of Fame" I may as well do something memorable. Cause, you know...
        /// I *Start Emphasis* doubt *End Emphasis* anyone's ever done this in the Hall of Fame *Avoids making Eye Contact*...
        this.blackLivesMatter();
        this.putPrompt();
    }// init

    public putPrompt() {
        Globals._StdOut.putText(this.promptStr);
    }/// putPrompt

    public handleInput(buffer: any) {
        Globals._Kernel.krnTrace("Shell Command~" + buffer);
        //
        // Parse the input...
        //
        var userCommand = this.parseInput(buffer);
        // ... and assign the command and args to local variables.
        var cmd = userCommand.command;
        var args = userCommand.args;
        //
        // Determine the command and execute it.
        //
        // TypeScript/JavaScript may not support associative arrays in all browsers so we have to iterate over the
        // command list in attempt to find a match. 
        // TODO: Is there a better way? Probably. Someone work it out and tell me in class.
        var index: number = 0;
        var found: boolean = false;
        var fn = undefined;
        while (!found && index < this.commandList.length) {
            if (this.commandList[index].command === cmd) {
                found = true;
                fn = this.commandList[index].func;
            }/// if 
            else {
                ++index;
            }/// else
        }
        if (found) {
            this.execute(fn, args);  // Note that args is always supplied, though it might be empty.
        }/// if 
        else {
            // It's not found, so check for curses and apologies before declaring the command invalid.
            if (this.curses.indexOf("[" + Utils.rot13(cmd) + "]") >= 0) {     // Check for curses.
                this.execute(this.shellCurse);
            }/// if
            else if (this.apologies.indexOf("[" + cmd + "]") >= 0) {        // Check for apologies.
                this.execute(this.shellApology);
            }/// else-if
            else { // It's just a bad command. {
                this.execute(this.shellInvalidCommand);
            }/// else
        }/// else
    }/// handleInput

    // Note: args is an optional parameter, ergo the ? which allows TypeScript to understand that.
    public execute(fn: any, args?: any) {
        // We just got a command, so advance the line...
        Globals._StdOut.advanceLine();
        // ... call the command function passing in the args with some über-cool functional programming ...
        fn(args);
        // Check to see if we need to advance the line again
        if (Globals._StdOut.currentXPosition > 0) {
            Globals._StdOut.advanceLine();
        }/// if
        // ... and finally write the prompt again.
        this.putPrompt();
    }/// execute

    /// Thank you for this (seriously) makes our life a bit easier.
    public parseInput(buffer: string): UserCommand {
        var retVal = new UserCommand();

        // 1. Remove leading and trailing spaces.
        buffer = Utils.trim(buffer);

        // 2. Lower-case it.
        buffer = buffer.toLowerCase();

        // 3. Separate on spaces so we can determine the command and command-line args, if any.
        var tempList = buffer.split(" ");

        // 4. Take the first (zeroth) element and use that as the command.
        var cmd = tempList.shift();  // Yes, you can do that to an array in JavaScript. See the Queue class.

        // 4.1 Remove any left-over spaces.
        cmd = Utils.trim(cmd);
        // 4.2 Record it in the return value.
        retVal.command = cmd;

        // 5. Now create the args array from what's left.
        for (var i in tempList) {
            var arg = Utils.trim(tempList[i]);
            if (arg != "") {
                retVal.args[retVal.args.length] = tempList[i];
            }/// if
        }/// for
        return retVal;
    }/// parseInput

    //
    // Shell Command Functions. Kinda not part of Shell() class exactly, but
    // called from here, so kept here to avoid violating the law of least astonishment.
    //

    public shellInvalidCommand() {
        Globals._StdOut.putText("Invalid Command. ");
        if (Globals._SarcasticMode) {
            Globals._StdOut.putText("Unbelievable. You, [subject name here],");
            Globals._StdOut.advanceLine();
            Globals._StdOut.putText("must be the pride of [subject hometown here].");
        }/// if 
        else {
            Globals._StdOut.putText("Type 'help' for, well... help.");
        }/// else
    }/// shellInvalidCommand

    public shellCurse() {
        Globals._StdOut.putText("Oh, so that's how it's going to be, eh? Fine.");
        Globals._StdOut.advanceLine();
        Globals._StdOut.putText("Bitch.");
        Globals._SarcasticMode = true;
    }/// shellCurse

    public shellApology() {
        if (Globals._SarcasticMode) {
            Globals._StdOut.putText("I think we can put our differences behind us.");
            Globals._StdOut.advanceLine();
            Globals._StdOut.putText("For science . . . You monster.");
            Globals._SarcasticMode = false;
        }/// if 
        else {
            Globals._StdOut.putText("For what?");
        }/// else
    }/// shellApology

    /*************************************************************************************
    Alan's Base Commands: 
        help - Lists all available commands
        shutdown - Shuts down AxiOS
        cls - Clears the screen
        man <string> - Displays the manual page for <string>
        trace <on | off> - Enables/disables the AxiOS trace
        rot13 <string> - Does rot13 encryption of <string>
        prompt <string> - sets the prompt
    ***************************************************************************************/

    /// help - Lists all available commands
    public shellHelp(args: string[]) {
        Globals._StdOut.putText("Commands:");
        for (var i in Globals._OsShell.commandList) {
            Globals._StdOut.advanceLine();
            var words = "  " + Globals._OsShell.commandList[i].command + " " + Globals._OsShell.commandList[i].description;
            Globals._StdOut.putText(words);
        }/// for
    }/// shellHelp

    /// shutdown - Shuts down AxiOS
    public shellShutdown(args: string[]) {
        Globals._StdOut.putText("Shutting down...");
        // Call Kernel shutdown routine.
        this.shellStatus(['Shutdown']);
        Globals._Kernel.krnShutdown();
        // TODO: Stop the final prompt from being displayed. If possible. Not a high priority. (Damn OCD!)
    }/// shellShutdown

    /// cls - Clears the screen
    public shellCls(args: string[]) {
        Globals._StdOut.clearScreen();
        Globals._StdOut.resetXY();
    }/// shellCls

    /// trace <on | off> - Enables/disables the AxiOS trace
    public shellTrace(args: string[]) {
        if (args.length > 0) {
            var setting = args[0];
            switch (setting) {
                case "on":
                    if (Globals._Trace && Globals._SarcasticMode) {
                        Globals._StdOut.putText("Trace is already on, doofus.");
                    }/// if
                    else {
                        Globals._Trace = true;
                        Globals._StdOut.putText("Trace ON");
                    }/// else
                    break;
                case "off":
                    Globals._Trace = false;
                    Globals._StdOut.putText("Trace OFF");
                    break;
                default:
                    Globals._StdOut.putText("Invalid arguement.  Usage: trace <on | off>.");
            }/// switch
        }/// if 
        else {
            Globals._StdOut.putText("Usage: trace <on | off>");
        }/// else
    }/// shellTrace

    /// rot13 <string> - Does rot13 encryption of <string>
    public shellRot13(args: string[]) {
        if (args.length > 0) {
            // Requires Utils.ts for rot13() function.
            Globals._StdOut.putText(args.join(' ') + " = '" + Utils.rot13(args.join(' ')) + "'");
        }/// if
        else {
            Globals._StdOut.putText("Usage: rot13 <string>  Please supply a string.");
        }/// else
    }/// shellRot13

    /// prompt <string> - sets the prompt
    public shellPrompt(args: string[]) {
        if (args.length > 0) {
            Globals._OsShell.promptStr = args[0];
        }/// if 
        else {
            Globals._StdOut.putText("Usage: prompt <string>  Please supply a string.");
        }/// else
    }/// shellPrompt

    /*************************************************************************************
    SHELL MANUAL
    iProject1 Commands: 
        ver - Displays the current version data
        date - Displays the current date and time
        whereami - displays the users current location (use your imagination)
        status <string> - Sets the status message
        bsod - Enables the blue screen of death
        load [<priority>] - Loads the specified user program 
        eightball <string> - Eightball will answer all of your questions
    iProject2 Commands: 
        run <int> - Executes a program in memory
    iProject3 Commands: 
        clearmem - clear all memory partitions
        runall - execute all programs at once
        ps - display the PID and state of all processes
        kill <pid> - kill one process
        killall - kill all processes
        quantum <int> - let the user set the Round Robin Quantum (measured in CPU cycles)
    
    iProject4 Commands: 
        Disk Operations
            create <filename>: Create the file [filename] and display a message denoting success or failure
            read <filename>: Read and display the contents of [filename] or display an error if something went wrong
            write <filename> "data": Write data inside the quotes to [filename] and display a message denoting success or failure
            delete <filename>: Remove [filename] from storage and display a message denoting success or failure
            format: Initialize all blocks in all sectors in all tracks and display a message denoting success or failure
            ls: List files currently stored on the disk
            format -quick: initialize the first four bytes of every directory and data block
            format -full: same as quick and also initializes bytes 4-63 in directory and data blocks too.
            ls -l: lists all filenames [even hidden ones] as well as their size and create date.
        Scheduling
            setSchedule <rr, fcfs, priority> - selects a CPU scheduling algorithm
            getSchedule - returns the current CPU scheduling program
    ***************************************************************************************/
    public shellMan(args: string[]) {
        if (args.length > 0) {
            var topic = args[0];
            switch (topic) {
                case "help":
                    Globals._StdOut.putText("help - displays a list of (hopefully) valid commands.");
                    break;
                case "ver":
                    Globals._StdOut.putText("ver - Displays the current version data.");
                    break;
                case "date":
                    Globals._StdOut.putText("date - Displays the current date and time.");
                    break;
                case "whereami":
                    Globals._StdOut.putText("wherami - displays the users current location (use your imagination).");
                    break;
                case "eightball":
                    Globals._StdOut.putText("eightball -  will answer all of your questions.");
                    break;
                case "status":
                    Globals._StdOut.putText("status <string> - Sets the status message.");
                    break;
                case "bsod":
                    Globals._StdOut.putText("bsod - Enables the blue screen of death.");
                    break;
                case "load":
                    Globals._StdOut.putText("load [<priority>] - Loads the specified user program.");
                    break;
                case "run":
                    Globals._StdOut.putText("run <int> - Executes a program in memory.");
                    break;
                case "clearmem":
                    Globals._StdOut.putText("clearmem - clear all memory partitions.");
                    break;
                case "runall":
                    Globals._StdOut.putText("runall - execute all programs at once.");
                    break;
                case "ps":
                    Globals._StdOut.putText("ps - display the PID and state of all processes.");
                    break;
                case "kill":
                    Globals._StdOut.putText("kill <pid> - kill one process.");
                    break;
                case "killall":
                    Globals._StdOut.putText("killall - kill all processes.");
                    break;
                case "quantum":
                    Globals._StdOut.putText("quantum <int> - let the user set the Round Robin Quantum (measured in CPU cycles).");
                    break;
                case "format":
                    Globals._StdOut.putText("format <-quick|-full> - Initialize all blocks in all sectors in all tracks in disk.");
                    break;
                case "create":
                    Globals._StdOut.putText("create <filename>: Create the file [filename] in disk");
                    break;
                case "ls":
                    Globals._StdOut.putText("ls <-l> - List files currently stored on the disk.");
                    break;
                case "read":
                    Globals._StdOut.putText("read <filename>: Read and display the contents of [filename].");
                    break;
                case "write":
                    Globals._StdOut.putText("write <filename> 'data': Write data inside the quotes to [filename].");
                    break;
                case "delete":
                    Globals._StdOut.putText("delete <filename>: Remove [filename] from storage.");
                    break;
                case "defrag":
                    Globals._StdOut.putText("defrag: defragments disk drive.");
                    break;
                case "setschedule":
                    Globals._StdOut.putText("setschedule: sets the current scheduling algorithm");
                    break;
                case "getschedule":
                    Globals._StdOut.putText("getschedule: gets the current scheduling algorithm");
                    break;
                case "rename":
                    Globals._StdOut.putText("rename <file> <new filename>: changes the filename to the new name specified");
                    break;
                case "recover":
                    Globals._StdOut.putText("recover <filename>: attempts to recover the delted file");
                default:
                    Globals._StdOut.putText("No manual entry for " + args[0] + ".");
            }/// switch
        }/// if 
        else {
            Globals._StdOut.putText("Usage: man <topic>  Please supply a topic.");
        }/// else
    }/// shellMan

    /*************************************************************************************
    iProject1 Commands: 
        ver - Displays the current version data
        date - Displays the current date and time
        whereami - displays the users current location (use your imagination)
        status <string> - Sets the status message
        bsod - Enables the blue screen of death
        load [<priority>] - Loads the specified user program 
        eightball <string> - Eightball will answer all of your questions
    ***************************************************************************************/

    /// ver - Displays the current version data
    public shellVer(args: string[]) {
        Globals._StdOut.putText(Globals.APP_NAME + " version " + Globals.APP_VERSION + " Iteration Alex Badia's");
    }/// shellVer

    /// date - Displays the current date and time
    public shellDate() {
        var myDate = new Date();
        Globals._StdOut.putText("" + myDate);
    }/// shellDate

    /// whereami - displays the users current location (use your imagination)
    public shellWhereAmI() {
        var myLocation = "Whiterun";
        Globals._StdOut.putText("Approximate location: " + myLocation);
    }///shelWhereAmI

    /// bsod - Enables the blue screen of death
    public shellBSOD() {
        Globals._Kernel.krnTrapError("I've failed you Alan :(");
    }/// shellBSOD

    /// status <string> - Sets the status message
    public shellStatus(args: string[]) {
        var ans = "";

        /// append arguments into a single string format from list of strings format
        for (var h = 0; h < args.length; ++h) {
            ans += " " + args[h];
        }/// for

        /// If there are arguments update the status
        /// Else show the proper "usage prompt"
        if (args.length > 0) {
            document.getElementById('divLog--status')!.innerText = ans;
            Globals._StdOut.putText("status changed to: " + ans);
        }// if
        else {
            Globals._StdOut.putText("Usage: prompt <string>  Please supply a string.");
        }/// else
    }/// shellStatus

    /// load [<priority>] - Loads the specified user program
    ///
    /// In hindsight, creating the process and all should not be in the shell...
    public shellLoad(args: string[]) {

        if (args.length <= 1 && args.length >= 0) {
            /// Getting and cleansing input
            var userInput: string = Globals._taProgramInput.value.trim();
            userInput = userInput.toUpperCase().replace(/\s/g, '');

            /// Test for hexadecimal characters using regular expression...
            if (/^[A-F0-9]+$/i.test(userInput)) {

                /// Making sure there are no incomplete hex data pairs
                if (userInput.length % 2 === 0) {

                    /// Memory is full...
                    if (Globals._MemoryManager.firstFit() === -1) {

                        /// Try to write to the disk instead, remember it must be formatted first!
                        if (Globals._krnDiskDriver.formatted) {
                            /// Create a Process Control Block
                            var newProcessControlBlock: ProcessControlBlock = new ProcessControlBlock();

                            /// Assign continuosly growing list of process id's and add to list of processes
                            ///
                            /// This is TEMPORARY and may need to be rolled back if no room on the disk
                            /// Thus we will wait to actually push the pcb onto the resident list
                            newProcessControlBlock.processID = Globals._ResidentList.size;
                            Globals._ResidentList.size++;

                            /// Create a swap file for said pcb
                            newProcessControlBlock.swapFileName = `${Globals._krnDiskDriver.hiddenFilePrefix}${Globals._krnDiskDriver.swapFilePrefix}${newProcessControlBlock.processID}`;

                            /// Now try to actually create the swap file and write to it if there's enough room
                            ///
                            /// Asyncronously...
                            ///     Future<void> shellLoad() async {
                            ///         Future<boolean> result = await Globals._KernelInterruptPriorityQueue.enqueue(new Interrupt(DISK_IRQ, ['create', args[0]]));
                            ///         return result;
                            ///     }/// shellLoad
                            /// 
                            /// Ya know, I might actually try to re do this in an asyncronous fashion in Dart and create a fultter app for it...
                            var diskDriverResult: string = '';
                            diskDriverResult = Globals._krnDiskDriver.create(newProcessControlBlock.swapFileName);
                            Globals._StdOut.putText(`  ${diskDriverResult}`);
                            Globals._StdOut.advanceLine();
                            /// File created for program
                            if (!diskDriverResult.startsWith('Cannot create')) {
                                diskDriverResult = Globals._krnDiskDriver.write(newProcessControlBlock.swapFileName, userInput);
                                Globals._StdOut.putText(`  Program Succesfully ${diskDriverResult}`);
                                Globals._StdOut.advanceLine();

                                /// Program succesfully written to file
                                if (!diskDriverResult.startsWith('Cannot write')) {
                                    newProcessControlBlock.volumeIndex = -1;

                                    if (args.length === 1) {
                                        /// Getting and cleansing input
                                        var trimmedStringPriority: string = args[0].trim();
                                        trimmedStringPriority = trimmedStringPriority.toUpperCase().replace(/\s/g, '');
                                        if (/^[0-9]+$/i.test(trimmedStringPriority)) {
                                            newProcessControlBlock.priority = parseInt(trimmedStringPriority);
                                        }/// if
                                    }/// if

                                    /// Can safely add process to the resident queue
                                    Globals._ResidentList.residentList.push(newProcessControlBlock);

                                    /// Update pcb state to resident as the process is now in the resident list
                                    newProcessControlBlock.processState = "Resident";
                                }/// if

                                /// Not enough room to write to the file so roll back process control block changes
                                else {
                                    /// Undo the increase to resident list size
                                    Globals._ResidentList.size--;
                                }/// else
                            }/// if

                            /// Not enough room to create the file so roll back process control block changes
                            else {
                                /// Undo the increase to resident list size
                                Globals._ResidentList.size--;
                            }
                        }/// if

                        /// Disk ain't formatted doofus!
                        else {
                            Globals._Kernel.krnTrace("Disk is not yet formatted!");
                            Globals._StdOut.putText("You must format the drive disk before use!");
                        }/// else
                    } ///if

                    /// Memory not full...
                    else {
                        /// Free Simple Volume was found
                        var freeSpot: number = Globals._MemoryManager.firstFit();
                        var freeSimpleVolume: SimpleVolume = Globals._MemoryManager.simpleVolumes[freeSpot];

                        /// Create a Process Control Block
                        /// State is "New" until put in resident list
                        var newProcessControlBlock: ProcessControlBlock = new ProcessControlBlock();
                        newProcessControlBlock.processState = "New";

                        /// Set location of the new process in memory segment
                        newProcessControlBlock.volumeIndex = freeSpot;

                        /// Set Priority
                        if (args.length === 1) {
                            /// Getting and cleansing input
                            var trimmedStringPriority: string = args[0].trim();
                            trimmedStringPriority = trimmedStringPriority.toUpperCase().replace(/\s/g, '');
                            if (/^[0-9]+$/i.test(trimmedStringPriority)) {
                                newProcessControlBlock.priority = parseInt(trimmedStringPriority);
                            }/// if
                        }/// if

                        /// Assign continuosly growing list of process id's and add to list of processes
                        newProcessControlBlock.processID = Globals._ResidentList.size;
                        Globals._ResidentList.size++;
                        Globals._ResidentList.residentList.push(newProcessControlBlock);

                        /// Show user said process id...
                        Globals._StdOut.putText(`Process ID: ${newProcessControlBlock.processID}`);
                        Globals._StdOut.advanceLine();

                        var hexPair: string = '';
                        var logicalAddress: number = 0;
                        for (var pos: number = 0; pos < Globals.MAX_SIMPLE_VOLUME_CAPACITY * 2; pos += 2) {

                            /// Read two characters at a time...
                            if (userInput[pos] + userInput[pos + 1]) {
                                hexPair = userInput[pos] + userInput[pos + 1];
                            }/// if
                            else {
                                hexPair = '00';
                            }/// else

                            Globals._MemoryAccessor.write(Globals._MemoryManager.simpleVolumes[freeSpot], logicalAddress, hexPair)

                            logicalAddress++;
                        }/// for

                        /// Protect volumes from being written into by accident...
                        /// Each individual address at the memory level will be locked to to prevent such overflow issues
                        freeSimpleVolume.writeLock();

                        /// Nothing went wrong, update pcb state to resident as the process is now in the resident list
                        newProcessControlBlock.processState = "Resident";
                    } ///else
                }/// if 

                /// The user inputted an odd amount of hex characters meaning there is an unmatched pair, so 
                /// print out to the console that is ain't gonna work.
                else {
                    Globals._StdOut.putText("Invalid Hex Data.");
                    Globals._StdOut.advanceLine();
                    Globals._StdOut.putText("Hex Command or Hex Data is incomplete.");
                    Globals._StdOut.advanceLine();
                    Globals._StdOut.putText("Type \'help\' for, well... help.");
                    Globals._StdOut.advanceLine();
                }
            } /// if
            else {
                Globals._StdOut.putText("Invalid Hex Data.");
                Globals._StdOut.advanceLine();
                Globals._StdOut.putText("Type \'help\' for, well... help.");
                Globals._StdOut.advanceLine();
            }/// else
        }/// if

        /// Too many arguments
        else {
            Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: load <int> Expected 0 or 1 arguments, but got ${args.length}`);
            Globals._StdOut.advanceLine();
        }/// else

        /// Update Visual Memory
        Control.updateVisualMemory();
    }/// shellLoad

    /// eightball <string> - Eightball will answer all of your questions
    public shellMagicEightball(args: string[]) {
        var min = 0;
        var max = 19;
        if (args.length > 0) {
            /// Eightball answers may be subject to copyright...
            var answers = [
                "It is certain.",
                "It is decidedly so.",
                "Without a doubt.",
                "Yes – definitely.",
                "You may rely on it.",
                "As I see it, yes.",
                "Most likely.",
                "Outlook good.",
                "Yes.",
                "Signs point to yes.",
                "Reply hazy, try again.",
                "Ask again later.",
                "Better not tell you now.",
                "Cannot predict now.",
                "Concentrate and ask again.",
                "Don't count on it.",
                "My reply is no.",
                "My sources say no.",
                "Outlook not so good.",
                "Very doubtful."
            ];

            var randomNum = Math.floor(Math.random() * (max - min + 1) + min);
            var ans = answers[randomNum];
            Globals._StdOut.putText("" + ans);

        } else {
            Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: magic eightball <string>  Please supply a string.`);
        }//if-else
    }/// shellMagicEightball


    /*************************************************************************************
    iProject2 Commands: 
        run <int> - Executes a program in memory
    ***************************************************************************************/

    /// run <int> - Executes a program in memory
    public shellRun(args: string[]) {

        if (args.length === 1) {
            /// Apparently Javascripts tolerance of NaN completly defeats the purpose of using this 
            /// try catch... nice!
            try {
                /// Check if the process exists with basic linear search
                var curr: number = 0;
                var found: boolean = false;
                while (curr < Globals._ResidentList.residentList.length && !found) {
                    if (Globals._ResidentList.residentList[curr].processID == parseInt(args[0])) {
                        found = true;
                    }/// if
                    else {
                        curr++;
                    }/// else
                }/// while

                if (!found) {
                    Globals._StdOut.putText(`${Globals.INDENT_STRING}No process control blocks found with pid: ${parseInt(args[0])}.`);
                    Globals._StdOut.advanceLine();
                }/// if

                /// Process exists in the resident queue
                else {
                    /// Use interrupt to allow for seemless integration of scheduling
                    /// For example:
                    ///     > run 0
                    ///     ...
                    ///     > run 2
                    ///     > run 1
                    /// No matter what order, should still schedule the processes in round robin fashion...
                    /// Use Single Step to see what's "really" happening...
                    Globals._KernelInterruptPriorityQueue.enqueueInterruptOrPcb(new Interrupt(Globals.RUN_PROCESS_IRQ, [curr, args[0]]));
                }/// else
            }/// try
            catch (e) {
                Globals._StdOut.putText(`${e}`);
                Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: run <int> please supply a process id.`);
                Globals._StdOut.advanceLine();
            }/// catch
        }/// if

        /// Not only 1 argument was given
        else {
            Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: run <int> Expected 1 arguments, but got ${args.length}`);
            Globals._StdOut.advanceLine();
        }/// else
    }/// run


    /*************************************************************************************
    iProject3 Commands: 
        clearmem - clear all memory partitions
        runall - execute all programs at once
        ps - display the PID and state of all processes
        kill <pid> - kill one process
        killall - kill all processes
        quantum <int> - let the user set the Round Robin Quantum (measured in CPU cycles)
    ***************************************************************************************/

    /// clearmem - clear all memory partitions
    public shellClearMem() {
        /// Processes are NOT running, safe to clear memory
        if (!Globals._CPU.isExecuting || (Globals._Scheduler.currentProcess === null && Globals._Scheduler.readyQueue.getSize() === 0)) {
            var processToRemove: ProcessControlBlock[] = [];

            /// Loop through resident list 
            for (var p: number = 0; p < Globals._ResidentList.residentList.length; ++p) {

                /// Find each process that is in memory
                if (Globals._ResidentList.residentList[p].volumeIndex === 0 || Globals._ResidentList.residentList[p].volumeIndex === 1 || Globals._ResidentList.residentList[p].volumeIndex === 2) {
                    /// Unlock volume
                    Globals._MemoryManager.simpleVolumes[Globals._ResidentList.residentList[p].volumeIndex].writeUnlock();

                    /// Write in 00's for the entire volume
                    for (var logicalAddress: number = 0; logicalAddress < Globals.MAX_SIMPLE_VOLUME_CAPACITY; ++logicalAddress) {
                        Globals._MemoryAccessor.write(Globals._MemoryManager.simpleVolumes[Globals._ResidentList.residentList[p].volumeIndex], logicalAddress, "00");
                    }/// for

                    /// Push to list to remove
                    processToRemove.push(Globals._ResidentList.residentList[p]);
                }/// if
            }/// for

            for (var pToRemove: number = 0; pToRemove < processToRemove.length; ++pToRemove) {
                var found: boolean = false;
                var pos: number = 0;
                while (pos < Globals._ResidentList.residentList.length && !found) {
                    if (processToRemove[pToRemove].processID === Globals._ResidentList.residentList[pos].processID) {
                        found = true;
                    }/// if
                    else {
                        pos++;
                    }/// else
                }/// while

                Globals._ResidentList.residentList.splice(pos, 1);
            }/// for

            // words.filter(word => word.length > 6);
            Globals._StdOut.putText(`${Globals.INDENT_STRING}Memory Cleared`);
            Globals._StdOut.advanceLine();
        }/// if

        else {
            Globals._StdOut.putText(`${Globals.INDENT_STRING}Cannot clear memory while processes running!`);
            Globals._StdOut.advanceLine();
        }/// else

        Control.updateVisualMemory();
    }/// clearmem

    /// runall - execute all programs at once
    public shellRunAll() {
        /// Check if the resident queue is full or not...
        if (Globals._ResidentList.residentList.length === 0) {
            Globals._StdOut.putText(`${Globals.INDENT_STRING}No process control blocks found.`);
            Globals._StdOut.advanceLine();
        }/// if
        else {
            /// Use interrupt to allow for seemless integration of scheduling
            /// For example:
            ///     > run 0
            ///     ...
            ///     > runall
            /// No matter what order, should still schedule the processes in round robin fashion...
            /// Use Single Step to see what's "really" happening...
            Globals._KernelInterruptPriorityQueue.enqueueInterruptOrPcb(new Interrupt(Globals.RUN_ALL_PROCESSES_IRQ, []));
        }/// else
    }/// runall

    /// ps - display the PID and state of all processes
    public shellPs() {
        Globals._KernelInterruptPriorityQueue.enqueueInterruptOrPcb(new Interrupt(Globals.PS_IRQ, []));
    }///ps

    /// kill <pid> - kills one process (specified by process ID)
    public shellKill(args: string[]) {
        if (args.length === 1) {

            /// Check if the resident queue is full or not...
            if (Globals._ResidentList.residentList.length === 0) {
                Globals._StdOut.putText(`${Globals.INDENT_STRING}No process control blocks found.`);
                Globals._StdOut.advanceLine();
            }/// if
            else {
                /// Use interrupt to allow for seemless integration of scheduling
                /// For example:
                ///     > kill 0
                ///     ...
                ///     > killall
                /// No matter what order, should still kill the processes
                /// Use Single Step to see what's "really" happening...
                Globals._KernelInterruptPriorityQueue.enqueueInterruptOrPcb(new Interrupt(Globals.KILL_PROCESS_IRQ, [args]));
            }/// else
        }/// if

        /// More than one argument was given
        else {
            Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: kill <int> Expected 1 argument, but got ${args.length}`);
            Globals._StdOut.advanceLine();
        }/// else
    }/// kill

    /// killall - kill all processes
    public shellKillAll() {
        Globals._KernelInterruptPriorityQueue.enqueueInterruptOrPcb(new Interrupt(Globals.KILL_ALL_PROCESSES_IRQ, []));
    }/// kill all processes

    /// quantum <int> - let the user set the Round Robin Quantum (measured in CPU cycles)
    public shellQuantum(args: string[]) {
        if (Globals._Scheduler.schedulingMethod !== "Round Robin") {
            Globals._StdOut.putText(`${Globals.INDENT_STRING}Quantum cannot be changed while using ${Globals._Scheduler.schedulingMethod} schheduling!`);
            Globals._StdOut.advanceLine();
            return;
        }/// if

        /// Check for one argmument
        if (args.length === 1) {
            /// Getting and cleansing input
            var trimmedStringQuanta: string = args[0].trim();
            trimmedStringQuanta = trimmedStringQuanta.toUpperCase().replace(/\s/g, '');

            /// Make sure quantum is in positive decimal
            if (/^[0-9]+$/i.test(trimmedStringQuanta)) {

                /// Save old quanta
                var oldDecimalQuanta = Globals._Scheduler.quanta;

                /// Set the new quantum...
                /// New quanta must be a positive integer
                if (parseInt(trimmedStringQuanta, 10) > 0) {
                    /// Could process as interrupt to allow for changing the quantum mid cycle...
                    /// Actually just don't allow it, too much brain damage already...
                    /// interrupt it is
                    Globals._KernelInterruptPriorityQueue.enqueueInterruptOrPcb(new Interrupt(Globals.CHANGE_QUANTUM_IRQ, [oldDecimalQuanta, parseInt(trimmedStringQuanta, 10)]));
                }/// else-if

                /// Invalid Quantum
                else {

                    Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: quantum <int>  Please supply a positive, non-zero, decimal integer only.`);
                    Globals._StdOut.advanceLine();
                }/// else
            }/// if

            /// Error, a character other than [0-9] was detected
            else {
                Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: quantum <int>  Please supply a positive decimal number only.`);
                Globals._StdOut.advanceLine();
            }/// else
        }/// if 

        /// ERROR, More than one argument given
        else {
            Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: quantum <int> Expected 1 arguments, but got ${args.length}`);
            Globals._StdOut.advanceLine();
        }/// else
    }/// shellQuantum

    /*****************************************************************************************************
    iProject4 Commands: 
        Disk Operations
            create <filename>: Create the file [filename] and display a message denoting success or failure
            read <filename>: Read and display the contents of [filename] or display an error if something went wrong
            write <filename> "data": Write data inside the quotes to [filename] and display a message denoting success or failure
            delete <filename>: Remove [filename] from storage and display a message denoting success or failure
            format: Initialize all blocks in all sectors in all tracks and display a message denoting success or failure
            ls: List files currently stored on the disk
            format -quick: initialize the first four bytes of every directory and data block
            format -full: same as quick and also initializes bytes 4-63 in directory and data blocks too.
            ls -l: kists all filenames [even hidden ones] as wella s their size and create date.
        Scheduling
            setSchedule <rr, fcfs, priority> - selects a CPU scheduling algorithm
            getSchedule - returns the current CPU scheduling program
    *****************************************************************************************************/

    /// format -full: same as quick and also initializes bytes 4-63 in directory and data blocks too.
    public shellFormat(args: any) {
        /// No arguments === Normal Format
        /// OR
        /// 1 argument === -quick || -full format
        if (args.length === 0) {
            Globals._KernelInterruptPriorityQueue.enqueueInterruptOrPcb(new Interrupt(Globals.DISK_IRQ, ['format', 'no-arg']));
        }/// if

        else if (args.length === 1) {
            if (args[0] === '-full' || args[0] === '-quick') {
                Globals._KernelInterruptPriorityQueue.enqueueInterruptOrPcb(new Interrupt(Globals.DISK_IRQ, ['format', args[0].toLowerCase()]));
            }/// if

            else {
                Globals._StdOut.putText(`${Globals.INDENT_STRING}Invalid argument: ${args[0]} try instead...`);
                Globals._StdOut.advanceLine();
                Globals._StdOut.putText(`${Globals.INDENT_STRING}${Globals.INDENT_STRING}format`);
                Globals._StdOut.advanceLine();
                Globals._StdOut.putText(`${Globals.INDENT_STRING}${Globals.INDENT_STRING}format -quick`);
                Globals._StdOut.advanceLine();
                Globals._StdOut.putText(`${Globals.INDENT_STRING}${Globals.INDENT_STRING}format -full`);
                Globals._StdOut.advanceLine();
            }/// else
        }/// else-if

        /// Either negative arguments were (imposibly) given
        /// OR more than 1 arg was given, so complain...
        else {
            Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: format <string> Expected 0 or 1 arguments, but got ${args.length}`);
            Globals._StdOut.advanceLine();
        }/// else
    }/// shellFormat

    /// create <filename>: Create the file [filename] and display a message denoting success or failure
    public shellCreate(args: string[]) {
        /// Make sure filename.length <= 60 Bytes
        if (args.length === 1) {

            /// no empty file names
            if (args[0].trim().replace(" ", "").length === 0) {
                Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: create <filename> Expected 1 arguments, but got 0`);
            }/// if

            else {
                /// Prevent swap file names and hidden file names from being used
                if (!args[0].startsWith(`${Globals._krnDiskDriver.hiddenFilePrefix}${Globals._krnDiskDriver.swapFilePrefix}`)) {
                    /// Minus 4 Bytes of the block metadata (containing the pointer and what not)
                    if (args[0].length < Globals.BLOCK_SIZE_LIMIT - Globals.FILE_META_DATA_LENGTH) {
                        Globals._KernelInterruptPriorityQueue.enqueueInterruptOrPcb(new Interrupt(Globals.DISK_IRQ, ['create', args[0]]));
                    }/// if

                    else {
                        Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: create <filename> Expected <= 60 Bytes, but got ${args.length} Bytes`);
                        Globals._StdOut.advanceLine();
                    }/// else
                }/// if

                else {
                    Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: <filename> cannot start with ".!"`);
                    Globals._StdOut.advanceLine();
                }/// else
            }/// else
        }/// if

        /// More than one argument was given
        else {
            Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: create <filename> Expected 1 arguments, but got ${args.length}`);
            Globals._StdOut.advanceLine();
        }/// else
    }/// shelCreate

    /// ls: List files currently stored on the disk
    public shellList(args: any) {
        /// No arguments given so skip hidden files
        if (args.length === 0) {
            /// TODO: create disk interrupt to list files
            Globals._KernelInterruptPriorityQueue.enqueueInterruptOrPcb(new Interrupt(Globals.DISK_IRQ, ['list', 'no-arg']));
        }/// if

        /// Make sure only one argument is given
        else if (args.length === 1) {

            /// Make sure one arg is "-l" for hidden files
            if (args[0] === "-l") {
                /// TODO: create disk interrupt to list files
                Globals._KernelInterruptPriorityQueue.enqueueInterruptOrPcb(new Interrupt(Globals.DISK_IRQ, ['list', args[0]]));
            }/// if

            else {
                Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: ls <-l> Expected 0 or 1 arguments, but got ${args.length}`);
                Globals._StdOut.advanceLine();
            }/// else
        }/// if

        /// More than one argument was given
        else {
            Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: ls <-l> Expected 0 or 1 arguments, but got ${args.length}`);
            Globals._StdOut.advanceLine();
        }/// else
    }/// shellList

    /// read <filename>: Read and display the contents of [filename] or display an error if something went wrong
    public shellRead(args: any) {

        /// Make sure only one argument is given
        if (args.length === 1) {

            /// Create read interrupt
            Globals._KernelInterruptPriorityQueue.enqueueInterruptOrPcb(new Interrupt(Globals.DISK_IRQ, ['read', args[0]]));
        }/// if

        /// More than or less than one argument was given
        else {
            Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: read <filename> Expected 1 argument, but got ${args.length}`);
            Globals._StdOut.advanceLine();
        }/// else
    }/// read

    public shellWrite(args: string[]) {

        /// At least two args were given...
        if (args.length > 1) {
            var fileName = args.shift();

            /// Concatenate list of args into one string separated by spaces...
            var formattedArgs: string = args.join(' ');

            /// Make sure more than one arg was given
            if (formattedArgs.startsWith('"') && formattedArgs.endsWith('"')) {

                /// Not a swap file, safe to write too
                if (!fileName!.startsWith('.!')) {
                    /// Create write interrupt
                    Globals._KernelInterruptPriorityQueue.enqueueInterruptOrPcb(new Interrupt(Globals.DISK_IRQ, ['write', [fileName, formattedArgs.replace(/["]/g, "").trim()]]));
                }/// if

                /// Swap file
                else {
                    Globals._StdOut.putText(`${Globals.INDENT_STRING}Cannot write to a swap file!`);
                }/// else
            }/// if

            /// Text must be in quotes
            else {
                Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: write <filename> <"[text]"> Expected 2 arguments, but got ${args.length}`);
                Globals._StdOut.advanceLine();
            }/// else
        }/// if
        /// More than or less than one argument was given
        else {
            Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: write <filename> <"[text]"> Expected 2 arguments, but got ${args.length}`);
            Globals._StdOut.advanceLine();
        }/// else
    }/// shellWrite

    /// delete <filename>: Remove [filename] from storage
    public shellDelete(args: string[]) {
        /// Make sure only one argument is given
        if (args.length === 1) {

            /// Not a swap file, safe to delete
            if (!args[0].startsWith(`${Globals._krnDiskDriver.hiddenFilePrefix}${Globals._krnDiskDriver.swapFilePrefix}`)) {
                /// Create delete interrupt
                Globals._KernelInterruptPriorityQueue.enqueueInterruptOrPcb(new Interrupt(Globals.DISK_IRQ, ['delete', args[0]]));
            }/// if

            /// Swap file
            else {
                /// TODO: kill process on disk... acgually don't
                Globals._StdOut.putText(`${Globals.INDENT_STRING}Cannot delete swap files!`);
            }/// else
        }/// if

        /// More than or less than one argument was given
        else {
            Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: delete <filename> Expected 1 argument, but got ${args.length}`);
            Globals._StdOut.advanceLine();
        }/// else
    }/// shellDelete

    public shellRecover(args: string[]) {
        if (args.length === 1) {
            var filename: string = args[0].trim().replace(" ", "");

            /// Not a swap file
            if (!filename.startsWith(`${Globals._krnDiskDriver.hiddenFilePrefix}${Globals._krnDiskDriver.swapFilePrefix}`)) {

                /// No interrupt needed as long as no one else but the user is recovering non-swap files...
                Globals._StdOut.putText(`${Globals.INDENT_STRING}${Globals._krnDiskDriver.recoverDirectoryFile(filename)}`);
                Globals._StdOut.advanceLine();
            }/// if

            /// Swap file
            else {
                Globals._StdOut.putText(`${Globals.INDENT_STRING}Cannot recover a swap file!`);
                Globals._StdOut.advanceLine();
            }/// else
        }/// if

        /// More than or less than one argument was given
        else {
            Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: recover <filename> Expected 1 argument, but got ${args.length}`);
            Globals._StdOut.advanceLine();
        }/// else
    }/// shellRecover

    public shellDefrag(args: any) {
        if (args.length === 0) {
            Globals._KernelInterruptPriorityQueue.enqueueInterruptOrPcb(new Interrupt(Globals.DISK_IRQ, ['defrag']));
        }/// else 
        else {
            Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: defrag Expected 0 arguments, but got ${args.length}`);
            Globals._StdOut.advanceLine();
        }/// else
    }/// shellDefrag

    public shellGetSchedule(args: string[]) {
        if (args.length === 0) {
            Globals._StdOut.putText(`${Globals.INDENT_STRING}Current Scheduling Algorithm: ${Globals._Scheduler.schedulingMethod}`);
        }/// if
        else {
            Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: getscedule Expected 0 arguments, but got ${args.length}`);
            Globals._StdOut.advanceLine();
        }/// else
    }///

    public shellSetSchedule(args: string[]) {
        if (args.length === 1) {
            switch (args[0]) {
                case Globals.ROUND_ROBIN:
                    Globals._KernelInterruptPriorityQueue.enqueueInterruptOrPcb(new Interrupt(Globals.SET_SCHEDULE_ALGORITHM, [Globals.ROUND_ROBIN]));
                    break;
                case Globals.FIRST_COME_FIRST_SERVE:
                    Globals._KernelInterruptPriorityQueue.enqueueInterruptOrPcb(new Interrupt(Globals.SET_SCHEDULE_ALGORITHM, [Globals.FIRST_COME_FIRST_SERVE]));
                    break;
                case Globals.PRIORITY:
                    Globals._KernelInterruptPriorityQueue.enqueueInterruptOrPcb(new Interrupt(Globals.SET_SCHEDULE_ALGORITHM, [Globals.PRIORITY]));
                    break;
                default:
                    Globals._StdOut.putText(`${Globals.INDENT_STRING}Invalid Schedulng Algorithm, try:`);
                    Globals._StdOut.advanceLine();
                    Globals._StdOut.putText(`${Globals.INDENT_STRING}${Globals.INDENT_STRING}${Globals.ROUND_ROBIN}`);
                    Globals._StdOut.advanceLine();
                    Globals._StdOut.putText(`${Globals.INDENT_STRING}${Globals.INDENT_STRING}${Globals.FIRST_COME_FIRST_SERVE}`);
                    Globals._StdOut.advanceLine();
                    Globals._StdOut.putText(`${Globals.INDENT_STRING}${Globals.INDENT_STRING}${Globals.PRIORITY}`);
                    Globals._StdOut.advanceLine();
                    break;
            }/// switch
        }/// if
        else {
            Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: setscedule Expected 1 argument, but got ${args.length}`);
            Globals._StdOut.advanceLine();
        }/// else
    }/// shellSetSchedule

    public shellRename(args: string[]) {
        if (args.length === 2) {
            var oldFileName: string = args[0].trim().replace(" ", "");
            var newFileName: string = args[1].trim().replace(" ", "");
            /// no empty file names
            if (oldFileName.length === 0 || newFileName.length === 0) {
                Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: not acceptable file name!`);
            }/// if

            /// Don't allow swap files to be renamed
            if (!oldFileName.startsWith(`${Globals._krnDiskDriver.hiddenFilePrefix}${Globals._krnDiskDriver.swapFilePrefix}`)) {
                var newFileNameInHex: string = Globals._krnDiskDriver.englishToHex(newFileName).toUpperCase();
                /// make sure data is not too big
                if (newFileNameInHex.length < 100) {

                    /// New name is not a swap file name
                    if (!newFileName.startsWith(`${Globals._krnDiskDriver.hiddenFilePrefix}${Globals._krnDiskDriver.swapFilePrefix}`)) {

                        /// Interrupt not necessary, unless anyone other than the user is renaming the file...
                        Globals._StdOut.putText(`${Globals.INDENT_STRING}${Globals._krnDiskDriver.rename(oldFileName, newFileNameInHex)}`);
                        Globals._StdOut.advanceLine();
                    }/// if

                    /// New filename cannot be a swap file name
                    else {
                        Globals._StdOut.putText(`${Globals.INDENT_STRING}New filename cnnot start with${Globals._krnDiskDriver.hiddenFilePrefix}${Globals._krnDiskDriver.swapFilePrefix}`);
                        Globals._StdOut.advanceLine();
                    }/// else
                }/// if

                /// new name too big... No Buffer Overflows here!
                else {
                    Globals._StdOut.putText(`${Globals.INDENT_STRING}New filename is too long!`);
                    Globals._StdOut.advanceLine();
                }/// else

            }/// if

            /// Cannot rename a swap file
            else {
                Globals._StdOut.putText(`${Globals.INDENT_STRING}Cannot rename swap files!`);
                Globals._StdOut.advanceLine();
            }/// else
        }/// if

        else {
            Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: rename <file> <newname> Expected 2 argument, but got ${args.length}`);
            Globals._StdOut.advanceLine();
        }/// else
    }/// shellRename

    /// Kind of a last minute thing...
    public shellCopy(args: string[]) {
        /// Make sure filename.length <= 60 Bytes
        if (args.length === 2) {
            var oldFile = args[0].trim().replace(" ", "");
            var newFile = args[1].trim().replace(" ", "");

            /// no empty file names
            if (oldFile.length === 0 || newFile.length === 0) {
                Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: not acceptable file name!`);
            }/// if

            else {
                /// Prevent swap file names and hidden file names from being used
                if (!oldFile.startsWith(`${Globals._krnDiskDriver.hiddenFilePrefix}${Globals._krnDiskDriver.swapFilePrefix}`) && !newFile.startsWith(`${Globals._krnDiskDriver.hiddenFilePrefix}${Globals._krnDiskDriver.swapFilePrefix}`)) {

                    /// Minus 4 Bytes of the block metadata (containing the pointer and what not)
                    if (args[0].length < Globals.BLOCK_SIZE_LIMIT - Globals.FILE_META_DATA_LENGTH) {
                        Globals._StdOut.putText(`${Globals.INDENT_STRING}${Globals._krnDiskDriver.copyDirectoryFile(oldFile, newFile)}`);
                        Globals._StdOut.advanceLine();
                    }/// if

                    else {
                        Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: copy <filename> Expected <= 60 Bytes, but got ${args.length} Bytes`);
                        Globals._StdOut.advanceLine();
                    }/// else
                }/// if

                else {
                    Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: copy <filename> cannot start with ".!"`);
                    Globals._StdOut.advanceLine();
                }/// else
            }/// else
        }/// if

        /// More than one argument was given
        else {
            Globals._StdOut.putText(`${Globals.INDENT_STRING}Usage: create <filename> Expected 1 arguments, but got ${args.length}`);
            Globals._StdOut.advanceLine();
        }/// else
    }/// shellCopy

    /********************
     * ASCII art for BLM
     ********************/


    public blackLivesMatter() {
        /// I may be a computer scientist... but I'm also a progressive!
        ///
        /// Does this automatically get me a 100?

        /// BLACK
        Globals._StdOut.advanceLine();
        Globals._StdOut.putX(30);
        Globals._StdOut.putText(" ### ");
        Globals._StdOut.putX(90);
        Globals._StdOut.putText(" # ");
        Globals._StdOut.putX(150);
        Globals._StdOut.putText("  ## ");
        Globals._StdOut.putX(225);
        Globals._StdOut.putText(" ## ");
        Globals._StdOut.putX(295);
        Globals._StdOut.putText("#   #");


        Globals._StdOut.advanceLine();
        Globals._StdOut.putX(30);
        Globals._StdOut.putText(" #   #");
        Globals._StdOut.putX(90);
        Globals._StdOut.putText(" # ");
        Globals._StdOut.putX(150);
        Globals._StdOut.putText(" #   #");
        Globals._StdOut.putX(225);
        Globals._StdOut.putText("#  #");
        Globals._StdOut.putX(295);
        Globals._StdOut.putText("#  #");


        Globals._StdOut.advanceLine();
        Globals._StdOut.putX(30);
        Globals._StdOut.putText(" #   #");
        Globals._StdOut.putX(90);
        Globals._StdOut.putText(" # ");
        Globals._StdOut.putX(150);
        Globals._StdOut.putText(" #   # ");
        Globals._StdOut.putX(225);
        Globals._StdOut.putText("#");
        Globals._StdOut.putX(295);
        Globals._StdOut.putText("##  ");


        Globals._StdOut.advanceLine();
        Globals._StdOut.putX(30);
        Globals._StdOut.putText(" ####");
        Globals._StdOut.putX(90);
        Globals._StdOut.putText(" # ");
        Globals._StdOut.putX(150);
        Globals._StdOut.putText(" #### ");
        Globals._StdOut.putX(225);
        Globals._StdOut.putText("#");
        Globals._StdOut.putX(295);
        Globals._StdOut.putText("##  ");


        Globals._StdOut.advanceLine();
        Globals._StdOut.putX(30);
        Globals._StdOut.putText(" #   #");
        Globals._StdOut.putX(90);
        Globals._StdOut.putText(" # ");
        Globals._StdOut.putX(150);
        Globals._StdOut.putText(" #   # ");
        Globals._StdOut.putX(225);
        Globals._StdOut.putText("#");
        Globals._StdOut.putX(295);
        Globals._StdOut.putText("# # ");


        Globals._StdOut.advanceLine();
        Globals._StdOut.putX(30);
        Globals._StdOut.putText(" #   #");
        Globals._StdOut.putX(90);
        Globals._StdOut.putText(" # ");
        Globals._StdOut.putX(150);
        Globals._StdOut.putText(" #   # ");
        Globals._StdOut.putX(225);
        Globals._StdOut.putText("#  #");
        Globals._StdOut.putX(295);
        Globals._StdOut.putText("#  # ");


        Globals._StdOut.advanceLine();
        Globals._StdOut.putX(30);
        Globals._StdOut.putText(" ### ");
        Globals._StdOut.putX(90);
        Globals._StdOut.putText(" #### ");
        Globals._StdOut.putX(150);
        Globals._StdOut.putText(" #   # ");
        Globals._StdOut.putX(225);
        Globals._StdOut.putText(" ## ");
        Globals._StdOut.putX(295);
        Globals._StdOut.putText("#   #");

        Globals._StdOut.advanceLine();

        /// LIVES
        Globals._StdOut.advanceLine();
        Globals._StdOut.putX(30);
        Globals._StdOut.putText(" # ");
        Globals._StdOut.putX(90);
        Globals._StdOut.putText(" ### ");
        Globals._StdOut.putX(150);
        Globals._StdOut.putText("#     # ");
        Globals._StdOut.putX(225);
        Globals._StdOut.putText(" #### ");
        Globals._StdOut.putX(295);
        Globals._StdOut.putText("  ### ");

        Globals._StdOut.advanceLine();
        Globals._StdOut.putX(30);
        Globals._StdOut.putText(" # ");
        Globals._StdOut.putX(90);
        Globals._StdOut.putText("  # ");
        Globals._StdOut.putX(150);
        Globals._StdOut.putText("#     # ");
        Globals._StdOut.putX(225);
        Globals._StdOut.putText(" # ");
        Globals._StdOut.putX(295);
        Globals._StdOut.putText(" # ");

        Globals._StdOut.advanceLine();
        Globals._StdOut.putX(30);
        Globals._StdOut.putText(" # ");
        Globals._StdOut.putX(90);
        Globals._StdOut.putText("  # ");
        Globals._StdOut.putX(150);
        Globals._StdOut.putText("#     # ");
        Globals._StdOut.putX(225);
        Globals._StdOut.putText(" # ");
        Globals._StdOut.putX(295);
        Globals._StdOut.putText(" # ");

        Globals._StdOut.advanceLine();
        Globals._StdOut.putX(30);
        Globals._StdOut.putText(" # ");
        Globals._StdOut.putX(90);
        Globals._StdOut.putText("  # ");
        Globals._StdOut.putX(150);
        Globals._StdOut.putText("#     # ");
        Globals._StdOut.putX(225);
        Globals._StdOut.putText(" ### ");
        Globals._StdOut.putX(295);
        Globals._StdOut.putText("  ## ");

        Globals._StdOut.advanceLine();
        Globals._StdOut.putX(30);
        Globals._StdOut.putText(" # ");
        Globals._StdOut.putX(90);
        Globals._StdOut.putText("  # ");
        Globals._StdOut.putX(150);
        Globals._StdOut.putText("#     # ");
        Globals._StdOut.putX(225);
        Globals._StdOut.putText(" # ");
        Globals._StdOut.putX(295);
        Globals._StdOut.putText("    # ");

        Globals._StdOut.advanceLine();
        Globals._StdOut.putX(30);
        Globals._StdOut.putText(" # ");
        Globals._StdOut.putX(90);
        Globals._StdOut.putText("  # ");
        Globals._StdOut.putX(150);
        Globals._StdOut.putText(" #   # ");
        Globals._StdOut.putX(225);
        Globals._StdOut.putText(" # ");
        Globals._StdOut.putX(295);
        Globals._StdOut.putText("    # ");

        Globals._StdOut.advanceLine();
        Globals._StdOut.putX(30);
        Globals._StdOut.putText(" #### ");
        Globals._StdOut.putX(90);
        Globals._StdOut.putText(" ### ");
        Globals._StdOut.putX(150);
        Globals._StdOut.putText("   #  ");
        Globals._StdOut.putX(225);
        Globals._StdOut.putText(" #### ");
        Globals._StdOut.putX(295);
        Globals._StdOut.putText(" ###  ");
        Globals._StdOut.advanceLine();


        /// MATTER
        Globals._StdOut.advanceLine();
        Globals._StdOut.putX(30);
        Globals._StdOut.putText(" #    # ");
        Globals._StdOut.putX(100);
        Globals._StdOut.putText("  ## ");
        Globals._StdOut.putX(160);
        Globals._StdOut.putText(" ##### ");
        Globals._StdOut.putX(225);
        Globals._StdOut.putText(" ##### ");
        Globals._StdOut.putX(295);
        Globals._StdOut.putText(" #### ");
        Globals._StdOut.putX(365);
        Globals._StdOut.putText(" ###  ");

        Globals._StdOut.advanceLine();
        Globals._StdOut.putX(30);
        Globals._StdOut.putText(" ## ## ");
        Globals._StdOut.putX(100);
        Globals._StdOut.putText(" #   # ");
        Globals._StdOut.putX(160);
        Globals._StdOut.putText("   # ");
        Globals._StdOut.putX(225);
        Globals._StdOut.putText("   # ");
        Globals._StdOut.putX(295);
        Globals._StdOut.putText(" # ");
        Globals._StdOut.putX(365);
        Globals._StdOut.putText(" #  # ");

        Globals._StdOut.advanceLine();
        Globals._StdOut.putX(30);
        Globals._StdOut.putText(" # # # ");
        Globals._StdOut.putX(100);
        Globals._StdOut.putText(" #   # ");
        Globals._StdOut.putX(160);
        Globals._StdOut.putText("   # ");
        Globals._StdOut.putX(225);
        Globals._StdOut.putText("   # ");
        Globals._StdOut.putX(295);
        Globals._StdOut.putText(" # ");
        Globals._StdOut.putX(365);
        Globals._StdOut.putText(" #  # ");

        Globals._StdOut.advanceLine();
        Globals._StdOut.putX(30);
        Globals._StdOut.putText(" # # # ");
        Globals._StdOut.putX(100);
        Globals._StdOut.putText(" #### ");
        Globals._StdOut.putX(160);
        Globals._StdOut.putText("   # ");
        Globals._StdOut.putX(225);
        Globals._StdOut.putText("   # ");
        Globals._StdOut.putX(295);
        Globals._StdOut.putText(" ### ");
        Globals._StdOut.putX(365);
        Globals._StdOut.putText(" ###  ");

        Globals._StdOut.advanceLine();
        Globals._StdOut.putX(30);
        Globals._StdOut.putText(" #   # ");
        Globals._StdOut.putX(100);
        Globals._StdOut.putText(" #   # ");
        Globals._StdOut.putX(160);
        Globals._StdOut.putText("   # ");
        Globals._StdOut.putX(225);
        Globals._StdOut.putText("   # ");
        Globals._StdOut.putX(295);
        Globals._StdOut.putText(" # ");
        Globals._StdOut.putX(365);
        Globals._StdOut.putText(" # #  ");

        Globals._StdOut.advanceLine();
        Globals._StdOut.putX(30);
        Globals._StdOut.putText(" #   # ");
        Globals._StdOut.putX(100);
        Globals._StdOut.putText(" #   # ");
        Globals._StdOut.putX(160);
        Globals._StdOut.putText("   # ");
        Globals._StdOut.putX(225);
        Globals._StdOut.putText("   # ");
        Globals._StdOut.putX(295);
        Globals._StdOut.putText(" # ");
        Globals._StdOut.putX(365);
        Globals._StdOut.putText(" #  # ");

        Globals._StdOut.advanceLine();
        Globals._StdOut.putX(30);
        Globals._StdOut.putText(" #   # ");
        Globals._StdOut.putX(100);
        Globals._StdOut.putText(" #   # ");
        Globals._StdOut.putX(160);
        Globals._StdOut.putText("   # ");
        Globals._StdOut.putX(225);
        Globals._StdOut.putText("   # ");
        Globals._StdOut.putX(295);
        Globals._StdOut.putText(" ####  ");
        Globals._StdOut.putX(365);
        Globals._StdOut.putText(" #  # ");

        /// You gotta admit this is still pretty cool...
        /// OKAY, so now to the ACTUAL porgram
        Globals._StdOut.advanceLine();
        Globals._StdOut.advanceLine();
    }/// blackLivesMatter
}/// class