# AxiOS Compiler

A Compiler and Operating System all in one dashboard!

Nightingale Copmiler: compiles a custom coding language to 6502a Op Codes, providing well defined compilation feedback.
AxiOS Operating System: runs 6502a OP codes, with it's own command line interface, file system, virtual memory, and more.

See this project on git-pages: https://alexbadia1.github.io/AxiOS-Compiler/

# Getting Started
  Here are the system requirements to run this project (on Windows at least):
  1. Install [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) package manager 
  2. Install typescript -> `npm install -g typescript`
  3. Install angular cli -> `npm install -g @angular/cli`


## Development server
  So you want to run this locally on your computer?
  
  1. Clone the project `git clone https://github.com/alexbadia1/AxiOS-Compiler.git`
  2. In the root project directory run `ng serve`
  3. Navigate to `http://localhost:4200/`
  4. The app will automatically reload if you change any of the source files (you probably already knew that)

## Production
  
  I have little experience running Angular applications in production but here's what I did:
  1. Make sure your memory constraints are big enough.
  2. Changed the output folder to `docs/` (for git-pages)
  3. Ran `ng build --base-href "#"` to build the project. 
  4. The build artifacts will be stored in the `docs/` directory.


## Built With

- Visual Code Studio
- Angular 12
- Typescript
- SCSS
