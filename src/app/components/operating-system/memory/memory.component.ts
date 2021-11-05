import { Component, Input, OnInit } from '@angular/core';
import { MemoryRow } from 'src/app/dashboard/dashboard.component';

@Component({
  selector: 'app-memory',
  templateUrl: './memory.component.html',
  styleUrls: ['./memory.component.scss']
})
export class MemoryComponent implements OnInit {
  @Input() memory: Array<MemoryRow>;

  constructor() { } // constructor

  ngOnInit(): void { } // ngOnInit
} // MemoryComponent
