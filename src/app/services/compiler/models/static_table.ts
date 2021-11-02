/**
 * static_table.ts
 * 
 * The logical model of a Scope Table.
 * 
 * Utilizes the javascript Map() to simulate a hash table.
 * 
 */

export class StaticDataMetadata{
    public isUsable: boolean = false;
    constructor(
        public temp_address_leading_hex: string,
        public temp_address_trailing_hex: string,
        public logical_stack_address: number,
    ){}
}// class

export class Jump {
    constructor(
        public distance: number,
    ){}
}// class

export class StaticTable {
    private _map: Map<string, StaticDataMetadata>;
    private _anonymous_address: Array<StaticDataMetadata>;
    private _strings_in_heap: Map<string, string>;
    private _jump_table: Map<string, Jump>;

    constructor() {
        this._map = new Map();
        this._anonymous_address = new Array<StaticDataMetadata>();
        this._strings_in_heap = new Map<string, string>();
        this._jump_table = new Map<string, Jump>();
    }// constructor

    /**
     * Simulate a hash tables "put" method
     * 
     * @param key unique key value for hash table
     * @param value variable metadata object indicating type and usage
     * @returns false if there was a collision
     */
    public put(identifier: string | null, scope: number, static_data_metadata: StaticDataMetadata): boolean {
        let primary_key: string = identifier + scope.toString();
        let value: StaticDataMetadata = static_data_metadata;

        if (!this._map.has(primary_key)) {
            this._map.set(primary_key, value);
            return true;
        }// if

        return false;
    }// put

    /**
     * Simulate a hash tables "get" method
     * 
     * @param key unique key value for hash table
     * @returns Variable etadata object, null if not
     */
     public get(identifier: string, scope: number,): StaticDataMetadata | null | undefined {
        let primary_key: string = identifier + scope.toString();

        if (this._map.has(primary_key)) {
            return this._map.get(primary_key);
        }// if

        return null;
    }// get

    public entries(): Array<Array<any>> {
        return Array.from(this._map.entries());
    }// entries

    public values(): Array<StaticDataMetadata> {
        return Array.from(this._map.values());
    }// values

    public has(identifier: string, scope: number,): boolean{
        let primary_key: string = identifier + scope.toString();

        return this._map.has(primary_key);
    }// has
    
    public isEmpty(): boolean {
        return this._map.size === 0;
    }// isEmpty

    public size(): number {
        return this._map.size + this._anonymous_address.length;
    }// size

    public get_number_of_anonymous_address(): number {
        return this._anonymous_address.length;
    }// get_anonymous_address_size

    public add_anonymous_address(meta_data: StaticDataMetadata): void {
        this._anonymous_address.push(meta_data);
    }// add_anonymous_address

    public get_anonymous_addresses(): Array<StaticDataMetadata> {
        return this._anonymous_address;
    }// get_anonymous_address

    public put_new_string(new_string: string, address: string): void {
        if (!this._strings_in_heap.has(new_string)) {
            this._strings_in_heap.set(new_string, address);
        }// if
    }// put_new_string

    public get_string_in_heap(string_in_heap: string): string | null | undefined {
        if (this._strings_in_heap.has(string_in_heap)) {
            return this._strings_in_heap.get(string_in_heap);
        }// if
        return null;
    }// get_string_in_heap

    public get_jump_table_size(): number {
        return this._jump_table.size;
    }// get_jump_table_size

    public put_jump(new_jump: string, distance: Jump): void {
        if (!this._jump_table.has(new_jump)) {
            this._jump_table.set(new_jump, distance);
        }// if
    }// put_jump

    public get_jump(jump: string): Jump | null | undefined {
        if (this._jump_table.has(jump)) {
            return this._jump_table.get(jump);
        }// if
        return null;
    }// get_jump

    public get_jump_entries(): Array<Array<any>> {
        return Array.from(this._jump_table.entries());
    }// get_jump_entries
}// class