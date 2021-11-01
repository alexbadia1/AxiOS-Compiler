import { Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CustomNode } from '../services/compiler/models/node';
import { Program } from '../services/compiler/models/program';

@Component({
  selector: 'app-cst',
  templateUrl: './cst.component.html',
  styleUrls: ['./cst.component.scss'],

  // Quick hack to allow styling to apply
  encapsulation: ViewEncapsulation.None,
})

export class CstComponent implements OnInit {
  @ViewChild('cst') cstElement: ElementRef;
  @Input() program: Program;
  private cstDiv: HTMLDivElement;

  constructor() { }

  ngOnInit(): void { }

  ngAfterViewInit() {
    this.cstDiv = this.cstElement.nativeElement;

    if (this.program.isValid) {
      this.toHtml(this.program.cst.root, this.program.id);
    }// if
  }// 

  private toHtml(root: CustomNode, programId: number) {
    // Makes this work on angular!
    var docFrag: DocumentFragment = document.createDocumentFragment();

    // Initialize the result string.
    var tree_div: HTMLElement = document.createElement(`div`);
    tree_div.className = `tree`;
    tree_div.id = `cst_p${programId} `;
    docFrag.appendChild(tree_div);

    // Make the initial call to expand from the root
    // Create root first
    let ul: HTMLUListElement = document.createElement("ul");
    ul.id = `cst_p${programId}_ul_node_id_0`;
    let li: HTMLLIElement = document.createElement("li");
    li.id = `cst_p${programId}_li_node_id_0`;
    li.innerHTML = `<a onclick="NightingaleCompiler.CompilerController.compilerControllerBtnLightUpTree_click(${programId}, 0, 'CST');" name = "node-anchor-tag">${root.name}</a>`;
    ul.appendChild(li);
    tree_div.appendChild(ul);
    console.log(tree_div);

    this.traverse_tree(root, programId, docFrag);
    this.cstDiv.appendChild(docFrag);
  }// toHtml

  /**
   * Depth first traversal, to translate the tree into a series of <ul> and <li>.
   * 
   * Yes, this is a lot of brain damage.
   * 
   * @param root root node of the n-array tree
   */
  private traverse_tree(root: CustomNode, programId: number, docFrag: DocumentFragment) {
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
          ul.id = `cst_p${programId}_ul_node_id_${curr.id}`;
          let li: HTMLLIElement = document.createElement("li");
          li.id = `cst_p${programId}_li_node_id_${curr.id}`;

          ul.appendChild(li);

          li.innerHTML = `<a onclick="NightingaleCompiler.CompilerController.compilerControllerBtnLightUpTree_click(${programId}, ${curr.id}, 'CST');" name = "node-anchor-tag" >${curr.name}</a>`;

          // TODO: Fix more alignments
          // Single characters alignment are off... Add padding to the left.
          if (curr.name!.length >= 1 || curr.name!.length <= 3) {
            li.style.paddingLeft = "1.5rem";
          }// if
          docFrag.getElementById(`cst_p${programId}_li_node_id_${curr.parent_node.id}`.trim())!.appendChild(ul);
        }// if

        // Node is 2nd or 3rd or nth child of parent
        else {
          let li: HTMLLIElement = document.createElement("li");
          li.id = `cst_p${programId}_li_node_id_${curr.id}`;
          li.innerHTML = `<a onclick="NightingaleCompiler.CompilerController.compilerControllerBtnLightUpTree_click(${programId}, ${curr.id}, 'CST');" name = "node-anchor-tag">${curr.name}</a>`;

          // TODO: Fix more alignments
          // Single characters alignment are off... Add padding to the left.
          if (curr.name!.length >= 1 || curr.name!.length <= 3) {
            li.style.paddingLeft = "1.5rem";
          }// if

          docFrag.getElementById(`cst_p${programId}_ul_node_id_${curr.parent_node.children_nodes[0].id}`)!.appendChild(li);
        }// else

        // Store all the children of 
        // current node from right to left.
        for (let i: number = curr.children_nodes.length - 1; i >= 0; --i) {
          nodes.push(curr.children_nodes[i]);
        }// for
      }// if
    }// while
  }// traverse tree
}// CstComponent
