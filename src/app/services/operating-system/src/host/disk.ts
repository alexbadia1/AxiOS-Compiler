import { Globals } from "../global";
import { IdAllocator } from "../os/deviceDriverDisk";
import { Control } from "./control";

/** 
 * AxiOS is browser based, so naturally, session storage will be used meaning,
 * Our disk filesystem is implemented with a Key|Value pairs...
 * 
 * Quick Notes on Disk:
 *      - Ours will be 16 KB so...
 *          - 4 Tracks
 *          - 8 Sectors
 *          - 8 Blocks (each 64 Bytes)
 * 
 * 
 * Quick Notes on HTML5 Session Storage:
 *      - Implemented via Key|Value pairs
 *      - Each Key represents a location on the "disk":
 *          -"(track, sector, block)"
 *          -
 * 
 * 
*/
export class Disk {
    constructor() { }/// constructor
    init() {
        /// Create each block in the 16KB Disk
        for (var trackNum: number = 0; trackNum < Globals.TRACK_LIMIT; ++trackNum) {
            for (var sectorNum: number = 0; sectorNum < Globals.SECTOR_LIMIT; ++sectorNum) {
                for (var blockNum: number = 0; blockNum < Globals.BLOCK_LIMIT; ++blockNum) {
                    this.createSessionBlock(trackNum, sectorNum, blockNum);
                }/// for
            }/// for
        }/// for

        this.createMasterBootRecord();

        /// Reclaim all ID's
        Globals._krnDiskDriver.idAllocator = new IdAllocator();
    }/// init

    public createSessionBlock(newTrackNum: number, newSectorNum: number, newBlockNum: number) {
        var key = `${Control.formatToHexWithPadding(newTrackNum)}${Control.formatToHexWithPadding(newSectorNum)}${Control.formatToHexWithPadding(newBlockNum)}`;
        var forwardPointer = Globals.BLOCK_NULL_POINTER;
        /// First byte = availability flag
        ///     0000 means free
        var isOccupied: string = "8000";

        /// Remaining 60 Bytes are for the raw data
        ///
        /// Be careful with "+=", you don't want to append strings to null, make sure data is initialized to ''.
        /// You'll end up getting [flag][pointer]undefined00000000000000000000...
        var data: string = '00';
        for (var byte = 0; byte < Globals.DATA_BLOCK_DATA_LIMIT - 1; ++byte) {
            data += "00";
        }// for

        /// Value part of key|value in session storage
        var value = isOccupied + forwardPointer + data;

        /// Actually "create" the block, by saving in Key|Value storage
        sessionStorage.setItem(key, value);
    }/// createSessionBlock

    private createMasterBootRecord() {
        var key: string = "000000";
        var isOccupied: string = "0000";
        var nextBlockPointer: string = Globals.BLOCK_NULL_POINTER;

        /// Remaining 60 Bytes are for the raw data
        var data: string = Globals._krnDiskDriver.englishToHex("Master Partition Table, Master Signature, Master Boot Code");

        /// Value part of key|value in session storage
        var value = isOccupied + nextBlockPointer + data;

        /// Actually "create" the first master boot block, by saving in Key|Value storage
        sessionStorage.setItem(key, value);
    }/// createMasterBootRecord
}/// class