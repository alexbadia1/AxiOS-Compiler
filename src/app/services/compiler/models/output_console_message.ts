export class OutputConsoleMessage {
    constructor(
        /**
         * The stage of compilation this message originated from
         */
        public source: string,

        /**
         * Type of console message: info, warning, error
         */
        public type: string,

        /**
         * The details of the message
         */
        public message: string = "",
    ) { }// constructor
}// class