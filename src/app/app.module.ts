import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MonacoEditorModule } from '@materia-ui/ngx-monaco-editor';
import { AngularSplitModule } from 'angular-split';
import {MatTabsModule} from '@angular/material/tabs';
import { CstComponent } from './components/compiler/cst/cst.component';
import { NodeComponent } from './node/node.component';
import { DragScrollModule } from 'ngx-drag-scroll';
import { CliComponent } from './cli/cli.component';
import { LexerOutputComponent } from './components/compiler/lexer-output/lexer-output.component';
import { OutputComponent } from './components/compiler/output/output.component';
import { AstComponent } from './components/compiler/ast/ast.component';




@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    CstComponent,
    NodeComponent,
    CliComponent,
    LexerOutputComponent,
    OutputComponent,
    AstComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatSidenavModule,
    FormsModule,
    MatToolbarModule,
    MatIconModule,
    MatGridListModule,
    MonacoEditorModule,
    AngularSplitModule,
    MatButtonModule,
    MatTabsModule,
    DragScrollModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
