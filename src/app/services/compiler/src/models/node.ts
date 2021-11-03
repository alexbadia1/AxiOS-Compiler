import { LexicalToken } from "./lexical_token";
import { ScopeTable } from "./scope_table";

export class CustomNode {
    private _scope_table: ScopeTable | null = null;
    private _token: LexicalToken | null = null;
    public errorFlag: boolean = false;
    public warningFlag: boolean = false;

    constructor(
        /**
         * Either the name of the non-terminal or terminal.
         */
        public name: string | null,

        /**
         * Unique identifier for each node in the tree
         */
        public id: number = -1,

        /**
         * Root, Branch or Leaf Node?
         */
        public type: string | null = null,

        /**
         * Note a child can only have on parent
         */
        public parent_node: CustomNode | null = null,

        /**
         * Note that a node can have multiple children
         */
        public children_nodes: Array<CustomNode> = [],
    ) { }// constructor


    public setScopeTable(new_scope_table: ScopeTable | null): void {
        this._scope_table = new_scope_table;
    }// setData

    public getScopeTable(): ScopeTable | null {
        return this._scope_table;
    }// getData

    public setToken(new_token: LexicalToken | null): void {
        this._token = new_token;
    }// setData

    public getToken(): LexicalToken | null {
        return this._token;
    }// getData
}//class