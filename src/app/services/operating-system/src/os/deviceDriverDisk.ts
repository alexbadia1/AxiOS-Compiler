/* ----------------------------------
   DeviceDriverDisk.ts
   The Kernel Disk Device Driver.
   Few Questions:
        1.) How many bytes should we reserve for"
            ~ The flag?
                -
            ~ The file name?
            ~ File creation date?
            ~ File size?
                - Our disk is 16,000 Bytes or 16 KB, so 2Bytes?
            ~
   ---------------------------------- */

import { Defragment } from "../defragment";
import { Globals } from "../global";
import { Control } from "../host/control";
import { DeviceDriver } from "./deviceDriver";

// Extends DeviceDriver
export class DeviceDriverDisk extends DeviceDriver {
    constructor(
        public hiddenFilePrefix: string = '.',
        public swapFilePrefix: string = '!',
        public idAllocator: IdAllocator = new IdAllocator(),
        public dirBlock: Partition = new Partition(
            'File Header', /// File Entries
            0, 0, 1, /// base = (0, 0, 1)
            0, 7, 7, /// limit = (0, 7, 7)
        ), /// new Directory
        public fileDataBlock: Partition = new Partition(
            'File Body', /// File Data
            1, 0, 0, /// base = (1, 0, 0)
            3, 7, 7, /// limit = (3, 7, 7)
        ),/// new Block
        public formatted: boolean = false,
        public diskBase: string = "000000",
        public diskLimit: string = "030707",
    ) {
        /// Override the base method pointers
        /// The code below cannot run because "this" can only be accessed after calling super.
        /// super(this.krnKbdDriverEntry, this.krnKbdDispatchKeyPress);
        super();
        this.driverEntry = this.krnDiskDriverEntry;
        this.isr = this.krnDiskDispatchFunctions;
    }/// constructor

    public krnDiskDriverEntry() {
        /// Initialization routine for this, the kernel-mode Disk Device Driver.
        this.status = "loaded";
        /// More...?
    }/// krnDiskDriverEntry

    public krnDiskDispatchFunctions(params: any) {
        var result: string = '';
        var diskOperation: string = params[0];
        switch (diskOperation) {
            case 'create':
                /// params[1] = filename
                result = this.create(params[1]);
                break;
            case 'write':
                /// params[1][0] = filename
                /// params[1][1] = file text
                result = this.write(params[1][0], params[1][1]);
                break;
            case 'read':
                /// params[1] = filename
                result = this.read(params[1]);
                break;
            case 'delete':
                /// params[1] = filename
                result = this.deleteFile(params[1]);
                break;
            case 'list':
                /// params[1] = 'no-arg' || params[1] = '-l'
                this.list(params[1]);
                break;
            case 'defrag':
                /// no params
                result = this.defrag();
                break;
            default:
                Globals._Kernel.krnTrace(`Failed to perform disk ${params[0]} operation`);
                Globals._StdOut.putText(`Failed to perform disk ${params[0]} operation`);
                break;
        }/// switch

        /// Show results denoting the success or failure of the driver operation on disk
        if (result !== '') {
            Globals._StdOut.putText(`${result}`);
            Globals._StdOut.advanceLine();
            Globals._OsShell.putPrompt();
        }/// if

        return result;
    }/// krnDiskDispatchFunctions

    ///////////////////////////////
    ////// Format Operations //////
    ///////////////////////////////

    public format(type: string): void {
        var success: boolean = false;
        switch (type) {
            case '-full':
                success = this.fullFormat();
                break;
            case '-quick':
                success = this.quickFormat();
                break;
            case 'no-arg':
                Globals._Disk.init();
                this.formatted = true;
                success = true;
                break;
            default:
                Globals._Kernel.krnTrace(`Failed disk format (Type: ${type.replace('-', '').trim()})`);
                Globals._StdOut.putText(`Cannot perform format (Type: ${type.replace('-', '').trim()})`);
                Globals._StdOut.advanceLine();
                Globals._OsShell.putPrompt();
                break;
        }/// switch 

        if (success) {
            Globals._StdOut.putText(`Hard drive successfully formatted!`);
            Globals._StdOut.advanceLine();
            Globals._OsShell.putPrompt();
        }/// if
        Control.updateVisualDisk();
        // else {
        //     Globals._StdOut.putText(`Failed to format (Type: ${type.replace('-', '').trim()})`);
        //     Globals._StdOut.advanceLine();
        //     Globals._OsShell.putPrompt();
        // }// else
    }/// format

    private fullFormat(): boolean {
        if (this.formatted) {
            /// Same as Disk.init() except skip the master boot record
            for (var trackNum: number = 0; trackNum < Globals.TRACK_LIMIT; ++trackNum) {
                for (var sectorNum: number = 0; sectorNum < Globals.SECTOR_LIMIT; ++sectorNum) {
                    for (var blockNum: number = 0; blockNum < Globals.BLOCK_LIMIT; ++blockNum) {
                        Globals._Disk.createSessionBlock(trackNum, sectorNum, blockNum);
                    }/// for
                }/// for
            }/// for
            Globals._Kernel.krnTrace(`Disk formatted (Type: Full Format)`);

            /// Reclaim all ID's
            this.idAllocator = new IdAllocator();
            this.formatted = true;
            return true;
        }/// if
        else {
            Globals._Kernel.krnTrace(`Failed disk format (Type: Full Format), missing master boot record`);
            Globals._StdOut.putText(`Full Format can only be used to REFORMAT the drive, please initially format the drive.`);
            Globals._StdOut.advanceLine();
            Globals._OsShell.putPrompt();
            return false;
        }/// else
    }/// fullFormat

    private quickFormat(): boolean {
        /// Disk must be "fully" formatted first, otherwise, the rest of the 4-63 bytes 
        /// of data could possibly be null if '-quick' format is called as the "first" format...
        if (this.formatted) {
            /// Change the first four bytes back to 00's
            for (var trackNum: number = 0; trackNum < Globals.TRACK_LIMIT; ++trackNum) {
                for (var sectorNum: number = 0; sectorNum < Globals.SECTOR_LIMIT; ++sectorNum) {
                    for (var blockNum: number = 0; blockNum < Globals.BLOCK_LIMIT; ++blockNum) {

                        var currentKey: string =
                            `${Control.formatToHexWithPadding(trackNum)}${Control.formatToHexWithPadding(sectorNum)}${Control.formatToHexWithPadding(blockNum)}`;

                        /// Skip already quick formatted blocks
                        if (sessionStorage.getItem(currentKey)!.substring(0, 8) === "00000000") {
                            continue;
                        }/// if

                        /// Skip master boot record
                        if (trackNum === 0 && sectorNum === 0 && blockNum === 0) {
                            continue;
                        }///if

                        /// Reset the first 8 nums to zero
                        else {
                            /// Get session value
                            var value: string | null = sessionStorage.getItem(currentKey);

                            /// Replace the first 4 bytes (8 characters) with 00's
                            value = "8000" + Globals.BLOCK_NULL_POINTER + value!.substring(10, value!.length);

                            /// Write the change back to the list
                            sessionStorage.setItem(currentKey, value);
                        }/// else
                    }/// for
                }/// for
            }/// for
            /// Reclaim all ID's
            this.idAllocator = new IdAllocator();
            Globals._Kernel.krnTrace(`Disk formatted (Type: Quick Format)`);
            this.formatted = true;
            return true;
        }/// if

        else {
            Globals._Kernel.krnTrace(`Failed disk format (Type: Quick Format), missing master boot record`);
            Globals._StdOut.putText(`Quick Format can only be used to REFORMAT the drive, please initially format the drive.`);
            Globals._StdOut.advanceLine();
            Globals._OsShell.putPrompt();
            return false;
        }/// else
    }/// quickFormat

    public create(fileName: string = ''): string {
        var msg: string = 'File creation failed';

        /// File does not exist, nice...
        if (this.fileNameExists(fileName) === '') {

            /// Request a unique ID from the ID manager
            var newFileID = this.idAllocator.allocatePositiveID();

            /// File ID request successful, okay we're getting somwhere
            if (newFileID != -1) {

                /// Find a free space, null if there are no available blocks O(n)
                var availableDirKey = this.getFirstAvailableBlockFromDirectoryPartition();

                /// Free space found in directory
                if (availableDirKey != null) {

                    /// Find a free space, null if there are no available blocks O(n)
                    var availableFileDataKey = this.getFirstAvailableBlockFromDataPartition();

                    /// Free space found in data partition
                    if (availableFileDataKey != null) {

                        /// Preserve and deleted files being overwritten for later recovery
                        if (parseInt(this.getBlockFlag(availableDirKey), 16) > Globals.NEGATIVE_ZERO) {
                            this.preserveFileIntegrity(availableDirKey);
                        }/// if

                        if (parseInt(this.getBlockFlag(availableDirKey), 16) > Globals.NEGATIVE_ZERO) {
                            this.preserveFileIntegrity(availableFileDataKey);
                        }/// if

                        /// Write a directory entry for file
                        var fileNameInHex: string = this.englishToHex(fileName).toUpperCase();
                        var paddedFileNameInHex = fileNameInHex + this.dirBlock.defaultDirectoryBlockZeros.substring(fileNameInHex.length);
                        var newFileIDString: string = Control.formatToHexWithPaddingTwoBytes(newFileID);
                        this.setBlockFlag(availableDirKey, newFileIDString);
                        this.setBlockForwardPointer(availableDirKey, availableFileDataKey);
                        this.setBlockDate(availableDirKey, Control.formatToHexWithPaddingSevenBytes(Globals._Kernel.getCurrentDateTime()));
                        this.setBlockSize(availableDirKey, '0080'); /// 128 in hexadecimal
                        this.setDirectoryBlockData(availableDirKey, paddedFileNameInHex);

                        /// Reserve the first data block for file and overwrite with 00's
                        this.setBlockFlag(availableFileDataKey, newFileIDString);
                        this.setDataBlockData(availableFileDataKey, this.dirBlock.defaultDataBlockZeros);
                        this.setBlockForwardPointer(availableFileDataKey, availableDirKey);

                        Globals._Kernel.krnTrace('File sucessfully created!');
                        Control.updateVisualDisk();
                        msg = `C:\\AXIOS\\${fileName} sucessfully created!`;
                    }/// if

                    /// No space in data partition
                    else {
                        Globals._Kernel.krnTrace(`Cannot create C:\\AXIOS\\${fileName}, all file data blocks are in use!`);
                        msg = `Cannot create C:\\AXIOS\\${fileName}, all file data blocks are in use!`;
                    }/// else
                }/// if

                /// No space in directory
                else {
                    Globals._Kernel.krnTrace(`Cannot create C:\\AXIOS\\${fileName}, all file header blocks are in use!`);
                    msg = `Cannot create C:\\AXIOS\\${fileName}, all file header blocks are in use!`;
                }/// else
            }/// if

            /// Ran out of file ID's
            else {
                Globals._Kernel.krnTrace(`Cannot create C:\\AXIOS\\${fileName}, ran out of ID's to allocate!`);
                msg = `Cannot create C:\\AXIOS\\${fileName}, ran out of ID's to allocate!`;
            }/// else
        }/// if

        /// File already exists
        else {
            Globals._Kernel.krnTrace(`Cannot create C:\\AXIOS\\${fileName}, filename is already in use!`);
            msg = `Cannot create C:\\AXIOS\\${fileName}, filename already in use!`;
        }/// else

        return msg;
    }/// create

    public rename(oldFileName: string, newFileNameInHex: string) {
        var targetFileKey = this.fileNameExists(oldFileName);

        /// File found
        if (targetFileKey !== '') {
            var paddedFileNameInHex = newFileNameInHex + this.dirBlock.defaultDirectoryBlockZeros.substring(newFileNameInHex.length);
            this.setDirectoryBlockData(targetFileKey, paddedFileNameInHex);
        }/// if

        else {
            return `Cannot rename ${oldFileName}`;
        }/// else

        Control.updateVisualDisk();
        return `${oldFileName} renamed to ${this.hexToEnglish(newFileNameInHex)}`;
    }/// rename

    public list(type: string): void {
        var isEmpty: boolean = true;
        Globals._StdOut.advanceLine();
        /// Iterate through the directory portion of the list and print out based on the argument passed
        for (var trackNum: number = this.dirBlock.baseTrack; trackNum <= this.dirBlock.limitTrack; ++trackNum) {
            for (var sectorNum: number = this.dirBlock.baseSector; sectorNum <= this.dirBlock.limitSector; ++sectorNum) {
                for (var blockNum: number = this.dirBlock.baseBlock; blockNum <= this.dirBlock.limitBlock; ++blockNum) {
                    var currentKey: string = `${Control.formatToHexWithPadding(trackNum)}${Control.formatToHexWithPadding(sectorNum)}${Control.formatToHexWithPadding(blockNum)}`;
                    if (!this.isAvailable(currentKey)) {
                        var fileName: string = this.hexToEnglish(this.getDirectoryBlockData(currentKey));
                        var fileFlag: number = parseInt(this.getBlockFlag(currentKey));
                        var fileSize: number = parseInt(this.getBlockSize(currentKey), 16);
                        var fileSizeSuffix = '';
                        var fileDate: string = this.getBlockDate(currentKey);
                        var hours: string = '01';
                        var suffix: string = '';

                        /// Formatting the date
                        if (!Globals._TwentyFourHourClock) {
                            hours = parseInt(fileDate.substring(8, 10), 16) === 24 ?
                                (parseInt(fileDate.substring(8, 10), 16) / 24).toString()
                                : (parseInt(fileDate.substring(8, 10), 16) % 12).toString();
                            suffix = parseInt(fileDate.substring(8, 10), 16) > 12 ? ' PM' : ' AM';
                        }/// if

                        else {
                            hours = parseInt(fileDate.substring(8, 10), 16).toString();
                        }/// else
                        fileDate =
                            parseInt(fileDate.substring(0, 2), 16).toString().padStart(2, '0') + /// Month
                            "/" + parseInt(fileDate.substring(2, 4), 16).toString() + /// Day
                            "/" + parseInt(fileDate.substring(4, 8), 16).toString() + /// year
                            " " + hours + /// hours
                            ":" + parseInt(fileDate.substring(10, 12), 16).toString().padStart(2, '0') + /// Minutes
                            ":" + parseInt(fileDate.substring(12, 14), 16).toString().padStart(2, '0') + /// seconds
                            suffix;

                        /// Formatting file size
                        if (fileSize < 1_000) {
                            fileSizeSuffix = ' Bytes';
                        }/// if

                        else if (fileSize < 1_000_000) {
                            fileSizeSuffix = ' KB'
                        }/// else if

                        else if (fileSize < 1_000_000_000) {
                            fileSizeSuffix = ' MB';
                        }/// else-if

                        else if (fileSize < 1_000_000_000_000) {
                            fileSizeSuffix = ' GB';
                        }/// else-if

                        else {
                            fileSizeSuffix = ' TB';

                            /// More...? PB?
                        }/// else


                        /// Only print out hidden file if type is '-l'
                        if (fileName.startsWith(`${this.hiddenFilePrefix}`) && type === '-l' && fileFlag < Globals.NEGATIVE_ZERO) {
                            /// Print out file name
                            ///: Globals._StdOut.putText(`${Globals.INDENT_STRING}${Globals.INDENT_STRING}${sessionStorage.getItem(currentKey).substring(8)}.txt`);
                            Globals._StdOut.putText(`${Globals.INDENT_STRING}${Globals.INDENT_STRING}${fileName}${Globals.INDENT_STRING}${fileDate}${Globals.INDENT_STRING}${fileSize}${fileSizeSuffix}`);
                            Globals._StdOut.advanceLine();
                            isEmpty = false;
                        }/// if

                        else if (!fileName.startsWith(`${this.hiddenFilePrefix}`) && fileFlag < Globals.NEGATIVE_ZERO) {
                            Globals._StdOut.putText(`${Globals.INDENT_STRING}${Globals.INDENT_STRING}${fileName}${Globals.INDENT_STRING}${fileDate}${Globals.INDENT_STRING}${fileSize}${fileSizeSuffix}`);
                            Globals._StdOut.advanceLine();
                            isEmpty = false;
                        }/// if
                    }/// if
                }/// for
            }/// for
        }/// for

        if (isEmpty) {
            Globals._StdOut.putText(`  No files found`);
            Globals._StdOut.advanceLine();
        }/// if
        Globals._OsShell.putPrompt();
    }/// list

    public read(fileName: string): string {
        var isSwapFile: boolean = this.isSwapFile(fileName);
        var targetFileKey = this.fileNameExists(fileName);

        /// File found
        if (targetFileKey !== '') {
            // Globals._StdOut.advanceLine();
            // Globals._StdOut.putText(`File Location: ${targetFileKey}`);
            // Globals._StdOut.advanceLine();
            // Globals._StdOut.putText(`File Flag/ID: ${parseInt(this.getBlockFlag(targetFileKey), 16)}`);
            // Globals._StdOut.advanceLine();
            // Globals._StdOut.putText(`File Header Data: ${sessionStorage.getItem(targetFileKey)}`);
            // Globals._StdOut.advanceLine();
            var fileContents: string = '';

            /// Start at first file block
            var currentPointer: string = this.getBlockForwardPointer(targetFileKey);

            /// Keep following the links from block to block until the end of the file
            while (currentPointer !== targetFileKey) {
                /// Since i haven't made the table yet...
                // Globals._StdOut.advanceLine();
                // Globals._StdOut.putText(`Location: ${currentPointer}`);
                // Globals._StdOut.advanceLine();
                // Globals._StdOut.putText(`Session Storage: ${sessionStorage.getItem(currentPointer)}`);
                // Globals._StdOut.advanceLine();
                // Globals._StdOut.putText(`Forward Pointer: ${this.getBlockForwardPointer(currentPointer)}`);
                // Globals._StdOut.advanceLine();
                // Globals._OsShell.putPrompt();

                /// Translate non-swap files only
                fileContents += isSwapFile ? this.getDataBlockData(currentPointer) : this.hexToEnglish(this.getDataBlockData(currentPointer));

                /// get next block
                currentPointer = this.getBlockForwardPointer(currentPointer);
            }/// while
            return fileContents;
        }/// if

        /// File does not exist
        else {
            return `Cannot access C:\\AXIOS\\${fileName}`;
            /// return `Cannot access C:\\AXIOS\\${fileName}.${isSwapFile ? 'txt' : 'swp'}`;
        }/// else 
    }/// read

    public write(fileName: string, data: string): string {
        var dataInHex: string = data;

        /// Translate non-swap files into hex
        if (!this.isSwapFile(fileName)) {
            dataInHex = this.englishToHex(data).toUpperCase();
        }/// if

        /// See if file exists again...
        var targetFileKey = this.fileNameExists(fileName);

        if (targetFileKey !== '') {
            var freeSpaceKeys: string[] = [];
            var moreSpaceFound: boolean = false;
            var fileID: number = parseInt(this.getBlockFlag(targetFileKey), 16);
            var currentSize = 0;
            var fileSize = parseInt(this.getBlockSize(targetFileKey), 16);
            var chunks: string[] = dataInHex.match(new RegExp('.{1,' + (2 * Globals.DATA_BLOCK_DATA_LIMIT) + '}', 'g'))!;
            var needMoreSpace: boolean = false;

            if ((fileSize - 64) / 64 < chunks.length) {
                needMoreSpace = true;
            }/// if

            // Globals._StdOut.putText(`Need more space: ${(fileSize - 64) / 64 >= chunks.length}`);
            if (needMoreSpace) {
                freeSpaceKeys = this.getAvailableBlocksFromDataPartition(chunks.length)!;
                if (freeSpaceKeys != null) {
                    moreSpaceFound = true;
                }/// if
            }/// if

            /// Set previous key to first data block in file
            var currentOverwriteBlockKey = '';

            if (!needMoreSpace || (needMoreSpace && moreSpaceFound)) {
                /// Begin overwritting the document
                /// Set previous key to first data block in file
                var previousBlockKey = targetFileKey;

                while (chunks.length > 0 && currentSize < fileSize - 64) {
                    /// Grab next free block
                    currentOverwriteBlockKey = this.getBlockForwardPointer(previousBlockKey);

                    /// Grab next free chunk and add right hand padding
                    var currentPaddedChunk: string = chunks.shift()!.padEnd(Globals.DATA_BLOCK_DATA_LIMIT * 2, '0');

                    /// Set previous block to point to this current free block
                    /// Don't forget the previous block is now "in use" as well
                    this.setBlockForwardPointer(previousBlockKey, currentOverwriteBlockKey);
                    this.setBlockFlag(previousBlockKey, Control.formatToHexWithPaddingTwoBytes(fileID));

                    /// Fill the currentBlock with the user data
                    /// Don't forget the current block is now "in use" as well
                    this.setDataBlockData(currentOverwriteBlockKey, this.dirBlock.defaultDataBlockZeros);
                    this.setDataBlockData(currentOverwriteBlockKey, currentPaddedChunk);
                    this.setBlockFlag(currentOverwriteBlockKey, Control.formatToHexWithPaddingTwoBytes(fileID));

                    /// Update the previous block
                    previousBlockKey = currentOverwriteBlockKey;

                    currentSize += 64;
                }/// while

                /// Pick up where I left off overwritting the file and mark the rest of the file as available
                var previousBlockKeyContinued = currentOverwriteBlockKey;
                var temp = currentSize;
                while (temp < fileSize - 64) {
                    /// Grab next free block
                    var tempCurrentOverwriteBlockKey = this.getBlockForwardPointer(previousBlockKeyContinued);

                    /// I will be damned if this works...
                    this.setBlockForwardPointer(previousBlockKeyContinued, Globals.BLOCK_NULL_POINTER);
                    this.setBlockFlag(tempCurrentOverwriteBlockKey, Control.formatToHexWithPaddingTwoBytes(Globals.NEGATIVE_ZERO));
                    this.setDataBlockData(tempCurrentOverwriteBlockKey, this.dirBlock.defaultDataBlockZeros);
                    Control.hostLog(`Reclaimed block ${tempCurrentOverwriteBlockKey}, set flag to ${Control.formatToHexWithPaddingTwoBytes(Globals.NEGATIVE_ZERO)}`);
                    // Globals._StdOut.putText(`Updated block ${tempCurrentOverwriteBlockKey} flag to ${Control.formatToHexWithPaddingTwoBytes(NEGATIVE_ZERO)}`);
                    // Globals._StdOut.advanceLine();

                    previousBlockKeyContinued = tempCurrentOverwriteBlockKey;

                    temp += 64;
                }/// while
                if (temp === fileSize - 64) {
                    this.setBlockForwardPointer(previousBlockKeyContinued, Globals.BLOCK_NULL_POINTER);
                }/// if


                if (chunks.length === 0) {
                    this.setBlockForwardPointer(currentOverwriteBlockKey, targetFileKey);
                    this.setBlockSize(targetFileKey, Control.formatToHexWithPaddingTwoBytes(currentSize + 64));
                    Control.updateVisualDisk();
                    return (`Wrote to: C:\\AXIOS\\${fileName}`);
                }/// if
            }/// if

            if (moreSpaceFound) {
                /// Find the required number of blocks needed
                var previousBlockKey = currentOverwriteBlockKey;

                while (chunks.length > 0) {
                    /// Grab next free block
                    var currentBlockKey: string = freeSpaceKeys.shift()!;

                    if (parseInt(this.getBlockFlag(currentBlockKey), 16) > Globals.NEGATIVE_ZERO) {
                        this.preserveFileIntegrity(currentBlockKey);
                    }/// if

                    /// Grab next free chunk
                    /// Add right hand padding
                    var currentPaddedChunk: string = chunks.shift()!.padEnd(Globals.DATA_BLOCK_DATA_LIMIT * 2, '0');

                    /// Set previous block to point to this current free block
                    /// Don't forget the previous block is now "in use" as well
                    this.setBlockForwardPointer(previousBlockKey, currentBlockKey);
                    this.setBlockFlag(previousBlockKey, Control.formatToHexWithPaddingTwoBytes(fileID))

                    /// Fill the currentBlock with the user data
                    /// Don't forget the current block is now "in use" as well
                    this.setDataBlockData(currentBlockKey, this.dirBlock.defaultDataBlockZeros);
                    this.setDataBlockData(currentBlockKey, currentPaddedChunk);
                    this.setBlockFlag(currentBlockKey, Control.formatToHexWithPaddingTwoBytes(fileID));

                    /// Update the previous block
                    previousBlockKey = currentBlockKey;

                    currentSize += 64;
                }/// while

                if (chunks.length === 0) {
                    this.setBlockForwardPointer(currentBlockKey!, targetFileKey);
                    this.setBlockSize(targetFileKey, Control.formatToHexWithPaddingTwoBytes(currentSize + 64));
                    Control.updateVisualDisk();
                    return (`Wrote to: C:\\AXIOS\\${fileName}`);
                }/// if
            }/// if
            return `Cannot write to C:\\AXIOS\\${fileName}, not enough file data blocks available!`;
        }/// if

        /// File not found
        else {
            return `Cannot write to C:\\AXIOS\\${fileName}, file not found!`;
        }/// else
    }/// write

    public deleteFile(fileName: string): string {
        /// See if file exists...
        /// If Not:
        ///     targetFileKey === ''
        /// If Exists
        ///     targetFileKey === the sessionStorage() Key
        var targetFileKey = this.fileNameExists(fileName);
        var isSwapFile = fileName.startsWith(`${this.hiddenFilePrefix}${this.swapFilePrefix}`);
        /// File found
        if (targetFileKey !== '') {
            var msg: string = '';

            /// Find where file content starts...
            var currentPointer: string = this.getBlockForwardPointer(targetFileKey);

            /// Request for a deleted file ID
            var deletedFileID: any = isSwapFile ? -1 : this.idAllocator.allocateNegativeID();

            /// Recover the positive ID
            this.idAllocator.deallocatePositiveID(parseInt(this.getBlockFlag(targetFileKey), 16));

            // Globals._StdOut.putText(`Recovered ID: ${parseInt(this.getBlockFlag(targetFileKey), 16)}`);
            // Globals._StdOut.advanceLine();

            /// Deleted file ID successfully allocated
            if (deletedFileID != -1) {
                msg = `Deleted C:\\AXIOS\\${fileName}`;
                deletedFileID = Control.formatToHexWithPaddingTwoBytes(deletedFileID);
            }/// if

            /// Ran out of deleted file ID's
            else {
                msg = `Deleted C:\\AXIOS\\${fileName}`;
                deletedFileID = Control.formatToHexWithPaddingTwoBytes(Globals.NEGATIVE_ZERO);
            }/// else

            /// "Delete" by making the directory block available, hopefully this will
            /// make recovering the files easier or at least partial recovery...
            this.setBlockFlag(targetFileKey, deletedFileID);

            /// Keep following the links from block to block until the end of the file
            while (currentPointer != targetFileKey) {

                /// Make current block available
                this.setBlockFlag(currentPointer, deletedFileID);

                if (deletedFileID === -1) {
                    this.setDataBlockData(currentPointer, this.dirBlock.defaultDataBlockZeros);
                }/// if

                /// Get next block
                currentPointer = this.getBlockForwardPointer(currentPointer);
            }/// while
            Control.updateVisualDisk();
            return msg;
        }/// if

        /// File NOT found
        else {
            Globals._Kernel.krnTrace(`Cannot delete C:\\AXIOS\\${fileName}`);
            return `Cannot delete C:\\AXIOS\\${fileName}`;
        }/// else
    }/// delete

    /// Last minute sorry
    public copyDirectoryFile(filename: string, copyFilename: string) {
        /// Search for deleted file in directory
        var targetFileKey: string = this.fileNameExists(filename);

        var copyFileNameKey: string = this.fileNameExists(copyFileNameKey!);

        /// File found
        if (targetFileKey !== '' && copyFileNameKey === '') {
            var success = this.create(copyFilename);

            if (!success.startsWith('Cannot create')) {
                var content: string = this.read(filename);

                // Globals._StdOut.putText(`${content}`);
                // Globals._StdOut.advanceLine();
                if (!content.startsWith('Cannot access') && content.trim().replace(' ', '').length !== 0) {
                    if (!this.write(copyFilename, content).startsWith('Cannot write'))
                        return `Copied ${filename} to ${copyFilename}`;
                    else
                        return `Copied ${filename}, but no space to copy contents`;
                }/// if

                else {
                    return `Copied ${filename} to ${copyFilename}`;
                }
            }/// if

            else {
                return `Cannot copy ${filename}`;
            }/// else
        }/// if

        /// File not found
        else {
            return `Cannot copy ${filename}, not found`;
        }/// else
    }/// copyDirectoryFile

    /// Hopefully no infinite loops
    public recoverDirectoryFile(deletedFileName: string) {
        /// Search for deleted file in directory
        var targetFileKey: string = this.deletedFileNameExists(deletedFileName);

        /// File found
        if (targetFileKey !== '') {

            /// Request new ID
            var newID: number = this.idAllocator.allocatePositiveID();

            /// Got Positive ID 
            if (newID !== -1) {

                /// Formatted id in hex
                var formattedNewIdInHex: string = Control.formatToHexWithPaddingTwoBytes(newID);

                /// Recover negative ID
                this.idAllocator.deallocateNegativeID(parseInt(this.getBlockFlag(targetFileKey), 16));

                /// Don't forget to update the file entry flag
                this.setBlockFlag(targetFileKey, formattedNewIdInHex);

                /// Start at first file block
                var currentPointer: string = this.getBlockForwardPointer(targetFileKey);

                /// Iterate through the file and change flags to new ID
                while (currentPointer !== targetFileKey) {

                    /// Change flags to new ID
                    this.setBlockFlag(currentPointer, formattedNewIdInHex);

                    /// get next block
                    currentPointer = this.getBlockForwardPointer(currentPointer);
                }/// while

                /// Change filename to avoid duplicates
                var defaultFileNameInHex: string = this.englishToHex(`undeleted-${newID}`);
                var defaultFileNameWithPadding: string = defaultFileNameInHex + this.dirBlock.defaultDirectoryBlockZeros.substring(defaultFileNameInHex.length);
                this.setDirectoryBlockData(targetFileKey, defaultFileNameWithPadding);

                Control.updateVisualDisk();
                return `Recovered file ${deletedFileName}, now called: "undeleted-${newID}". `;
            }/// if

            /// Ran out of ID's
            else {
                return `Cannot recover ${deletedFileName}, ran out of IDs!`;
            }/// else
        }/// if

        /// File not found
        else {
            return `Cannot recover ${deletedFileName}`;
        }/// else
    }/// recover

    // public recoverOrphans() {}

    public getFirstAvailableBlockFromDataPartition(): string | null{
        var firstDeletedBlock: string | null = null;
        /// Only need to search the "file data" portion of the disk
        for (var trackNum: number = this.fileDataBlock.baseTrack; trackNum <= this.fileDataBlock.limitTrack; ++trackNum) {
            for (var sectorNum: number = this.fileDataBlock.baseSector; sectorNum <= this.fileDataBlock.limitSector; ++sectorNum) {
                for (var blockNum: number = this.fileDataBlock.baseBlock; blockNum <= this.fileDataBlock.limitBlock; ++blockNum) {
                    var currentKey: string = `${Control.formatToHexWithPadding(trackNum)}${Control.formatToHexWithPadding(sectorNum)}${Control.formatToHexWithPadding(blockNum)}`;
                    if (this.isAvailable(currentKey)) {
                        return currentKey;
                    }/// if
                    if (firstDeletedBlock === null && parseInt(this.getBlockFlag(currentKey), 16) > Globals.NEGATIVE_ZERO) {
                        firstDeletedBlock = currentKey;
                    }/// if
                }/// for
            }/// for
        }/// for
        if (firstDeletedBlock != null) {
            return firstDeletedBlock;
        }/// if 
        else {
            return null;
        }/// else
    }/// getFirstAvailableBlockFromDataPartition

    public getFirstAvailableBlockFromDirectoryPartition() {
        var firstDeletedBlock: string | null = null;
        /// Only need to search the "file header" portion of the disk
        for (var trackNum: number = this.dirBlock.baseTrack; trackNum <= this.dirBlock.limitTrack; ++trackNum) {
            for (var sectorNum: number = this.dirBlock.baseSector; sectorNum <= this.dirBlock.limitSector; ++sectorNum) {
                for (var blockNum: number = this.dirBlock.baseBlock; blockNum <= this.dirBlock.limitBlock; ++blockNum) {
                    var currentKey: string = `${Control.formatToHexWithPadding(trackNum)}${Control.formatToHexWithPadding(sectorNum)}${Control.formatToHexWithPadding(blockNum)}`;
                    if (this.isAvailable(currentKey)) {
                        return currentKey;
                    }/// if
                    if (firstDeletedBlock === null && parseInt(this.getBlockFlag(currentKey), 16) > Globals.NEGATIVE_ZERO) {
                        firstDeletedBlock = currentKey;
                    }/// if
                }/// for
            }/// for
        }/// for
        if (firstDeletedBlock != null) {
            return firstDeletedBlock;
        }/// if 
        else {
            return null;
        }/// else
    }/// getFirstAvailableBlockFromDirectoryPartition

    public getAvailableBlocksFromDirectoryPartition(numBlocksNeeded: number): string[] | null {
        var availableBlocks: string[] = [];
        var availableDeletedBlocks: string[] = [];
        for (var trackNum: number = this.dirBlock.baseTrack; trackNum <= this.dirBlock.limitTrack; ++trackNum) {
            for (var sectorNum: number = this.dirBlock.baseSector; sectorNum <= this.dirBlock.limitSector; ++sectorNum) {
                for (var blockNum: number = this.dirBlock.baseBlock; blockNum <= this.dirBlock.limitBlock; ++blockNum) {
                    var currentKey: string = `${Control.formatToHexWithPadding(trackNum)}${Control.formatToHexWithPadding(sectorNum)}${Control.formatToHexWithPadding(blockNum)}`;
                    if (this.isAvailable(currentKey)) {
                        availableBlocks.push(currentKey);
                    }/// if
                    else if (parseInt(this.getBlockFlag(currentKey), 16) > Globals.NEGATIVE_ZERO) {
                        availableDeletedBlocks.push(currentKey);
                    }/// if
                }/// for
            }/// for
        }/// for
        if (availableBlocks.length >= numBlocksNeeded) {
            return availableBlocks;
        }/// if

        else {
            if (availableBlocks.length + availableDeletedBlocks.length >= numBlocksNeeded) {
                while (availableDeletedBlocks.length > 0) {
                    availableBlocks.push(availableDeletedBlocks.shift()!);
                }/// for
                return availableBlocks;
            }/// if

            else {
                return null;
            }/// else
        }/// else
    }/// getAvailableBlocksFromDirectoryPartition


    public getAvailableBlocksFromDataPartition(numBlocksNeeded: number): string[] | null{
        var availableBlocks: string[] = [];
        var availableDeletedBlocks: string[] = [];

        /// Only need to search the "file data" portion of the disk
        for (var trackNum: number = this.fileDataBlock.baseTrack; trackNum <= this.fileDataBlock.limitTrack; ++trackNum) {
            for (var sectorNum: number = this.fileDataBlock.baseSector; sectorNum <= this.fileDataBlock.limitSector; ++sectorNum) {
                for (var blockNum: number = this.fileDataBlock.baseBlock; blockNum <= this.fileDataBlock.limitBlock; ++blockNum) {
                    var currentKey: string = `${Control.formatToHexWithPadding(trackNum)}${Control.formatToHexWithPadding(sectorNum)}${Control.formatToHexWithPadding(blockNum)}`;
                    if (this.isAvailable(currentKey)) {
                        availableBlocks.push(currentKey);
                    }/// if
                    else if (parseInt(this.getBlockFlag(currentKey), 16) > Globals.NEGATIVE_ZERO) {
                        availableDeletedBlocks.push(currentKey);
                    }/// if
                }/// for
            }/// for
        }/// for

        if (availableBlocks.length >= numBlocksNeeded) {
            return availableBlocks;
        }/// if

        else {
            if (availableBlocks.length + availableDeletedBlocks.length >= numBlocksNeeded) {
                while (availableDeletedBlocks.length > 0) {
                    availableBlocks.push(availableDeletedBlocks.shift()!);
                }/// for
                return availableBlocks;
            }/// if

            else {
                return null;
            }/// else
        }/// else
    }/// getAvailableBlocksFromDataPartition

    public fileNameExists(targetFileNameInEnglish: string): string {
        /// Only need to search the "file names" portion of the disk
        for (var trackNum: number = this.dirBlock.baseTrack; trackNum <= this.dirBlock.limitTrack; ++trackNum) {
            for (var sectorNum: number = this.dirBlock.baseSector; sectorNum <= this.dirBlock.limitSector; ++sectorNum) {
                for (var blockNum: number = this.dirBlock.baseBlock; blockNum <= this.dirBlock.limitBlock; ++blockNum) {
                    var currentKey: string = `${Control.formatToHexWithPadding(trackNum)}${Control.formatToHexWithPadding(sectorNum)}${Control.formatToHexWithPadding(blockNum)}`;
                    if (this.hexToEnglish(this.getDirectoryBlockData(currentKey)) === targetFileNameInEnglish && parseInt(this.getBlockFlag(currentKey), 16) < Globals.NEGATIVE_ZERO) {
                        return currentKey;
                    }/// if
                }/// for
            }/// for
        }/// for
        return '';
    }/// searchDirectory

    public deletedFileNameExists(targetFileNameInEnglish: string): string {
        /// Only need to search the "file names" portion of the disk
        for (var trackNum: number = this.dirBlock.baseTrack; trackNum <= this.dirBlock.limitTrack; ++trackNum) {
            for (var sectorNum: number = this.dirBlock.baseSector; sectorNum <= this.dirBlock.limitSector; ++sectorNum) {
                for (var blockNum: number = this.dirBlock.baseBlock; blockNum <= this.dirBlock.limitBlock; ++blockNum) {
                    var currentKey: string = `${Control.formatToHexWithPadding(trackNum)}${Control.formatToHexWithPadding(sectorNum)}${Control.formatToHexWithPadding(blockNum)}`;
                    if (this.hexToEnglish(this.getDirectoryBlockData(currentKey)) === targetFileNameInEnglish && parseInt(this.getBlockFlag(currentKey), 16) > Globals.NEGATIVE_ZERO) {
                        return currentKey;
                    }/// if
                }/// for
            }/// for
        }/// for
        return '';
    }/// searchDirectory

    public defrag(): string {
        if (this.formatted) {
            if (!Globals._CPU.isExecuting) {
                if (!Globals._SingleStepMode) {
                    Defragment.defragment();
                    Control.updateVisualDisk();
                }/// if 
                else {
                    `Cannot defragment the disk while in single step mode! Again, ran out of time for this...`;
                }/// else
            }/// if
            else {
                return 'Cannot defragment the disk while processes are running!';
            }/// else
        }// if
        else {
            return 'Cannot defragment an unformatted disk!';
        }/// else

        return '(Hopefully) Defragmented the disk!';
    }/// defrag

    private preserveFileIntegrity(nodeToDeleteKey: string) {
        var previousNodeKey = this.findPreviousBlock(nodeToDeleteKey);

        /// Set current node to point to the node after the node to delete
        if (previousNodeKey != null) {
            var nodeAfterNodeToDelete = this.getBlockForwardPointer(nodeToDeleteKey);
            this.setBlockForwardPointer(previousNodeKey, nodeAfterNodeToDelete);
        }/// if
    }/// preserveDeletedFile

    public findPreviousBlock(targetBlockKey: string): string | null {
        var current: string = targetBlockKey;
        if (Globals._krnDiskDriver!.getBlockForwardPointer(targetBlockKey) === Globals.BLOCK_NULL_POINTER) {
            return null;
        }/// if
        /// Iterate through link list until we find the node that points to the node we change
        while (Globals._krnDiskDriver!.getBlockForwardPointer(current) != targetBlockKey) {
            current = Globals._krnDiskDriver!.getBlockForwardPointer(current);
        }/// while

        return current;
    }/// findPreviousBlock

    private isSwapFile(fileName: string): boolean {
        return fileName.startsWith('.!');
    }/// isSwapFile

    private isAvailable(sessionStorageKey: string): boolean {
        return this.getBlockFlag(sessionStorageKey) === '8000';
    }/// isAvailable

    private setBlockFlag(sessionStorageKey: string, flag: string): boolean {
        var success = false;
        /// Make sure flag is two bytes, so 4 string characters
        if (flag.length <= 4) {
            var sessionStorageValue: string = sessionStorage.getItem(sessionStorageKey)!;
            sessionStorageValue = flag + sessionStorageValue.substring(Globals.FLAG_INDEXES.end + 1);
            sessionStorage.setItem(sessionStorageKey, sessionStorageValue);
            success = true;
        }/// if

        return success;
    }/// setBlockFlag

    public setBlockForwardPointer(sessionStorageKey: string, pointer: string) {
        var success = false;
        /// Make sure forward pointer is 3 bytes, so 6 string characters
        if (pointer.length <= 6) {
            var sessionStorageValue: string = sessionStorage.getItem(sessionStorageKey)!;
            sessionStorageValue = sessionStorageValue.substring(Globals.FLAG_INDEXES.start, Globals.FLAG_INDEXES.end + 1) + pointer + sessionStorageValue.substring(Globals.POINTER_INDEXES.end + 1);
            sessionStorage.setItem(sessionStorageKey, sessionStorageValue);
            success = true;
        }/// if

        return success;
    }/// setBlockPointer

    private setBlockDate(sessionStorageKey: string, date: string) {
        var success = false;
        /// Make sure date is 8 bytes, so 16 string characters
        if (date.length <= 16) {
            var sessionStorageValue: string = sessionStorage.getItem(sessionStorageKey)!;
            sessionStorageValue = sessionStorageValue.substring(0, Globals.DATE_INDEXES.start) +
                date + sessionStorageValue.substring(Globals.DATE_INDEXES.end + 1);
            sessionStorage.setItem(sessionStorageKey, sessionStorageValue);
            success = true;
        }/// if
        return success;
    }/// setBlockDate

    private setBlockSize(sessionStorageKey: string, size: string) {
        var success = false;
        /// Make sure size is 2 bytes, so 4 string characters
        if (size.length <= 4) {
            var sessionStorageValue: string = sessionStorage.getItem(sessionStorageKey)!;
            sessionStorageValue = sessionStorageValue.substring(0, Globals.FILE_SIZE_INDEXES.start) +
                size + sessionStorageValue.substring(Globals.FILE_SIZE_INDEXES.end + 1);
            sessionStorage.setItem(sessionStorageKey, sessionStorageValue);
            success = true;
        }/// if
        return success;
    }/// setBlockDate

    private setDirectoryBlockData(sessionStorageKey: string, newBlockData: string): boolean {
        /// Make sure data is  only 50 Bytes, so 100 string characters
        if (newBlockData.length <= 100) {
            var sessionStorageValue = sessionStorage.getItem(sessionStorageKey);
            sessionStorageValue = sessionStorageValue!.substring(0, Globals.DIRECTORY_DATA_INDEXES.start) + newBlockData;
            sessionStorage.setItem(sessionStorageKey, sessionStorageValue);
            return true;
        }/// if
        return false;
    }/// getBlockData

    private setDataBlockData(sessionStorageKey: string, newBlockData: string): boolean {
        /// Make sure data is  only 59 Bytes, so 118 string characters
        if (newBlockData.length <= 118) {
            var sessionStorageValue = sessionStorage.getItem(sessionStorageKey);
            sessionStorageValue = sessionStorageValue!.substring(0, Globals.DATA_DATA_INDEXES.start) + newBlockData;
            sessionStorage.setItem(sessionStorageKey, sessionStorageValue);
            return true;
        }/// if
        return false;
    }/// getBlockData

    public getBlockFlag(sessionStorageKey: string): string {
        return sessionStorage.getItem(sessionStorageKey)!.substring(Globals.FLAG_INDEXES.start, Globals.FLAG_INDEXES.end + 1);
    }/// getBlockFlag

    public getBlockForwardPointer(sessionStorageKey: string): string {
        return sessionStorage.getItem(sessionStorageKey)!.substring(Globals.POINTER_INDEXES.start, Globals.POINTER_INDEXES.end + 1);
    }/// getBlockNextPointer

    private getBlockDate(sessionStorageKey: string) {
        return sessionStorage.getItem(sessionStorageKey)!.substring(Globals.DATE_INDEXES.start, Globals.DATE_INDEXES.end + 1);
    }/// getBlockDate

    private getBlockSize(sessionStorageKey: string) {
        return sessionStorage.getItem(sessionStorageKey)!.substring(Globals.FILE_SIZE_INDEXES.start, Globals.FILE_SIZE_INDEXES.end + 1);
    }/// getBlockSize

    private getDirectoryBlockData(sessionStorageKey: string): string {
        /// hmm...
        /// How do you know when a program ends in memory...
        /// return isSwapFile ? sessionStorageValue.substring(8) : sessionStorageValue.substring(8).replace('00', '');

        /// Return this for now..
        return sessionStorage.getItem(sessionStorageKey)!.substring(Globals.DIRECTORY_DATA_INDEXES.start, Globals.DIRECTORY_DATA_INDEXES.end + 1);
    }/// getDirectoryBlockData

    private getDataBlockData(sessionStorageKey: string): string {
        /// hmm...
        /// How do you know when a program ends in memory...
        /// return isSwapFile ? sessionStorageValue.substring(8) : sessionStorageValue.substring(8).replace('00', '');

        /// Return this for now..
        return sessionStorage.getItem(sessionStorageKey)!.substring(Globals.DATA_DATA_INDEXES.start, Globals.DATA_DATA_INDEXES.end + 1);
    }/// getDirectoryBlockData

    public englishToHex(englishWord: string): string {
        var englishWordInHex = '';
        for (var letter: number = 0; letter < englishWord.length; ++letter) {

            /// Add left 0 padding
            var paddedhexNumber: string = "00" + englishWord[letter].charCodeAt(0).toString(16);
            paddedhexNumber = paddedhexNumber.substr(paddedhexNumber.length - 2).toUpperCase();

            /// Get Ascii value from english letter and convert to a single hex character string
            englishWordInHex += paddedhexNumber;
        }/// for

        return englishWordInHex;
    }/// englishToHex

    public hexToEnglish(hexWord: string): string {
        var englishWord = '';
        for (var hexLetterPair: number = 0; hexLetterPair < hexWord.length; hexLetterPair += 2) {
            if (hexWord.substring(hexLetterPair, hexLetterPair + 2) === "00") {
                break;
            }///
            else {
                englishWord += String.fromCharCode(
                    parseInt(
                        /// Read hex digits in pairs
                        hexWord.substr(hexLetterPair, 2),
                        16 /// To decimal from base 16
                    )/// parseInt
                );/// String.fromCharCode
            }/// else
        }/// for
        return englishWord;
    }/// hexToEnglish
}/// class

export class Partition {
    constructor(
        public name: any,
        public baseTrack: any,
        public baseSector: any,
        public baseBlock: any,
        public limitTrack: any,
        public limitSector: any,
        public limitBlock: any,
        public defaultDataBlockZeros: string = '',
        public defaultDirectoryBlockZeros: string = '',
    ) {
        for (var byte: number = 0; byte < Globals.DATA_BLOCK_DATA_LIMIT; ++byte) {
            this.defaultDataBlockZeros += "00";
        }// for

        for (var bytes: number = 0; bytes < Globals.DIRECTORY_BLOCK_DATA_LIMIT; ++bytes) {
            this.defaultDirectoryBlockZeros += "00";
        }// for
    }/// constructor
}/// Partition

export class IdAllocator {
    /// Not very memory efficient, but I need an id allocator that can quickly allocate and deallocate id's
    ///
    /// Remember 1's comp and 2's comp? 
    /// I sure as hell don't, but I remember the concept...
    /// So followig that looping radix thing Gormanly taught us:
    ///     ~ Every ID <= 32,767 
    ///         - Is in use (so our positive ID's 0 <--> 32,767)
    ///     ~ Every ID > 32,769
    ///         - Is deleted (so our negative ID's also 0 <--> 32,767)
    ///         - but still needs an ID to defrag by and maintain some sort of coherency in recovery
    ///     ~ ID 32,768 is special... files that are neither created nor deleted, it's our second "0", (a.k.a -0);
    constructor(
        private usedFilePositiveID: number[] = [],
        private usedFileNegativeID: number[] = [],
        private availableFilePositiveID: number[] = [],
        private availableFileNegativeID: number[] = [],
    ) {
        /// Allocate 2 Bytes of ID's
        /// ID 0 is reserved for the master boot record
        for (var i: number = 1; i <= 32_767; ++i) {
            this.availableFilePositiveID.push(i);
        }/// for

        /// Allocate 2 Bytes of ID's
        /// ID 0 is reserved for the master boot record
        for (var i: number = 32_769; i <= 65_535; ++i) {
            this.availableFileNegativeID.push(i);
        }/// for
    }/// constructor

    /**
     * Must be fast, since this will be called on every file creation (even swap files...)
     * Name: allocateID
     * Paramaters: none
     * Returns: 
     *      1.) id ranging from 1-256
     *      2.) -1 if no id is available
     */
    public allocatePositiveID() {
        var id = this.availableFilePositiveID.pop();
        this.usedFilePositiveID.push(id!);
        return id === undefined ? -1 : id;
    }/// allocatePositiveID

    public allocateNegativeID() {
        var id = this.availableFileNegativeID.pop();
        this.usedFileNegativeID.push(id!);
        return id === undefined ? -1 : id;
    }/// allocateNegaiveID
    /**
     * Can be slower as this will be called in deletions and check disk operations...
     * Name: deallocateID
     * Paramaters: id (that will be able to be re-used)
     * Returns: 
     *      1.) true
     *      2.) false
     */
    public deallocatePositiveID(idToRenew: number): boolean {
        var i: number = 0;
        var found: boolean = false;

        /// Find the id in the used ID list to move it to the available ID lis
        while (i < this.usedFilePositiveID.length && !found) {
            if (idToRenew === this.usedFilePositiveID[i]) {
                found = true;
                this.availableFilePositiveID.push(this.usedFilePositiveID[i]);
                this.usedFilePositiveID.splice(i, 1);
            }/// if

            else {
                i++;
            }/// else
        }/// while

        return found;
    }/// deallocatePositiveID

    public deallocateNegativeID(idToRenew: number): boolean {
        var h: number = 0;
        var found: boolean = false;
        while (h < this.usedFileNegativeID.length && !found) {
            if (idToRenew === this.usedFileNegativeID[h]) {
                found = true;
                this.availableFileNegativeID.push(this.usedFileNegativeID[h]);
                this.usedFileNegativeID.splice(h, 1);
            }/// if
            else {
                h++;
            }/// else
        }/// while

        return found;
    }/// deallocateNegativeID
}/// fileIdGenerator