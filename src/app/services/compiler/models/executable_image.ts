import { MAX_MEMORY_SIZE } from "../global";

export class ExecutableImage {
    private _id;

    /**
     * Memory is simulated with an array of strings.
     * 
     * The max size of the array is 256 and each string
     * represents a pair of hexadecimal equaling a total of 256 byte.
     */
    private _memory: Array<string>;
    private _memory_address_base: number;
    private _memory_address_limit: number;

    /**
     * The machine language op codes (a.k.a "text")
     * 
     * Execution begins at location 0x00 and moves down towards FF.
     */
    private _code_base: number;
    private _code_limit: number;

    /**
     * Storage fo static variables: int, bool, string, pointers
     * 
     * Begins immediately after the code section and moves down towards FF.
     */
    private _stack_base: number | null;
    private _stack_limit: number | null;

    /**
     * Storage for dynamic/reference variables pointed to by static pointers.
     * 
     * Begins at 0xFF and moves up towards 0x00
     */
    private _heap_base: number;
    private _heap_limit: number;

    private _false_address: number;
    private _true_address: number;
    private _null_address: number;

    constructor(new_id: number) {
        this._id = new_id;
        this.init();
    }// constructor

    private init(): void {
        this._memory = [];
        this._memory_address_base = 0;
        this._memory_address_limit = MAX_MEMORY_SIZE - 1; //

        // Initialize 256 bytes of memory, with 0's
        for (let i: number = this._memory_address_base; i <= this._memory_address_limit; ++i) {
            this._memory.push("00");
        }// for

        // Code starts at beginning of memory
        this._code_base = 0;

        // End of code starts at the code's base, but will grow over time
        this._code_limit = this._code_base - 1;

        // Don't know where the stack will start yet
        this._stack_base = null;

        // End of stack starts at the stacks base, but will grow over time
        this._stack_limit = null;

        // Heap starts at end of memory
        this._heap_base = this._memory.length - 1;

        // End of heap starts at the heap's base, but will grow over time
        this._heap_limit = this._heap_base + 1;

        // Initialize heap with null, true, false, pointers
        this.write_string_to_heap("null");
        this._null_address = this._heap_limit;
        this.write_string_to_heap("false");
        this._false_address = this._heap_limit;
        this.write_string_to_heap("true");
        this._true_address = this._heap_limit;
    }// init

    public get_id(): number {
        return this._id;
    }// get_id

    /**
     * Writes a hex pair to the code.
     * 
     * Modifying the internals of a code is allowed and done 
     * by specifiying a valid logical address that is inside the code.
     * 
     * If no logical address is specified, the hex pair will be appended to 
     * the end of the code causing the code to grow and possibly resulting in collisions.
     * 
     * Note that the code must be expanded contiguously.
     * 
     * @param hex_pair hex pair to write to code
     * @param logical_address logical address in memory to write hex pair
     */
    public write_to_code(hex_pair: string | null | undefined, logical_address: number = (this._code_limit + 1)): void {
        // Avoid invalid hex pairs
        if (!this._is_valid_hex_pair(hex_pair)) {
            throw Error(`Invalid Hex Pair, cannot write to code ${hex_pair} to L${logical_address}!`);
        }// if

        // I know we're not in OS anymore but to make debugging easier...
        // Ensure valid addressing of memory, logically, physically, and metaphysically.
        let physical_address: number = this._get_physical_address(this._code_base, logical_address);

        // Code must be appended synchronous
        if (physical_address > (this._code_limit + 1)) {
            throw Error(`Code must be contigous, writing to code ${hex_pair} to L${logical_address}:P${physical_address}[${physical_address.toString(16).toUpperCase().padStart(2, "0")}]!`);
        }// if

        // Avoid heap collisions
        //
        // Allows the user to change 6502a op codes within the code section memory
        // This will be particularly useful for backtracking.
        if (physical_address >= this._heap_limit) { 
            throw Error(`Heap Collision writing to code ${hex_pair} to L${logical_address}:P${physical_address}[${physical_address.toString(16).toUpperCase().padStart(2, "0")}]!`);
        }// if

        // Explicitly banning self modifying code via the stack or heap.
        // That is out of the scope of this class, and a lot of brain damage all considering...
        if (this._stack_base !== null) {
            if (physical_address >= this._stack_base) {
                throw Error(`Self Modifying Code Error writing ${hex_pair} to L${logical_address}:P${physical_address}[${physical_address.toString(16).toUpperCase().padStart(2, "0")}]!
                Self modifiying code is explicitly prohibited! If the [stack base] is non-null, that means backpatching is or 
                was already performed. Meaning, there should not be any new code entries that would cause the code section to grow.`);
            }// if
        }// if

        // Write to code
        //console.log(`Code: Writing ${hex_pair} to L${logical_address}:P${physical_address}[${physical_address.toString(16).toUpperCase().padStart(2, "0")}]`);
        this._memory[physical_address] = hex_pair ?? "??";

        // User did not specify a logical address, so hex_pair was written to the end of the code
        if (physical_address === (this._code_limit + 1)) {
            this._code_limit++;
        }// if
    }// write_to_code

    /**
     * Writes a hex pair to the stack.
     * 
     * Modifying the internals of a stack is allowed and done 
     * by specifiying a valid logical address that is inside the stack.
     * 
     * If no logical address is specified, the hex pair will be appended to 
     * the end of the stack causing the heap to grow and possibly resulting in collisions.
     * 
     * Note that the stack must be expanded contiguously.
     * 
     * @param hex_pair hex pair to write to stack
     * @param logical_address logical address in memory to write hex pair
     */
    public write_to_stack(hex_pair: string, logical_address: number | null = null): void {
        // When writing to the stack make sure a base was specified
        if (this._stack_base === null || this._stack_limit === null) {
            throw Error(`Stack base was never specified!`);
        }// if

        else {
            logical_address = this._stack_limit - this._stack_base + 1;
        }// else

        // Avoid invalid hex pairs
        if (!this._is_valid_hex_pair(hex_pair)) {
            throw Error(`Invalid Hex Pair, cannot write to stack ${hex_pair} to L${logical_address}!`);
        }// if

        // I know we're not in OS anymore but to make debugging easier...
        // Ensure valid addressing of memory, logically, physically, and metaphysically.
        let physical_address: number = this._get_physical_address(this._stack_base, logical_address);

        // Avoid code collisions, again no self modifying code...
        if (physical_address <= this._code_limit) { 
            throw Error(`Code Collision writing to stack ${hex_pair} to L${logical_address}:P${physical_address}[${physical_address.toString(16).toUpperCase().padStart(2, "0")}]!`);
        }// if

        // Avoid heap collisions
        if (physical_address >= this._heap_limit) { 
            throw Error(`Heap Collision writing to stack ${hex_pair} to L${logical_address}:P${physical_address}[${physical_address.toString(16).toUpperCase().padStart(2, "0")}]!`);
        }// if

        // Ensure contigous expansion of the stack
        if (physical_address > (this._stack_limit + 1)) {
            throw Error(`Stack must be contigous, writing to stack ${hex_pair} to L${logical_address}:P${physical_address}[${physical_address.toString(16).toUpperCase().padStart(2, "0")}]!`);
        }// if

        // Write to stack
        // console.log(`Stack: Writing ${hex_pair} to L${logical_address}:P${physical_address}[${physical_address.toString(16).toUpperCase().padStart(2, "0")}]`);
        this._memory[physical_address] = hex_pair;

        // Stack just grew
        if (physical_address = (this._stack_limit + 1)) {
            this._stack_limit++;
        }// if
    }// write_to_stack

    /**
     * Writes a hex pair to the heap.
     * 
     * Modifying the internals of a heap is allowed and done 
     * by specifiying a valid logical address that is inside the heap.
     * 
     * If no logical address is specified, the hex pair will be appended to 
     * the end of the heap causing the heap to grow and possibly resulting in collisions.
     * 
     * Note that the heap must be expanded contiguously.
     * 
     * @param hex_pair hex pair to write to heap
     * @param logical_address logical address in memory to write hex pair
     */
    public write_to_heap(hex_pair: string, logical_address: number = this._heap_base - this._heap_limit + 1): void {
        // Avoid invalid hex pairs
        if (!this._is_valid_hex_pair(hex_pair)) {
            throw Error(`Invalid Hex Pair, cannot write to heap ${hex_pair} to L${logical_address}!`);
        }// if

        let physical_address: number = this._heap_base - logical_address;

        if (physical_address < this._memory_address_base) {
            throw Error(`Memory Lower Bound Limit Reached, cannot write ${hex_pair} to L${logical_address}:P${physical_address}[${physical_address.toString(16).toUpperCase().padStart(2, "0")}]!`);
        }// if

        if (physical_address > this._memory_address_limit) { 
            throw Error(`Memory Upper Bound Limit Reached, cannot write ${hex_pair} to L${logical_address}:P${physical_address}[${physical_address.toString(16).toUpperCase().padStart(2, "0")}]!`)
        }// if

        // Avoid code collisions
        if (physical_address <= this._code_limit) { 
            throw Error(`Code Collision writing to heap ${hex_pair} to L${logical_address}:P${physical_address}[${physical_address.toString(16).toUpperCase().padStart(2, "0")}]!`);
        }// if

        // If the stack was specified, ensure no stack collisions
        if (this._stack_base !== null && this._stack_limit !== null) {
            if (physical_address <= this._stack_limit) {
                throw Error(`Stack Collision writing to heap ${hex_pair} to L${logical_address}:P${physical_address}[${physical_address.toString(16).toUpperCase().padStart(2, "0")}]!`);
            }// if
        }// if

        // Ensure the heap is CONTIGOUSLY expanded
        if (physical_address < (this._heap_limit - 1)) {
            throw Error(`Heap must be contigous, writing to heap ${hex_pair} to L${logical_address}:P${physical_address}[${physical_address.toString(16).toUpperCase().padStart(2, "0")}]!`);
        }// if

        // Write to heap
        // console.log(`Heap: Writing ${hex_pair} to L${logical_address}:P${physical_address}[${physical_address.toString(16).toUpperCase().padStart(2, "0")}]`);
        this._memory[physical_address] = hex_pair;

        // Heap just grew
        if (physical_address === this._heap_limit - 1) {
            this._heap_limit--;
        }// if
    }// write_to_heap

    public write_string_to_heap(str: string): string {
        str = str.split("\"").join("");
        // console.log(`Writing the string [${str}] to the heap...`);

        // Null termination for string
        this.write_to_heap("00");

        for (let i: number = str.length - 1; i >= 0; --i) {
            let ascii_value_in_hex: string = str[i].charCodeAt(0).toString(16).toUpperCase();
            this.write_to_heap(ascii_value_in_hex);
        }// for

        // console.log(`[${str}] starts at P${this._heap_limit}[${this._heap_limit.toString(16).toUpperCase().padStart(2, "0")}]`);
        return this._heap_limit.toString(16).toUpperCase().padStart(2, "0");
    }// write_string_to_heap

    private _is_valid_hex_pair(hex_pair: string | null | undefined) {
        if (hex_pair == undefined || hex_pair == null) { return false; }
        // Allow T's and $'s for temporary locations
        return /([A-F]|[0-9]|[T]|[J]|[\$])([A-F]|[0-9]|[T]|[J]|[\$])/.test(hex_pair);
    }// is_valid_hex_pair

    /**
     * I know we're not in OS anymore but to make debugging easier... 
     * Ensure valid addressing of memory, logically, physically, metaphysically, and spiritually.
     * 
     * @param logical_address specified address in memory to write to
     * @param hex_pair hex pair that will be written to memory
     * @returns the physical address in memory, calculated from the logical
     */
    private _get_physical_address(base: number, logical_address: number): number {
        let physical_address = logical_address + base;

        if (physical_address < this._memory_address_base) {
            throw Error(`Memory Lower Bound Limit Reached, cannot access L${logical_address}:P${physical_address}[${physical_address.toString(16).toUpperCase().padStart(2, "0")}]!`);
        }// if

        if (physical_address > this._memory_address_limit) { 
            throw Error(`Memory Upper Bound Limit Reached, cannot access L${logical_address}:P${physical_address}[${physical_address.toString(16).toUpperCase().padStart(2, "0")}]!`);
        }// if

        return physical_address;
    }// get_physical_address

    public initialize_stack(): void {
        this._stack_base = this._code_limit + 1;
        this._stack_limit = this._stack_base - 1;
    }// initialize_stack

    public read_code_area(logical_address: number) {
        let physical_address = this._get_physical_address(this._code_base, logical_address);

        if (physical_address > this._code_limit) {
            throw Error(`Code Memory Upper Bound Limit Reached, cannot read L${logical_address}:P${physical_address}[${physical_address.toString(16).toUpperCase().padStart(2, "0")}]!`);
        }// if

        return this._memory[physical_address];
    }// read_code_area

    public get_null_address(): number {
        return this._null_address;
    }// getNullAddress

    public get_false_address(): number {
        return this._false_address;
    }// getNullAddress

    public get_true_address(): number {
        return this._true_address;
    }// getNullAddress

    public get_code_base(): number {
        return this._code_base;
    }// getCodeBase

    public get_code_limit(): number {
        return this._code_limit;
    }// get_code_limit

    public get_stack_base(): number | null {
        return this._stack_base;
    }// getCodeBase

    public get_heap_limit(): number {
        return this._heap_limit;
    }// getHeapLimit

    public get_code_area_size(): number {
        return this._code_limit - this._code_base + 1;
    }// get_code_area_size

    public memory(): string {
        let ans = "";
        for (let byte of this._memory) {
            ans += byte + " ";
        }// for
        return ans;
    }// toString
}// class