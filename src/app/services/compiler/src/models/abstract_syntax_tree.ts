import { NODE_TYPE_BRANCH } from "../global";
import { LexicalToken } from "./lexical_token";
import { CustomNode } from "./node";
import { ScopeTable } from "./scope_table";
import { ScopeTree } from "./scope_tree";

export class AbstractSyntaxTree {
    public scope_tree: ScopeTree;

    constructor(
        /**
         * Root node of the tree.
         */
        public root: any = null,

        /**
         * Current node in the tree
         */
        public current_node: CustomNode | null= null,

        /**
         * Program this tree belongs to
         */
        public program: number = -1,

        /**
         * Number of nodes in the tree
         */
        private _node_count: number = -1,
    ) { }//constructor

    /**
     * 
     * Adds a node to the n-array tree. 
     * Updates the current node to the newly added node.
     *
     * @param new_name Name of the node, could be a string or lexeme
     * @param kind Root, Branch, or Leaf Node?
     */
    public add_node(new_name: string | null, kind: string, hasError: boolean = false, hasWarning: boolean = false, lex_token: LexicalToken | null = null, scope_table: ScopeTable | null = null) {
        this._node_count++

        // Construct the node object.
        let new_node = new CustomNode(new_name, this._node_count, kind);
        new_node.errorFlag = hasError;
        new_node.warningFlag = hasWarning;
        new_node.setToken(lex_token);
        new_node.setScopeTable(scope_table);

        // Check to see if it needs to be the root node.
        if ((this.root == null) || (!this.root)) {
            this.root = new_node;
        }// if

        // Not root node...
        else {
            // We are the children.
            // Make our parent the current node [this.current_node]...
            new_node.parent_node = this.current_node;

            // ... and add ourselves (via the unfrotunately-named
            // "push" function) to the children array of the current node.
            this.current_node!.children_nodes.push(new_node);
        }// else

        // If we are an interior/branch node, then...
        if (kind == NODE_TYPE_BRANCH) {
            // ... update the CURrent node pointer to ourselves.
            this.current_node = new_node;
        }// if

        return this.current_node;
    }// add_node

    /**
     * Sets the current node to the parent node
     */
    public climb_one_level() {
        // ... by moving "up" to our parent node (if possible).
        if ((this.current_node!.parent_node !== null) && (this.current_node!.parent_node.name !== undefined)) {
            this.current_node = this.current_node!.parent_node;
        }// if

        else {
            // TODO: Some sort of error logging.
            // This really should not happen, but it will, of course.
        }// else
    }// root_node
}// class