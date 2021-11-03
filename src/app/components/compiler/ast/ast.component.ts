import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { CustomNode } from 'src/app/services/compiler/src/models/node';
import { Program } from 'src/app/services/compiler/src/models/program';

@Component({
  selector: 'app-ast',
  templateUrl: './ast.component.html',
  styleUrls: ['./ast.component.scss']
})
export class AstComponent implements OnInit {
  @ViewChild('ast') astElement: ElementRef;
  @Input() program: Program;
  private astDiv: HTMLDivElement;

  constructor() { }

  ngOnInit(): void { }

  ngAfterViewInit() {
    this.astDiv = this.astElement.nativeElement;

    if (this.program.isValid) {
      this.toHtml(this.program.ast.root, this.program.id);
    }// if
  }// ngAfterViewInit

  public toHtml(root: CustomNode, programId: number) {
    // Makes this work on angular, due to race condition!
    var docFrag: DocumentFragment = document.createDocumentFragment();

    // Initialize the result string.
    var tree_div: HTMLElement = document.createElement(`div`);
    tree_div.className = `tree`;
    tree_div.id = `ast_p${programId} `;
    docFrag.appendChild(tree_div);

    // Make the initial call to expand from the root
    // Create root first
    let ul: HTMLUListElement = document.createElement("ul");
    ul.id = `ast_p${programId}_ul_node_id_0`;
    let li: HTMLLIElement = document.createElement("li");
    li.id = `ast_p${programId}_li_node_id_0`;
    li.innerHTML = `<a onclick="highlightSubtree(${programId}, 0, 'AST')" name = "node-anchor-tag" style="cursor: pointer;">${root.name}</a>`;
    ul.appendChild(li);
    tree_div.appendChild(ul);
    this.traverse_tree(root, programId, docFrag);
    this.astDiv.appendChild(docFrag);
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
          ///console.log(`Current: ${curr.name} | ${curr.id}, Parent: ${curr.parent_node.id}`);
        }// if

        // Node is the first node of the parent
        else if (curr.parent_node.children_nodes[0] == curr) {
          let ul: HTMLUListElement = document.createElement("ul");
          ul.id = `ast_p${programId}_ul_node_id_${curr.id}`;
          let li: HTMLLIElement = document.createElement("li");
          li.id = `ast_p${programId}_li_node_id_${curr.id}`;

          ul.appendChild(li);

          let innerHtml = `<a onclick="highlightSubtree(${programId}, ${curr.id}, 'AST')" name = "node-anchor-tag" style="cursor: pointer;">${curr.name}</a>`;
          li.innerHTML = innerHtml;
          // Single characters alignment are off... Add padding to the left.
          if (curr.name!.length >= 1 || curr.name!.length <= 3) {
            li.style.paddingLeft = "1.5rem";
          }// if

          // Yellow for warnings, overriden with red for errors
          if (curr.warningFlag) {
            li.style.color = "yellow";
          }// if
          if (curr.errorFlag) {
            li.style.color = "red";
          }// if

          // Docoument fragment is faster, as to avoid a race condition when appending an element then looking for it quickly after...
          docFrag.getElementById(`ast_p${programId}_li_node_id_${curr.parent_node.id}`)!.appendChild(ul);
        }// if

        // Node is 2nd or 3rd or nth child of parent
        else {
          let li: HTMLLIElement = document.createElement("li");
          li.id = `ast_p${programId}_li_node_id_${curr.id}`;

          let innerHtml = `<a onclick="highlightSubtree(${programId}, ${curr.id}, 'AST')" name = "node-anchor-tag" style="cursor: pointer;">${curr.name}</a>`;
          li.innerHTML = innerHtml;

          // Single characters alignment are off... Add padding to the left.
          if (curr.name!.length >= 1 || curr.name!.length <= 3) {
            li.style.paddingLeft = "1.5rem";
          }// if

          // Yellow for warnings, overriden with red for errors
          if (curr.warningFlag) {
            li.style.color = "yellow";
          }// if
          if (curr.errorFlag) {
            li.style.color = "red";
          }// if

          // Docoument fragment is faster, as to avoid a race condition when appending an element then looking for it quickly after...
          docFrag.getElementById(`ast_p${programId}_ul_node_id_${curr.parent_node.children_nodes[0].id}`)!.appendChild(li);
        }// else

        // Store all the children of 
        // current node from right to left.
        for (let i: number = curr.children_nodes.length - 1; i >= 0; --i) {
          nodes.push(curr.children_nodes[i]);
        }// for
      }// if
    }// while
  }// traverse tree
} // AstComponent
