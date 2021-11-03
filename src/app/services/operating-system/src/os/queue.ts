/* ------------
   Queue.ts
   A simple Queue, which is really just a dressed-up JavaScript Array.
   See the JavaScript Array documentation at
   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
   Look at the push and shift methods, as they are the least obvious here.
   ------------ */

export class Queue {
    constructor(
        public q = new Array(),
        public priority = 1,
    ) { }

    public getSize() {
        return this.q.length;
    }

    public getIndex(index: number) {
        return this.q[index];
    }

    public isEmpty() {
        return (this.q.length == 0);
    }

    public enqueue(element: any) {
        this.q.push(element);
    }

    public dequeue() {
        var retVal = null;
        if (this.q.length > 0) {
            retVal = this.q.shift();
        }
        return retVal;
    }

    public toString() {
        var retVal = "";
        for (var i in this.q) {
            retVal += "[" + this.q[i] + "] ";
        }
        return retVal;
    }
} // Queue