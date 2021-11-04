import { Globals } from "../global";
import { Control } from "../host/control";
import { Interrupt } from "./interrupt";
import { ProcessControlBlock } from "./processControlBlock";
import { Queue } from "./queue";

/**
 * 
 * Changing the quantum mid-cyle is not easy...
 * 
 * Yeah request an change_quantum_irq, but what if there's a 
 * context_switch_irq, or termination_queued? 
 * 
 * The quantum change should probably take lower priority (higher number).
 * Implementing a priority queue may not be fully necessary, but it'll make project 4 
 * a little bit easier...
 * 
 * Turns out heapify, heap-sort or whatever you want to call it is not stable...
 * Hmm... 
 * 
 *      My first inclination is to add a time inserted attribute to break ties... but what if
 *      two processes are scheduled at the exact same time? 
 *      
 *      Maybe a priority queue of queues?
 *      
 *      Should I honestly even care about order at that time?
 * 
 *      I will be damned if this works...
 * 
 */
export class PriorityQueue {
    constructor(
        public queues: Queue[] = [],
    ) { }

    public getSize(): number {
        return this.queues.length;
    }/// getSize

    public getIndex(index: number): Queue {
        return this.queues[index];
    }/// getIndex

    public getMin(): Queue {
        return this.queues[Globals.ROOT_NODE];
    }/// getMin

    private getParentQueueIndex(current: number): number {
        return Math.floor(current / 2);
    }/// getParentNode

    /// Swaps 2 queues in the min-heap implementation of this priority queue
    private swapQueues(index1: any, index2: any): void {
        var temp = this.queues[index1];
        this.queues[index1] = this.queues[index2];
        this.queues[index2] = temp;
    }/// swapNode

    /**
     * Usually a Min-Heap insertion is O(log n)... Accepting duplicate priorities complicates this...
     *      1. Could nest a queue inside, but kind of defeats the purpose...
     */
    public enqueueInterruptOrPcb(newInterruptOrPcb: any) {
        /// if (queue with matching priority already exists)
        ///     - find the queue with a matching priority
        ///     - enqueue the Interrupt or Pcb
        /// else 
        ///     - create a new queue with a new priority matching the pcb or interrupt
        ///     - enqueue the Interrupt or Pcb
        ///
        /// Put value on the "bottom-left" most part of the heap...
        var foundQueueWithMatchingPriority: boolean = false;
        var pos = 0;
        while (pos < this.queues.length && !foundQueueWithMatchingPriority) {
            if (this.queues[pos].priority === newInterruptOrPcb.priority) {
                foundQueueWithMatchingPriority = true;
                this.queues[pos].enqueue(newInterruptOrPcb);
            }/// if
            else {
                pos++;
            }/// else
        }/// while

        /// No queues with a matching priority exist...
        if (!foundQueueWithMatchingPriority) {
            /// Create a new Queue
            /// Give the new queue a matching priority!
            /// Actually enqueue the data!

            /// Follow normal min heap insertion logic
            this.queues.push(new Queue([newInterruptOrPcb], newInterruptOrPcb.priority));

            /// Bubble to proper spot
            this.bubbleUp();
        }/// if
    }/// enequeueInterruptOrPcb

    /// Change the bubble method to default to a timestamp in the event of ties in priority...
    /// In the event of a double tie, chose one at random.
    private bubbleUp() {
        /// Bubbling up not necessary if the list has only one element
        if (this.queues.length > 1) {

            /// Start at bottom of the heap (which is technically at the end of the list)
            var currentQueueIndex = this.queues.length - 1;

            /// Bubble swap with parent until the queues priority is no longer less than the parents
            while (currentQueueIndex > 0 && this.queues[this.getParentQueueIndex(currentQueueIndex)].priority >= this.queues[currentQueueIndex].priority) {
                this.swapQueues(this.getParentQueueIndex(currentQueueIndex), currentQueueIndex);
                currentQueueIndex = this.getParentQueueIndex(currentQueueIndex);
            }/// while
        }/// if
    }/// bubbleUp

    /// In our case we'll be returning a process control block or interrupt
    public dequeueInterruptOrPcb(): any {
        /// Strategy: Peek the root node / queue / whatever you want to call it
        ///     if (root queue has more that one element) 
        ///         - just dequeue from the nested queue without modifying the min-heap
        ///     else (root queue has one element left)
        ///         - follow normal min-heap dequeue procedure
        var processControlBlockOrInterrupt = null;

        if (this.queues.length === 0) {
            return;
        }/// if

        if (this.queues[Globals.ROOT_NODE].q.length > 1) {
            Control.hostLog('Peeking priority queue');
            processControlBlockOrInterrupt = this.queues[Globals.ROOT_NODE].dequeue();
        }/// if

        else if (this.queues[Globals.ROOT_NODE].q.length === 1) {
            Control.hostLog('Removing a queue');
            /// Swap the root node with the bottom most left node (last node)
            /// Put value on the "bottom-left" most part of the heap...
            this.swapQueues(Globals.ROOT_NODE, this.queues.length - 1);

            /// Remove the last queue, that is now the highest priority node
            processControlBlockOrInterrupt = this.queues.pop()!.dequeue();

            /// Now bubble down the root queue (that is most likely not the highest priority queue)
            if (this.queues.length > 1) {
                this.bubbleDown(this.queues.length, Globals.ROOT_NODE);
            }/// if
        }/// else-if

        /// I would prefer overloaded methods because, well, yah...
        try {
            if (processControlBlockOrInterrupt instanceof ProcessControlBlock) {
                Control.hostLog(`Dequeued Pcb: ${processControlBlockOrInterrupt.processID}`);
            }/// if
            else if (processControlBlockOrInterrupt instanceof Interrupt) {
                Control.hostLog(`Dequeued Interrupt: ${processControlBlockOrInterrupt.irq}`);
            }/// else
        }/// try
        catch (e) { }

        return processControlBlockOrInterrupt;
    }/// dequeue

    public bubbleDown(size: any, root: any) {
        /// Start from top of the heap for minimimum
        var smallest = root;

        /// LEFT Child of Parent Node at Index, parentIndex:
        ///     lChildIndex = 2(parentIndex) + 1
        ///
        /// RIGHT Child of Parent Node at Index, parentIndex:
        ///     rChildIndex = 2(parentIndex) + 2
        var leftChildIndex = smallest * 2 + 1;
        var rightChildIndex = smallest * 2 + 2;

        // Left child is smaller than root, swap
        if (leftChildIndex < size) {
            if (this.queues[leftChildIndex].priority < this.queues[smallest].priority) {
                smallest = leftChildIndex;
            }/// if
        }/// if

        // Right child is smaller than smallest, swap again 
        if (rightChildIndex < size) {
            if (this.queues[rightChildIndex].priority < this.queues[smallest].priority) {
                smallest = rightChildIndex;
            }/// if
        }/// if

        // Smallest is not root, swap 
        if (smallest != root) {
            this.swapQueues(smallest, root);

            // Recursively bubble down
            this.bubbleDown(size, smallest);
        }/// if
    }/// bubbleDown

    /// So ya want to change the priority of a process?
    /// I'll be damned if this works...
    public changePriority(pcb: ProcessControlBlock, newPriority: number) {
        /**
         * Here's the strategy...
         *      1.) Dequeue the process
         *      2.) Change the priority
         *      3.) Enqueue the process
         */

        var processControlBlockOrInterrupt = null;

        if (newPriority = pcb.priority) {
            return;
        }/// if

        /// min-heap should be a sorted array
        if (this.queues[pcb.priority].getSize() > 1) {
            /// Base case
            if (pcb.priority === 0) {
                processControlBlockOrInterrupt = this.queues[pcb.priority].dequeue();
            }/// if

            /// Remove non-root node 
            else {
                /// 1. Find queue with matching priority
                var foundQueueWithMatchingPriority: boolean = false;
                var pos = 0;
                while (pos < this.queues.length && !foundQueueWithMatchingPriority) {

                    /// Found queue with matching priority
                    if (this.queues[pos].priority === pcb.priority) {
                        foundQueueWithMatchingPriority = true;

                        /// Search for pcb in nested queue
                        var nestedPos = 0;
                        while (nestedPos < this.queues[pos].getSize()) {
                            if (this.queues[pos].getIndex(nestedPos).processID === pcb.processID) {
                                processControlBlockOrInterrupt = this.queues[pos].q.splice(nestedPos, 0);
                                break;
                            }/// if
                            else {
                                nestedPos++;
                            }/// else
                        }/// while
                    }/// if
                }/// while
            }/// else
        }/// if

        else {
            /// Swap the root node with the bottom most left node (last node)
            /// Put value on the "bottom-left" most part of the heap...
            this.swapQueues(pcb.priority, this.queues.length - 1);

            /// Remove the last queue, that is now the highest priority node
            processControlBlockOrInterrupt = this.queues.pop()!.dequeue();

            /// To bubble up or to bubble down?
            if (this.queues.length > 1) {
                this.bubbleDown(this.queues.length, pcb.priority);
            }/// if
        }/// else

        /// 2. Change Priority
        pcb.priority = newPriority;

        /// 3. Re-enque with new priority
        this.enqueueInterruptOrPcb(pcb);

    }/// changePriority
}/// class