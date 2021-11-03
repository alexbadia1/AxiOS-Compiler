import { CustomNode } from "./node";

export class VariableMetaData{
    constructor(
        public type: string | null,
        public isUsed: boolean,
        public isInitialized: boolean,
        public lineNumber: number,
        public linePosition: number,
        public node: CustomNode | null,
    ){}
}// class

export class ScopeTable {
    public id: number = 0;
    public parent_scope_table: ScopeTable | null = null;
    private _map: Map<string, VariableMetaData> = new Map();

    constructor(){ }// constructor

    /**
     * Simulate a hash tables "put" method
     * 
     * @param key unique key value for hash table
     * @param value variable metadata object indicating type and usage
     * @returns false if there was a collision
     */
    public put(key: string | null, value: VariableMetaData): boolean {
        if (key == null) { return false; }
        if (!this._map.has(key)) {
            this._map.set(key, value);
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
     public get(key: string | null): VariableMetaData | null | undefined{
        if (key == null) { return null; }
        if (this._map.has(key)) {
            return this._map.get(key);
        }// if

        return null;
    }// get

    public entries(): Array<Array<any>> {
        return Array.from(this._map.entries());
    }// entries

    public has(key: string | null): boolean{
        if (key == null) { return false; }
        return this._map.has(key);
    }// has
    
    public isEmpty(): boolean {
        return this._map.size === 0;
    }// isEmpty
}// class