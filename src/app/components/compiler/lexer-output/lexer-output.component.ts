import { Component, Input, OnInit } from '@angular/core';
import { LexicalToken } from 'src/app/services/compiler/models/lexical_token';
import { OutputConsoleMessage } from 'src/app/services/compiler/models/output_console_message';

@Component({
  selector: 'app-lexer-output',
  templateUrl: './lexer-output.component.html',
  styleUrls: ['./lexer-output.component.scss']
})
export class LexerOutputComponent implements OnInit {
  @Input() lexerOutput: Array<OutputConsoleMessage>;
  @Input() tokens: Array<LexicalToken>;

  constructor() { }

  ngOnInit(): void { }

}
