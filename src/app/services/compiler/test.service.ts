import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TestService {
  /**
   * default_tests.js
   * 
   */

  /**
   * Long Test Case - Everything Except Boolean Declaration
   * 
   * Should pass all the way to code gen.
   */
  public LONG_TEST_CASE =
    "/*Long Test Case - Everything Except Boolean Declaration */\n"
    + "{\n"
    + "\t/* Int Declaration */\n"
    + "\tint a\n"
    + "\tint b\n"
    + "\ta = 0\n"
    + "\tb=0\n"
    + "\t/* While Loop */\n"
    + "\twhile (a != 3) {\n"
    + "\t\tprint(a)\n"
    + "\t\twhile (b != 3) {\n"
    + "\t\t\tprint(b)\n"
    + "\t\t\tb = 1 + b\n"
    + "\t\t\tif (b == 2) {\n"
    + "\t\t\t\t/* Print Statement */\n"
    + "\t\t\t\tprint(\"there is no spoon\" /* This will do nothing */ )\n"
    + "\t\t\t}\n"
    + "\t\t}\n"
    + "\t\tb = 0\n"
    + "\t\ta = 1+a\n"
    + "\t}\n"
    + "}\n"
    + "$";

  /**
   * Long Test Case - Everything Except Boolean Declaration
   * 
   * Should pass all the way to code gen.
   */
  public ALANS_PROJECT_ONE_TEST = `/** 
  * Valid program with only one empty block
  *   - Should Pass Lex
  *   - Should Pass Parse
  *   - Should Pass Semantic Analysis?
  *     Should I really allow empty programs to go this far, or is removing it an optimization?
  *   - Code Generation?
  */
  {}$
  /** 
  * Valid program with one block and five nested blocks.
  *   - Should Pass Lex
  *   - Should Pass Parse
  *   - Should Pass Semantic Analysis?
  *     Should I really allow empty programs to go this far, or is removing it an optimization?
  *   - Code Generation?
  */
  {{{{{{}}}}}}$
  /** 
  * Invalid program six open block symbols, seven close block symbols.
  *   - Should Pass Lex
  *   - Should Fail Parse
  *   - Should Fail Semantic Analysis (By Default)
  *   - Should Fail Code Generation (By Default)
  */
  {{{{{{}}} /* comments are ignored */}}}}$
  /** 
  * Invalid program because of invalid @ symbol.
  *   - Should Fail Lex
  *   - Should Fail Parse (By Default)
  *   - Should Fail Semantic Analysis (By Default)
  *   - Should Fail Code Generation (By Default)
  */
  {/*comments are still ignored */ int @}$\n`;

  public ALANS_PROJECT_TWO_TEST = `/* You’re expecting anything that could start a statement or SYMBOL_CLOSE_BLOCK. */
  {a=12}$
  {1 = 2}$
  /* You’re expecting any Bool_Expression */
  {
      while "a" {
          print ( "a" )
      }  
      print ( "done" )
  }$
  /* Checking to make sure this works */
  {
      while (1 == 1) {
          print(true)
      }
  }$
  `;

  public ALANS_PROJECT_THREE_TEST = `/* Valid test case */
  {
      int a	
      boolean b
      {	
          string	c	
          a = 5
          b = true /*nocomment*/
          c = "int a" 
          print(c)
      }
      
      print(b)
      print(a)
  }$	
  /* Should fail due to missing variable declaration for 'b' */
  {
      int a
      {
          boolean b
          a = 1
      }
      print(b)
  }$`;

  /**
   * lexer_tests.js
   * 
   * Lexer tests are loaded on the html page and visible to the user.
   * 
   * This test file specifically tests the "tokenziabilty" of the Lexer in the compiler.
   */

  /**
   * Lexer should determine the difference between Assingment Op [=], Boolean Equals [==] and Boolean Not Equals [!=]
   * based on a longest match algorithm. If your lexer outputs the first token as Assingment Op [=]... Something is very wrong...
   */
  public RANDOM_BOOL_OPS_TEST = `== = = =!==!=!=!= == !== = != == ===!=!===!== =!===!=== ==!== !==!=!= !==!=!=!==!==`;

  /**
   * Can your lexer determine illegal symbols...
   * For example how does your lexer know that != is legal but ! alone is illegal?
   */
  public SYMBOL_SALAD = `/* I will be very suprised if this doesn't break my lexer.
  The illegal symbols detected should be: !, [, #, &, *, #, @, !, @, &, *, #, @, ! */
  {{}+{}{=!{}{!=[}}{=)()*}{+#&*#@}{!@&*#@}+!`;

  /**
   * Really good way to test the longest matching principle... Also tests priority differences between keywords, id's and spaces
   */
  public LETTER_SOUP = `/* A mix of keywords, ids, symbols and
  illegal characters. There should be 3 errors*/
  int#aintb+intwh\tile{printfortrue==intift/*Did you make it this far? */true!ifi(fwhile=!false}print)stringa b c!=efg\"string\"while$`;

  /**
   * Read Alan's language carefully, and carefully reject terminals not part of the "Charlist" non-terminal.
   */
  public BROKEN_STRINGS =
    "/* Strings can accept [a-z] single_space, maybe a tab, but nothing else...\n"
    + "\t Thus we reject: commas (,), parenthesi? (), uppercase!, etc.*/\n"
    + "{\n"
    + "\tprint(\n"
    + "\t\t\"The common nightingale, rufous nightingale or simply nightingale (Lusciniea megarhynchose),\n"
    + "\t\tis a small passerine bird best known for its powerful and beautiful song.\"\n"
    + "\t)\n"
    + "}\n"
    + "$\n\n"
    + "/* This ones unterminated! */\n"
    + "print(\"Common nightingales are so named because they...);$";

  /**
   * Make sure comments are ignored...
   * What happens if your lexer is missing a close comment? What about nested comments? You decide.
   * 
   * Really, you can catch them now in Lex, or make more work for yourself in Parse... your choice...
   */
  public BROKEN_COMMENTS =
    "/* These comments are broken, except for one of them... */\n\n"
    + "/* /* /* \"Nightingale\" is derived from \"night\", and the Old English galan,\n"
    + "\"to sing\". The genus name Luscinia isLatin for \"nightingale\" and megarhynchos\n"
    + "is from Ancient Greek megas,\"great\" and rhunkhos \"bill\" */ */ */\n\n"
    + "/* The common nightingale is slightly larger than the European robin, at 15–16.5 cm (5.9–6.5 in) length.\n"
    + "It is plain brown above except for the reddish tail. It is buff to white below. The sexes are similar. The eastern\n"
    + "subspecies (L. m. golzi) and the Caucasian subspecies (L. m. africana) have paler upperparts and a stronger face-pattern,\n"
    + "including a pale supercilium. The song of the nightingale[6] has been described as one of the most beautiful\n"
    + "sounds in nature, inspiring songs, fairy tales, opera, books, and a great deal of poetry.\n";


  /**
   * parser_tests.js
   * 
   * Parser tests are loaded on the html page and visible to the user.
   * 
   * This test file specifically tests the Recursive Descent LL(1) Parse Algorithm in the compiler.
   */

  /**
   * Parser should catch an incomplete expression and fail
   */
  public INCOMPLETE_EXPRESSIONS =
    `/* Incomplete Expressions, Parse should throw error(s)*/\n`
    + `{\n`
    + `\twhile (a != ) {\n`
    + `\t\tprint("this should not work")\n`
    + `\t}\n`
    + `}$\n\n`
    + `/* Incomplete Assignment Operation */\n`
    + `{\n`
    + `\t{\n`
    + `\t\ta = 0 + 1\n`
    + `\t\tb = 1 + 2\n`
    + `\t\tc = 2 +\n`
    + `\t}\n`
    + `}$\n\n`;

  /**
   * Parser should catch invalid decalarations and fail, but pass on valid declarations
   */
  public TRICKY_DECLARATIONS =
    `/* Tricky Declarations */\n`
    + `{\n`
    + `\tint x\n`
    + `\tint y = x\n`
    + `\tz = x + y\n`
    + `}$\n\n`
    + `/* Bool Declaration */\n`
    + `{\n`
    + `\tboolean x\n`
    + `\tboolean y\n`
    + `\t while (x != y){}\n`
    + `\t if (true != false)\n`
    + `}$\n\n`
    + `/* This should fail */\n`
    + `{\n`
    + `\tboolean x\n`
    + `\tboolean y\n`
    + `\t while (x != y){}\n`
    + `\t if ((true != false))\n`
    + `}$\n\n`;

  /**
   * Parser should pass, even though semantically incorrect
   */
  public TRICKY_ASSIGNMENT_STATEMENTS = `
  /* This is a valid parse... hmm... */
  {
    a = 1 + (true == false)
  }$
  /* This is a valid parse as well.. */
  {
      a = 1 + "hmmmmmmmm"
  }$`;

  /**
   * Parser should pass, even though semantically incorrect
   */
  public CRAZY_BOOLEAN_EXPRESSION =
    `/* This is theoretically correct.. I'll be damned if my computer doesn't blow up from this. */\n`
    + `{\n`
    + `\tif( (((true != false) == (false == true)) == false) != true ){\n`
    + `\t\t print("wow")\n`
    + `\t}\n`
    + `}$\n\n`
    + `/* Broken program for more chaos */\n`
    + `}$\n\n`;

  /**
   * A test from the SONARS Compiler
   */
  public SONARS_STRING_DECLARATION =
    `/* SONARS TEST CASE: This will fail because an identifier is expected but not provided */
  {
    /* 1 is not a valid identifier */
    string 1
  }$`;

  /**
   * A test from the SVEGLIATOR compiler
   */
  public SVEGLIATOR_INVALID_PROGRAM =
    `
  /* SVEGLIATOR TEST CASE: Should pass lex, parse, but fail at semantic analysis...*/
  {
    int a
    a = 1
    print(a)
    {
        int a
        a = 2
        print(a)
    }
    {
        int a
        a = 3
        print(a)
    }
    string s
    s = "stra"
    print(s)
    s = "strb"
    print((s == "str"))
    if (a != 5) {
        print((true == (s == s)))
    }
    if (a == 5) {
        print("false")
    }
    s = "meowa"
    s = "meowb"
    s = "meowc"
    s = "meowd"
    s = "meowe"
    s = "meowf"
    int z
    z = 5
  } $`;

  /**
   * A test from the Juice Compiler
   */
  public JUICE_COMPILER_CRAZY_ONE_LINER =
    "/* JUICES TEST CASE Test case for crazy one liner */\n"
    + "${hellotruefalse!======trueprinta=3b=0print(\"false true\")whi33leiftruefalsestring!= stringintbooleanaa truewhileif{hi+++==!==}}/*aaahaha*/hahahahaha/*awao*/$";

  /**
   * semantic_tests.js
   * 
   * Semantic Analysis tests are loaded on the html page and visible to the user.
   * 
   * This test file specifically tests the Depth First In Order Traversal Semantic Analysis Algorithm in the compiler.
   */

  /**
   * Should create an INVALID AST, visible to the user and should pass.
   */
  public INTEGER_ASSIGNMENTS = `/* Obviously missing varible decalarations, but still a good test for your tree */
  {
    {
        x = 1 + 2 + 3
          y = 6 + 7
          p = 1 
          o = 9 + 8 
          w = 4 + 5 + 0
      }
      
    a = 1
    b = 1 + 2
      c = 3 + 4 + 5
      d = 5 + 6 + 7
      e = 7 + 8
      f = 9
      
      {
        z = 1 + 2 + 3 + 4 + 5 + 6 + 7 + 9
      }
  }$`;

  /**
   * Should create an INVALID AST, visible to the user and should pass.
   */
  public STRING_ASSIGNMENTS = `/* Obviously missing varible decalarations, but still a good test for your tree */
  {
    {
        x = "abc"
          y = "e"
          p = "fghijklm" 
          o = "nop" 
          w = "qrstuvwxyz"
      }
      
    a = "qrstuvwxyz"
    b = "nop" 
      c = "e"
      d = "fghijklm"
      e = "abc"
      f = "z"
      {
        z = "abcdefghijklmnopqrstuvwxyz"
      }
  }$`;

  /**
   * Should create an INVALID AST, visible to the user and should pass.
   */
  public ULTIMATE_ASSIGNMENT_TEST = `/* Semantically incorrect, but make sure your AST structure is correct */
  {
      /* This is technically syntactically correct, though semantically is full of issues */
      r = 1 + (true == (1 != "hi"))
      /* Testing scopes as well... */
    {
        x = "abc"
          y = "e"
          p = 1 + true
          w = "qrstuvwxyz"
          /* How 'bout another scope? */
          {
              x = 1 + 2 + 3
              y = 6 + 7
              p = 1 
      
              /* Tricky, but syntactically valid */
              o = 9 + (false != ("a" == "a"))
              w = 4 + 5 + 0
          }
      }
      
      a = 1
    b = 1 + 2
    a = "qrstuvwxyz"
      d = "fghijklm"
      e = "abc"
      f = "z"
      d = 5 + 6 + 7
      e = 7 + 8
      /* Has your computer blown up yet? */
      {
          /* Some easy tests now */
        z = "abcdefghijklmnopqrstuvwxyz"
          z = 1 + 2 + 3 + 4 + 5 + 6 + 7 + 9
          z = (true == (false == ("a" != "b")))
      }
  }$`;

  /**
   * Should create an INVALID AST, visible to the user and should pass.
   */
  public PRINT_STATEMENTS_TESTS = `/* Here's a bunch of print statements */
  {
    print("i")
      print("think")
      
      {
        print("i")
        print("can")
          
          print("i")
        print("think")
          print("i")
          
          {
        print("can")       
          }
      }
      
    print("i")
    print("think")
      print("")
      print("i")
      print("")
      print("can")
  }$`;

  /**
   * Should create an INVALID AST, visible to the user and should pass.
   */
  public WHILE_STATEMENTS_TEST = `/* Here's a bunch of while loops, should create a AST...
  whether it's valid or not is a different story... */
  {
    while true {
      while true {
            print("hello world")
      }
          while true {
            print("hello world")
              
              while (1 != 3) {
              print("hello world")
              }
      }
          
          while (1 != 3) {
            print("hello world")
      }
    }
  }
  $
  `;

  /**
   * Should create an INVALID AST, visible to the user and should pass.
   */
  public IF_STATEMENTS_TEST = `/* Here's a bunch of If statements, should create a AST...
  whether it's valid or not is a different story... */
  {
      if true {
          if true {
              print("hello world")
              if true {
                  print("hello world")
              }
          }
          if (1 != 3) {
              print("hello world")
              
              if true {
                  print("hello world")
              }
              if (1 != 3) {
                  print("hello world")
              }
          }
          
          if (1 != 3) {
              print("hello world")
          }
          if true {
              print("hello world")
          }
      }
  }
  $
  `;

  public SCOPE_TREE_TEST = `/*
  Scope tree test.
      (Scope)
      * a | Type: int Used: true, Line: 4, Pos:5
      * d | Type: int Used: false, Line: 7, Pos:5
      * z | Type: int Used: true, Line: 9, Pos:5
      - (Scope)
      -- [Scope]
      - (Scope)
      -- (Scope)
      --- [Scope]
      **** b | Type: int Used: false, Line: 5, Pos:8
      - [Scope]
      ** c | Type: int Used: false, Line: 6, Pos:6
      - (Scope)
      ** e | Type: int Used: false, Line: 8, Pos:6
      -- [Scope]
      *** f | Type: int Used: false, Line: 8, Pos:13
      - [Scope]
  */
  {
      {
          {
          }
      }
      
      int a
      
      {
          {
              {
                  int b
              }
          }
      }
      {
          int c
      }
      int d
      {
          int e 
          {
              int f
          }
      }
      int z
      {
          z = 3 
          a = 3
      }
  }$`;

  public SIMPLE_MISSING_VARIABLES = `/* Unintialized identifiers, with some missing identifiers too and type checking too... */
  {
      int a
      string b
      string c
      boolean e
      int f /* f is never read */
      /* Missing initializations */
      print(a)
      print(b)
      print(c)
      print(d) /* Missing declaration */
      if (d == d) {} /* Missing declaration */
      while((b == e) != (a == 2)) {} /* Type mismatch error */
  }$
  `;

  /**
   * Legacy Tests
   */
  public CHRONOS_NESTED_EVERYTHING = `/* This project used significantly different languages than ours, let's see what happens... */
  {
      int i
      i = 0
      
      int j
      j = 0
      
      while (j == 0) {
          i = 1 + i
          
          if (i == 3) {
              j = 1
          }
          
          int g
          g = 0
          
          int h
          h = 0
          
          while (h == 0) {
              g = 1 + g
              
              if (g == 2) {
                  h = 1
              }
              
              print("i")
              print(g)
          }
          
          print("o")
          print(i)
          print(" ")
      }
  } $
  `;

  public ANDREW_B_INFINTIE_LOOP = `/* Andrew B's Compiler Inifinite Loop*/
  {
    int x
    x = 0
    while true {
      x = 1 + x
      print(x)
    }
  } $`;

  public ROB_WHITAKER_TEST_THREE = `/* Rob Whitaker's Test 3, modified to at least make it to semantic analysis... */
  {
      int a
      a = 0
      
      int m
      m = 2 + 1
      
      boolean b
      b = true
      string s
      s = "int a equals "
      print("begin loop ") /* Modifed to "begin loop" to pass lex due to capital letters*/
      while(b != false) {
          print(s)
          print(a)
          print(" ")
          a = 1+a
          if(a == 2+m) {
              b = false
          }
      }
      print("end of loop")/* Modifed to "end of loop" to pass lex due to capital letters*/
  }$`;

  public JUICE_COMPILER_BOOLEAN_HELL = `/* Juice Compiler's boolean hell, who they credit "TIEN" for */
  {
      int a
      a = 0
      boolean b
      b = false
      boolean c
      c = true
      while(((a!=9) == ("test" != "alan")) == ((5==5) != (b == c))) {
          print("a")
          string d
          d = "yes"
          print(d)
          {
              int a
              a = 5
          }
      }
  }$`;

  /**
   * Boolean Comparison tests
   */
  public CODE_GEN_BOOLEAN_VALUE_TEST = `/**
  * Ouput: falsetruetruefalsetruefalse
  */
  {
    print((true == false))
    print((true != false))
    print((true == true))
    print((true != true))
    print((false == false))
    print((false != false))
  }$`;

  public CODE_GEN_BOOLEAN_EXPRESSION_TEST = `/**
  * Albeit, we only have 256 bytes, this was impractical to implement as such
  * comparisons take up a lot of memory (given our limited instuction set)... 
  * 
  * Hoewever, it works!
  * 
  * Boolean Expression Tests
  */
  {
    /* Declare variables */
    int a
    string b
    string c
    boolean z
      c = "hmm"
    z = (((a!=9) == ("a" != "b")) == ((5==5) != (b == c)))
    /* Boolean Hell should print true */
    print(z)
  }$
  /**
  * Advanced Boolean Expression Test
  * (5 + 2 + 3 == 9 + 1) --> true
  * (wow != wow) --> false
  * 
  * true == false --> false
  * 
  * (3 == 5) --> false
  * (d == e) --> (false == false) --> true
  * 
  * false != true --> true
  * 
  * Answer: false == true --> false
  * 
  * Should output false
  */
  {
    /**
    * This is laughably impractical, as this barely fits in memory 
    * 
    * There are a few more optimizations I could made to save a few more bytes,
    * but given the time and brain damage it took to implement this, I'm fine...
    */
    print((((5 + 2 + 3 == 9 + 1) == ("wow" != "wow")) == ((3==5) != (true == true))))
  }$`;

  public CODE_GEN_BOOLEAN_INTEGER_VALUE_TEST = `/**
  * Output: false true false true
  */
  {
    print((1 != 1))
    print((1 == 1))
    print((2 == 3))
    print((3 != 4))
  }$`;

  public CODE_GEN_BOOLEAN_INTEGER_EXPRESSION_TEST = `/**
  * Ouput: t true f false
  * 
  * Sadly, we only have 256 bytes of memory to work with.
  * Given our current instruction set, boolean comparisons of 
  * integer expression are extremely costly. Use sparingly!
  */
  {
    /* Integer Expression Comparisons */
      print("t ")
    print((1 + 2 + 3 == 3 + 2 + 1))
      print(" f ")
    print((1 + 2 + 3 != 3 + 2 + 1))
  }$`;

  public CODE_GEN_STRING_VALUE_TEST = `/**
  * Output: true false true false
  */
  {
    /* Test two new entries against each other */
    print(("hi" != "hola"))
    /* Test two existing entries against each other */
    print(("hi" == "hola"))
    /* Testing a new and existing entry against each other */
    print(("bye" == "bye"))
    print(("adios" != "adios"))
  }$`;

  public CODE_GEN_IDENTIFIER_BOOLEAN_TEST = `
  /* Int Test Output: 20 equals 18 is false while 20 not equals 18 is true */
  {
    int a
    int b
    a = 9 + 7 + 4
    b = 3 + 3 + 3 + 9
      
      print(a)
    print (" equals ")
      print(b)
      print(" is ")
    print((a == b))
      print(" while ")
      print(a)
    print (" not equals ")
      print(b)
      print(" is ")
    print((a != b))
  }$
  /* Boolean Test Output: false equals true is false while true not equals false is true */
  {
    
    boolean a
    boolean b
    a = true
    print(b)
    print (" equals ")
      print(a)
      print(" is ")
    print((b == a))
      print(" while ")
      print(a)
    print (" not equals ")
      print(b)
      print(" is ")
    print((a != b))
  }$
  /* String Test: aatrueaafalseaatruecafalse*/
  {
    string x
    string y
      
      /* Musical chairs with the string pointers */
    x = "a"
      y = "a"
      {
        x = "a"
        x = "c"
          
          /* This is true */
          string x
          x = "a"
      /* True: "a" == "a" */
      print(x)
      print(y)
      print((x == y))
          
          {
            string y
              y = "a"
              
            /* True: "a" != "a" */
        print(x)
        print(y)
        print((x != y))
        {
          /* False: "a" == "a" */
          print(x)
          print(y)
          print((x == y))
        }
          }
      }
    /* False: "c" == "a" */
    print(x)
    print(y)
    print((x == y))
  }$`;

  public CODE_GEN_SCOPE_TEST = `/**
  * Code generation scope checking, be sure you traverse the scop tree depth first in order!
  * 
  * Standard output should be:
  *   - 9
  *   - true
  *   - hello world
  *   - 0
  *   - 12
  *   - false
  * */
  {
    /* Int Declaration */
    int a
    boolean b
    string c
    a = 9
    b = true
    /* New scope */
    {
      print(a)
          print(b)
      b = false
      c = "hello world"
      int b
      b = 0
      {
        print(c)
        a = 1 + 2 + a
        {
          print(b)
        }
      }
      b = a
      print(b)
    }
    print(b)
  }
  $`;

  public CODE_GEN_STRING_SCOPE_TEST = `/* Sadly we're only working with 256 byte of memory so these tests are limited... */
  {
    /* Strings are initialized to null by default */
      string a
      string b
      string c
    /* Requires a new heap entry */
      a = "two"
      
      {
      /* Also requires a new heap entry */
      a = "one"
      }
      
    {
        /* Make sure pointer updated */
      print(a)
      }
      
    /* Already exists in the heap, NO new heap entry */
    print("two")
    /* Requires new heap entry */
    print("three")
    /**
    * These already exists in the heap, no new entries required
    * 
    * Really just pointer musical chairs at this point...
    */
    b = "one"
    print(b)
      {
        
      b = "two"
      print(b)
      b = "three"
      {
            print(b)
        b = "true"
        print(b)
        b = "false"
          }
          
      print(b)
      
      }
    b = "null"
    print(b)
    {
        {
          /* Strings string should be initialized to null in the heap */    
        print(c)
          }
      }
  }
  $`;

  /**
   * Core Tests:
   *   - Scope
   *   - Variable Declarations
   *   - Print Statements
   *   - Assignment Statements
   *   - Heap pointer
   *   - if
   *   - while
   *   - etc.
   */
  public CODE_GEN_VARRIABLE_DECLARATIONS_TEST = `/**
  * Testing variable declarations. 
  * Semantic Analysis should warn that these are 
  * declared and unused, but code generation should 
  * be fine (there's just no output for this program)
  */
  {
    /* Int Declaration */
    int a
      boolean c
      string d
      
      {
        {}
        {int a}
        {boolean c}
        string d
      }
      
      string x
      int y
      boolean z
  }
  $`;

  public CODE_GEN_PRINT_TEST = `/** 
  * Sadly we're only working with 256 byte of memory so these tests are limited...
  * 
  * First, declare variables first to pass semantic analysis 
  */
  {
      int a
      boolean b
      string c
    /* Basic print statements */
      print(true)
      print(false)
      print("hello world")
    print(9)
    /* Print identifiers */    
      print(a)
      print(b)
      print(c)
    /* Int expressions */
    print(1 + 2 + 3 + 2 + 1)
    /* Int Expressions With Identifiers */
    a = 9
    print(1 + 2 + 3 + 4 + 5 + a) 
  }
  $`;

  public CODE_GEN_STRING_POINTERS_TEST = `/* Sadly we're only working with 256 byte of memory so these tests are limited... */
  {
    /* Strings are initialized to null by default */
      string a
      string b
      string c
    /* Requires a new heap entry */
      a = "two"
    /* Also requires a new heap entry */
    a = "one"
    /* Make sure pointer updated */
    print(a)
    /* Already exists in the heap, NO new heap entry */
    print("two")
    /* Requires new heap entry */
    print("three")
    /**
    * These already exists in the heap, no new entries required
    * 
    * Really just pointer musical chairs at this point...
    */
    b = "one"
    print(b)
    b = "two"
    print(b)
    b = "three"
    print(b)
    b = "true"
    print(b)
    b = "false"
    print(b)
    b = "null"
    print(b)
    /* Strings string should be initialized to null in the heap */    
    print(c)
  }
  $`;

  public CODE_GEN_IF_TEST = `{
    /* Output: a equals b showing a 4 a not equals b showing b 5 */
    int a
    a = 3
    int b
    b = 4
    a = b
    if (a== b) {
      print("a equals b showing a ")
      print(a)
    }
    b = 1 + a
    if (a != b) {
      print(" a not equals b showing b ")
      print(b)
    }
  }$
  /**
  * Another Code Generation Example
  * 
  * Output: 2 alan
  */
  {
    int a
    a = 1
    {
      int a
      a = 2
      print(a)
    }
      string b
      b = "alan"
    if (a == 1) {
      print(" ")
      print(b)
    }
  }$
  /**
  * Now let’s make it more complicated by
  *   - adding another string 
  *   - changing the value of an existing string
  * 
  * Ouput: 2 alan null blackstone james
  */
  {
    int a
    a = 1
    {
      int a
      a = 2
      print(a)
    }
    string b
    b = "alan"
    if(a == 1) {
      print(" ")
      print(b)
    }
    string c
    /* Show null pointer */
    print(" ")
    print(c)
    c = "james"
    b = "blackstone"
    print(" ")
    print(b)
    print(" ")
    print(c)
  }$`;

  public CODE_GEN_WHILE_TEST = `/**
  * Integer expression test 
  *
  * Output: 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 done 
  */
  {
    int a
    int b
    b = 1
    while (8 + 9 + b != 1 + a) {
      a = 1 + a
      print(a)
      print(" ")
    }
    print("done")
  }$
  /**
  * Integer Value test
  */
  {
    int a
    a = a
    while(a != 5) {
      a = 1 + a
      print(" ")
      print(a)
    }
  }$
  /* String expression test */
  {
    int a
    string b
    while (b == "null") {
      while (a != 9 + 1) {
        a = 2 + a
        if (a == 9 + 1) {
          b = "hello world"
        }
      }
    }
    /* Ouput "hello world" */
    print(b)
  }$`;

  /**
   * Edge cases
   */
  public CODE_GEN_BIG_INT_TEST = `{
    /**
    * Big Integer Test:
    * 
    * 29 * 9 = 261
    * 
    * The operating systems were only designed to hold a 1 byte number:
    *   - Some Operating Systems will print 261.
    *   - Others will wrap past 261, resulting in 261 mod 256 = 5.
    *   - And finally, maybe some might explode...!
    * */
    print(9 + 9 + 9 + 9 + 9 + 9 + 9 + 9 + 9 + 9 + 9 + 9 + 9 + 9 + 9 + 9 + 9 + 9 + 9 + 9 + 9 + 9 + 9 + 9 + 9 + 9 + 9 + 9 + 9)
  }
  $`;

  public CODE_GEN_STATIC_AREA_OVERFLOW_TEST = `{
    string a 
      a = "static area should collide into heap filling up the heap with more data tp cause a collision at z"
    string b
    string c
    string d
    string e
      
    string f
    string g
    string h
    string i
      string j
      
      string k
      string l
      string m
      string n
      string o
      
      string p
      string q
      string r 
      string s
      string t
      
      string u
      string v
      string w
      string x
      string y
      
      string z
  }$
  {print("hello world")}$
  {
    string a 
      a = "static area should collide into heap filling up the heap with more data tp cause a collision at z"
    string b
    string c
    string d
    string e
      
    string f
    string g
    string h
    string i
      string j
      
      string k
      string l
      string m
      string n
      string o
      
      string p
      string q
      string r 
      string s
      string t
      
      string u
      string v
      string w
      string x
      string y
      
      string z
  }$
  {print("hello world")}$`;

  public CODE_GEN_BOOLEAN_HELL_TEST = `/* Should print out... */
  /* 0done */
  {
    int a
    if(((a!=9) == true) == ((5==5) != (false == true))) {
      print(a)
    }
    print("done")
  }$
  /* 12345678done */
  {
    int a
    while(((a!=9) == false) == ((5==5) != (false != true))) {
      print(a)
      a = 1 + a
    }
    print("done")
  }$
  /* wow */
  {
    int a
    int b
    string c
    while((( a != 3 + b) == true) == (c == "null")) {
      a = 1 + a
    }
    if (a == 3) {
      print("wow")
    }
  }$`;

  public defaultTests: Array<Map<string, string>> = [
    new Map<string, string>([["LONG_TEST_CASE", this.LONG_TEST_CASE]]),
    new Map<string, string>([["ALANS_PROJECT_ONE_TEST", this.ALANS_PROJECT_ONE_TEST]]),
    new Map<string, string>([["ALANS_PROJECT_TWO_TEST", this.ALANS_PROJECT_TWO_TEST]]),
    new Map<string, string>([["ALANS_PROJECT_THREE_TEST", this.ALANS_PROJECT_THREE_TEST]]),
  ];

  public lexerTests: Array<Map<string, string>> = [
    new Map<string, string>([["RANDOM_BOOL_OPS_TEST", this.RANDOM_BOOL_OPS_TEST]]),
    new Map<string, string>([["SYMBOL_SALAD", this.SYMBOL_SALAD]]),
    new Map<string, string>([["LETTER_SOUP", this.LETTER_SOUP]]),
    new Map<string, string>([["BROKEN_STRINGS", this.BROKEN_STRINGS]]),
    new Map<string, string>([["BROKEN_COMMENTS", this.BROKEN_COMMENTS]]),
  ];

  public parserTests: Array<Map<string, string>> = [
    new Map<string, string>([["INCOMPLETE_EXPRESSIONS", this.INCOMPLETE_EXPRESSIONS]]),
    new Map<string, string>([["TRICKY_DECLARATIONS", this.TRICKY_DECLARATIONS]]),
    new Map<string, string>([["TRICKY_ASSIGNMENT_STATEMENTS", this.TRICKY_ASSIGNMENT_STATEMENTS]]),
    new Map<string, string>([["CRAZY_BOOLEAN_EXPRESSION", this.CRAZY_BOOLEAN_EXPRESSION]]),
    new Map<string, string>([["SONARS_STRING_DECLARATION", this.SONARS_STRING_DECLARATION]]),
    new Map<string, string>([["SVEGLIATOR_INVALID_PROGRAM", this.SVEGLIATOR_INVALID_PROGRAM]]),
    new Map<string, string>([["JUICE_COMPILER_CRAZY_ONE_LINER", this.JUICE_COMPILER_CRAZY_ONE_LINER]]),
  ];

  public semanticAnalysisTests: Array<Map<string, string>> = [
    new Map<string, string>([["INTEGER_ASSIGNMENTS", this.INTEGER_ASSIGNMENTS]]),
    new Map<string, string>([["STRING_ASSIGNMENTS", this.STRING_ASSIGNMENTS]]),
    new Map<string, string>([["ULTIMATE_ASSIGNMENT_TEST", this.ULTIMATE_ASSIGNMENT_TEST]]),
    new Map<string, string>([["PRINT_STATEMENTS_TESTS", this.PRINT_STATEMENTS_TESTS]]),
    new Map<string, string>([["WHILE_STATEMENTS_TEST", this.WHILE_STATEMENTS_TEST]]),
    new Map<string, string>([["IF_STATEMENTS_TEST", this.IF_STATEMENTS_TEST]]),
    new Map<string, string>([["SCOPE_TREE_TEST", this.SCOPE_TREE_TEST]]),
    new Map<string, string>([["SIMPLE_MISSING_VARIABLES", this.INCOMPLETE_EXPRESSIONS]]),
    new Map<string, string>([["CHRONOS_NESTED_EVERYTHING", this.CHRONOS_NESTED_EVERYTHING]]),
    new Map<string, string>([["ANDREW_B_INFINTIE_LOOP", this.ANDREW_B_INFINTIE_LOOP]]),
    new Map<string, string>([["ROB_WHITAKER_TEST_THREE", this.ROB_WHITAKER_TEST_THREE]]),
    new Map<string, string>([["JUICE_COMPILER_BOOLEAN_HELL", this.JUICE_COMPILER_BOOLEAN_HELL]]),
  ];

  public codeGenerationTests: Array<Map<string, string>> = [
    new Map<string, string>([["CODE_GEN_BOOLEAN_VALUE_TEST", this.CODE_GEN_BOOLEAN_VALUE_TEST]]),
    new Map<string, string>([["CODE_GEN_BOOLEAN_EXPRESSION_TEST", this.CODE_GEN_BOOLEAN_EXPRESSION_TEST]]),
    new Map<string, string>([["CODE_GEN_BOOLEAN_INTEGER_VALUE_TEST", this.CODE_GEN_BOOLEAN_INTEGER_VALUE_TEST]]),
    new Map<string, string>([["CODE_GEN_BOOLEAN_INTEGER_EXPRESSION_TEST", this.CODE_GEN_BOOLEAN_INTEGER_EXPRESSION_TEST]]),
    new Map<string, string>([["CODE_GEN_STRING_VALUE_TEST", this.CODE_GEN_STRING_VALUE_TEST]]),
    new Map<string, string>([["CODE_GEN_IDENTIFIER_BOOLEAN_TEST", this.CODE_GEN_IDENTIFIER_BOOLEAN_TEST]]),
    new Map<string, string>([["CODE_GEN_SCOPE_TEST", this.CODE_GEN_SCOPE_TEST]]),
    new Map<string, string>([["CODE_GEN_STRING_SCOPE_TEST", this.CODE_GEN_STRING_SCOPE_TEST]]),
    new Map<string, string>([["CODE_GEN_VARRIABLE_DECLARATIONS_TEST", this.CODE_GEN_VARRIABLE_DECLARATIONS_TEST]]),
    new Map<string, string>([["CODE_GEN_PRINT_TEST", this.CODE_GEN_PRINT_TEST]]),
    new Map<string, string>([["CODE_GEN_STRING_POINTERS_TEST", this.CODE_GEN_STRING_POINTERS_TEST]]),
    new Map<string, string>([["CODE_GEN_IF_TEST", this.CODE_GEN_IF_TEST]]),
    new Map<string, string>([["CODE_GEN_WHILE_TEST", this.CODE_GEN_WHILE_TEST]]),
    new Map<string, string>([["CODE_GEN_BIG_INT_TEST", this.CODE_GEN_BIG_INT_TEST]]),
    new Map<string, string>([["CODE_GEN_STATIC_AREA_OVERFLOW_TEST", this.CODE_GEN_STATIC_AREA_OVERFLOW_TEST]]),
    new Map<string, string>([["CODE_GEN_BOOLEAN_HELL_TEST", this.CODE_GEN_BOOLEAN_HELL_TEST]]),
  ];
  constructor() { }
}
