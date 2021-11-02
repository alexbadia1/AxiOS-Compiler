import { Injectable } from '@angular/core';
import { Program } from './models/program';

@Injectable()
export class CodeGenerationService {

  constructor() { } // cconstructor

  public codeGeneration(programs: Array<Program>): Map<string, any> {
    
    return new Map<string, any>();
  } // codeGeneration





} // CodeGenerationService
