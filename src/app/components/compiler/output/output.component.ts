import { Component, Input, OnInit } from '@angular/core';
import { OutputConsoleMessage } from 'src/app/services/compiler/src/models/output_console_message';

@Component({
  selector: 'app-output',
  templateUrl: './output.component.html',
  styleUrls: ['./output.component.scss']
})
export class OutputComponent implements OnInit {
  @Input() lexerOutput: Array<OutputConsoleMessage>;
  @Input() parserOutput: Array<OutputConsoleMessage>;

  constructor() { }

  ngOnInit(): void {
  }

}
