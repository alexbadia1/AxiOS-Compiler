import { Component, Input, OnInit } from '@angular/core';
import { LexicalToken } from 'src/app/services/compiler/models/lexical_token';
import { OutputConsoleMessage } from 'src/app/services/compiler/models/output_console_message';

@Component({
  selector: 'app-output',
  templateUrl: './output.component.html',
  styleUrls: ['./output.component.scss']
})
export class OutputComponent implements OnInit {
  @Input() lexerOutput: Array<OutputConsoleMessage>;
  constructor() { }

  ngOnInit(): void {
  }

}
