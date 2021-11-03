import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-operating-system',
  templateUrl: './operating-system.component.html',
  styleUrls: ['./operating-system.component.scss']
})

/**
 * Interacts with the Operating System
 * by sending keydown and button events.
 */
export class OperatingSystemComponent implements OnInit {
  constructor(
  ) { } // constructor

  ngOnInit(): void { } // ngOnInit
} // OperatingSystemComponent
