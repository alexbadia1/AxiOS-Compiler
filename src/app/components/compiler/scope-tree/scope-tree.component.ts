import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { CustomNode } from 'src/app/services/compiler/src/models/node';
import { Program } from 'src/app/services/compiler/src/models/program';

@Component({
  selector: 'app-scope-tree',
  templateUrl: './scope-tree.component.html',
  styleUrls: ['./scope-tree.component.scss']
})
export class ScopeTreeComponent implements OnInit {
  @ViewChild('scopeTree') scopeTreeElement: ElementRef;
  @Input() program: Program;
  private scopeTreeDiv: HTMLDivElement;

  constructor() { }

  ngOnInit(): void { }

  ngAfterViewInit() {
    this.scopeTreeDiv = this.scopeTreeElement.nativeElement;

    if (this.program.isValid) {
      this.toHtml(this.program.scopeTree.root, this.program.id);
    }// if
  }// ngAfterViewInit

  public toHtml(root: CustomNode, programId: number) {
    // Makes this work on angular, due to race condition!
    var docFrag: DocumentFragment = document.createDocumentFragment();

    var tree_div: HTMLElement = document.createElement(`div`);
    tree_div.className = `tree`;
    tree_div.id = `scope-tree_p${programId} `;
    docFrag.appendChild(tree_div);

    // Make the initial call to expand from the root
    // Create root first
    let ul: HTMLUListElement = document.createElement("ul");
    ul.id = `scope-tree_p${programId}_ul_node_id_0`;
    let li: HTMLLIElement = document.createElement("li");
    li.id = `scope-tree_p${programId}_li_node_id_0`;

    let innerHtml = `<a onclick="highlightSubtree(${programId}, 0, 'SCOPETREE')" name = "node-anchor-tag" style="cursor: pointer;">`
    innerHtml += `${root.name}`;

    let entries: Array<Array<any>> = root.getScopeTable()!.entries();
    for (let index: number = 0; index < entries.length; ++index) {
      innerHtml += `<br> ${entries[index][0]} | Type: ${entries[index][1].type}, Used: ${entries[index][1].isUsed}, isInitialized: ${entries[index][1].isInitialized}, Line: ${entries[index][1].lineNumber}, Pos:${entries[index][1].linePosition}`;
    }// for

    innerHtml += `</a>`;
    li.innerHTML = innerHtml;

    ul.appendChild(li);
    tree_div.appendChild(ul);

    this.traverse_tree(root, programId, docFrag);
    this.scopeTreeDiv.appendChild(docFrag);
  }// toHtml

  /**
   * Depth first traversal, to translate the tree into a series of <ul> and <li>.
   * 
   * Yes, this is a lot of brain damage.
   * 
   * @param root root node of the n-array tree
   */
  public traverse_tree(root: CustomNode, programId: number, docFrag: DocumentFragment) {

    // Stack to store the nodes
    let nodes: Array<CustomNode> = [];

    // push the current node onto the stack
    nodes.push(root);

    // Loop while the stack is not empty
    while (nodes.length !== 0) {

      // Store the current node and pop
      // it from the stack
      let curr: CustomNode | undefined = nodes.pop();

      // Current node has been travarsed
      if (curr != null) {
        // Root node
        if (curr.parent_node == null) {
          // Root node already created
        }// if

        // Node is the first node of the parent
        else if (curr.parent_node.children_nodes[0] == curr) {
          let ul: HTMLUListElement = document.createElement("ul");
          ul.id = `scope-tree_p${programId}_ul_node_id_${curr.id}`;
          let li: HTMLLIElement = document.createElement("li");
          li.id = `scope-tree_p${programId}_li_node_id_${curr.id}`;

          ul.appendChild(li);

          let innerHtml = `<a onclick="highlightSubtree(${programId}, ${curr.id}, 'SCOPETREE');" name = "node-anchor-tag" style="cursor: pointer;">${curr.name}`;

          // Fix empty scope table alignment
          if (curr.getScopeTable()!.isEmpty() && !curr.parent_node.getScopeTable()!.isEmpty()) {
            if (curr.parent_node.children_nodes.length === 2) {
              if (curr.parent_node.children_nodes[0].getScopeTable()!.isEmpty() && curr.parent_node.children_nodes[1].getScopeTable()!.isEmpty()) {
                li.style.paddingLeft = "32.5%";
              }// if
            }// if
          }// if

          // Add scope table
          let entries: Array<Array<any>> = curr.getScopeTable()!.entries();
          for (let index: number = 0; index < entries.length; ++index) {
            innerHtml += `<br> ${entries[index][0]} | Type: ${entries[index][1].type}, Used: ${entries[index][1].isUsed}, isInitialized: ${entries[index][1].isInitialized}, Line: ${entries[index][1].lineNumber}, Pos:${entries[index][1].linePosition}`;
          }// for

          innerHtml += `</a>`;
          li.innerHTML = innerHtml;

          docFrag.getElementById(`scope-tree_p${programId}_li_node_id_${curr.parent_node.id}`)!.appendChild(ul);
        }// if

        // Node is 2nd or 3rd or nth child of parent
        else {
          let li: HTMLLIElement = document.createElement("li");
          li.id = `scope-tree_p${programId}_li_node_id_${curr.id}`;
          let innerHtml = `<a onclick="highlightSubtree(${programId}, ${curr.id}, 'SCOPETREE');" name = "node-anchor-tag" style="cursor: pointer;">${curr.name}`;

          // Fix empty scope table alignment
          if (curr.getScopeTable()!.isEmpty() && !curr.parent_node.getScopeTable()!.isEmpty()) {
            if (curr.parent_node.children_nodes.length === 2) {
              if (curr.parent_node.children_nodes[0].getScopeTable()!.isEmpty() && curr.parent_node.children_nodes[1].getScopeTable()!.isEmpty()) {
                li.style.paddingLeft = "32.5%";
              }// if
            }// if
          }// if

          // Add scope table
          let entries: Array<Array<any>> = curr.getScopeTable()!.entries();
          for (let index: number = 0; index < entries.length; ++index) {
            innerHtml += `<br> ${entries[index][0]} | Type: ${entries[index][1].type}, Used: ${entries[index][1].isUsed}, isInitialized: ${entries[index][1].isInitialized}, Line: ${entries[index][1].lineNumber}, Pos:${entries[index][1].linePosition}`;
          }// for

          innerHtml += `</a>`;
          li.innerHTML = innerHtml;

          docFrag.getElementById(`scope-tree_p${programId}_ul_node_id_${curr.parent_node.children_nodes[0].id}`)!.appendChild(li);
        }// else

        // Store all the children of 
        // current node from right to left.
        for (let i: number = curr.children_nodes.length - 1; i >= 0; --i) {
          nodes.push(curr.children_nodes[i]);
        }// for
      }// if
    }// while
  }// traverse tree
} // ScopeTreeComponent
