import { Component, OnInit } from '@angular/core';

interface MemoryMap {
  hex: string,
  locations: Array<number>
} // memory

@Component({
  selector: 'app-memory',
  templateUrl: './memory.component.html',
  styleUrls: ['./memory.component.scss']
})
export class MemoryComponent implements OnInit {
  memory: Array<MemoryMap> = [];
  constructor() { }

  ngOnInit(): void {
    // Generate memory
    let tmp: Array<number> = [];
    for (let i: number = 0; i <= 768; ++i) {
      if (i % 8 == 0 && i != 0) {
        this.memory.push({hex: (i-8).toString(16).padStart(3, "0"), locations: tmp})
        tmp = [];
      } // if

      tmp.push(i);
    }// for
  } // ngOnInit
} // MemoryComponent
