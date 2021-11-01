import { CustomNode } from "./node";

export class VariableMetaData{
    constructor(
        public type: string,
        public isUsed: boolean,
        public isInitialized: boolean,
        public lineNumber: number,
        public linePosition: number,
        public node: CustomNode,
    ){}
}// class

export class ScopeTableModel {
    public id: number = 0;
    public parent_scope_table: ScopeTableModel | null = null;
    private _map: Map<string, VariableMetaData> = new Map();

    constructor(){ }// constructor

    /**
     * Simulate a hash tables "put" method
     * 
     * @param key unique key value for hash table
     * @param value variable metadata object indicating type and usage
     * @returns false if there was a collision
     */
    public put(key: string, value: VariableMetaData): boolean {
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
     public get(key: string): VariableMetaData | null | undefined{
        if (this._map.has(key)) {
            return this._map.get(key);
        }// if

        return null;
    }// get

    public entries(): Array<Array<any>> {
        return Array.from(this._map.entries());
    }// entries

    public has(key: string): boolean{
        return this._map.has(key);
    }// has
    
    public isEmpty(): boolean {
        return this._map.size === 0;
    }// isEmpty
}// class