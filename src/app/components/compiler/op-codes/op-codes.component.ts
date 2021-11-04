import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-op-codes',
  templateUrl: './op-codes.component.html',
  styleUrls: ['./op-codes.component.scss']
})
export class OpCodesComponent implements OnInit {
  @Input() executableImage: string;

  constructor() { }

  ngOnInit(): void {
  }

}
