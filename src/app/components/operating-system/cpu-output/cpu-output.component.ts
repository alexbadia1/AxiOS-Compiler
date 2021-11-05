import { Component, Input, OnInit } from '@angular/core';
import { CpuData } from 'src/app/services/operating-system/operating-system.service';

@Component({
  selector: 'app-cpu-output',
  templateUrl: './cpu-output.component.html',
  styleUrls: ['./cpu-output.component.scss']
})
export class CpuOutputComponent implements OnInit {
  @Input() cpuData: CpuData;
  
  constructor() { } // constructor

  ngOnInit(): void { } // ngInit()
}
