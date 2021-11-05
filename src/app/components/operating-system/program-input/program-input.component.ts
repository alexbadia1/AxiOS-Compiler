import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-program-input',
  templateUrl: './program-input.component.html',
  styleUrls: ['./program-input.component.scss']
})
export class ProgramInputComponent implements OnInit {
  @Input() opCodes: string;
  @Output() changeEcho: EventEmitter<string> = new EventEmitter<string>();
  // @Input() opCode$: Subject<string>;

  constructor() { } // constructor

  ngOnInit(): void { } // ngonInit

  change(c: any) {
    // if (this.opCode$ == undefined && this.opCode$ == null) { return; }
    // this.opCode$.next(this.opCodes);
    this.changeEcho.emit(this.opCodes);
  } //change
} // ProgramInputComponent
