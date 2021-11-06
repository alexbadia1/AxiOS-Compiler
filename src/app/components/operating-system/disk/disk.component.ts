import { Component, Input, OnInit } from '@angular/core';
import { SessionStorageWrapper } from 'src/app/dashboard/dashboard.component';

@Component({
  selector: 'app-disk',
  templateUrl: './disk.component.html',
  styleUrls: ['./disk.component.scss']
})
export class DiskComponent implements OnInit {
  @Input() sessionStorageWrapper: SessionStorageWrapper;

  constructor() { } // constructor

  ngOnInit(): void { } //ngOnInit

} // DiskComponent
