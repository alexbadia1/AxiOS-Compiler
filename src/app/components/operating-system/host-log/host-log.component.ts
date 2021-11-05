import { Component, Input, OnInit } from '@angular/core';
import { HostLogData } from 'src/app/services/operating-system/operating-system.service';

@Component({
  selector: 'app-host-log',
  templateUrl: './host-log.component.html',
  styleUrls: ['./host-log.component.scss']
})
export class HostLogComponent implements OnInit {
  @Input() hostMessages: Array<HostLogData>;
  constructor() { }
  ngOnInit(): void { } // ngOnInit
} // HostLogComponent
