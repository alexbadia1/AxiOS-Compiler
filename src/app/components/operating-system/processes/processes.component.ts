import { Component, Input, OnInit } from '@angular/core';
import { PcbData } from 'src/app/services/operating-system/operating-system.service';

@Component({
  selector: 'app-processes',
  templateUrl: './processes.component.html',
  styleUrls: ['./processes.component.scss']
})
export class ProcessesComponent implements OnInit {
  @Input() processes: Array<PcbData>;

  constructor() { } // constructor

  ngOnInit(): void { } // ngOnInit
} // ProcessesComponent
