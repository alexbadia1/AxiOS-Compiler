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
import { DragScrollModule } from 'ngx-drag-scroll';
import { LexerOutputComponent } from './components/compiler/lexer-output/lexer-output.component';
import { OutputComponent } from './components/compiler/output/output.component';
import { AstComponent } from './components/compiler/ast/ast.component';
import {MatTreeModule} from '@angular/material/tree';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { ScopeTreeComponent } from './components/compiler/scope-tree/scope-tree.component';
import { OperatingSystemComponent } from './components/operating-system/operating-system.component';
import { ProcessesComponent } from './components/operating-system/processes/processes.component';
import { MemoryComponent } from './components/operating-system/memory/memory.component';
import { DiskComponent } from './components/operating-system/disk/disk.component';
import { HostLogComponent } from './components/operating-system/host-log/host-log.component';
import { ProgramInputComponent } from './components/operating-system/program-input/program-input.component';
import { ConsoleComponent } from './components/operating-system/console/console.component';
import { OpCodesComponent } from './components/compiler/op-codes/op-codes.component';
import { CpuOutputComponent } from './components/operating-system/cpu-output/cpu-output.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    CstComponent,
    LexerOutputComponent,
    OutputComponent,
    AstComponent,
    ScopeTreeComponent,
    OperatingSystemComponent,
    ProcessesComponent,
    MemoryComponent,
    DiskComponent,
    HostLogComponent,
    ProgramInputComponent,
    ConsoleComponent,
    OpCodesComponent,
    CpuOutputComponent,
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
    DragScrollModule,
    MatTreeModule,
    MatProgressSpinnerModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
