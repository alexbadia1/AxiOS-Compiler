import { Component, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-console',
  templateUrl: './console.component.html',
  styleUrls: ['./console.component.scss']
})
export class ConsoleComponent implements OnInit {
  @ViewChild('divConsole') divConsoleRef: HTMLCanvasElement;

  constructor() { }

  ngOnInit(): void {
  }

}
