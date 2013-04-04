

define.extend('raptor/render-context/Context', function() {
    "use strict";

    /* 
     * - Every async fragment will buffer everything after it by changing the writer to a StringBuilder
     * - When an async fragment is completed, it will call flush on the fragment after it
     * - bufferedFragment.flush() will write its output to the prevent fragment
     * - asyncFragment.flush() will do nothing
     * - For nested async fragments:
     *     - The parent async fragment tag handler will store the current async fragment in the context
     *     - the nested async fragment will be linked into the chain
     */
    var StringBuilder = require('raptor/strings/StringBuilder'),
        DataProviders = require('raptor/render-context/DataProviders');

    var getAsyncAttributes = function(context) {
        var attrs = context.getAttributes();
        return attrs.async || (attrs.async = {});
    };

    var getDataProviders = function(context) {
        var asyncAttributes = getAsyncAttributes(context);
        return asyncAttributes.dataProviders || 
                (asyncAttributes.dataProviders = 
                    new DataProviders(require('raptor/render-context').getDataProviders()))
    }

    var AsyncFragment = function(context, buffer) {
        this.context = context; // The context that this async fragment is associated with
        this.writer = context.writer;  // The original writer this fragment was associated with
        this.buffer = buffer; // A buffer for all of the content after this fragment
        this.finished = false; // Used to keep track if this async fragment was ended
        this.flushed = false; // Set to true when the contents of this async fragment have been flushed to the original writer
        this.next = null; // A link to the next sibling async fragment (if any)
        this.ready = true; // Will be set to true if this fragment is ready to be flushed (i.e. when there are no async fragments preceeding this fragment)
        this.remaining = 0; // Used to keep track of pending async fragments
        this.parent = null; 
        this.firstChild = null;
    };

    AsyncFragment.prototype = {

        end: function() {

            var asyncAttributes = getAsyncAttributes(this.context);
            try
            {
                // Make sure end is only called once by the user
                if (this.finished) {
                    throw new Error('Already ended');
                }

                this.finished = true;

                // Check if there are any nested fragments still pending
                if (this.remaining === 0) {
                    // There are no children pending...
                    
                    // See if this fragment is ready to be flushed...this will only
                    // be true if every fragment before this async fragment has been flushed
                    if (this.ready) {
                        // There are no nesting asynchronous fragments that are
                        // remaining and we are ready to be flushed then let's do it!
                        this.flush();
                    }

                    // If we have a parent, let the parent know that a nested
                    // async fragment has completed so it can respond accordingly
                    if (this.parent) {
                        // If we have no nested 
                        this.parent.childFinished();
                    }
                }

                // Keep track of how many asynchronous fragments are in the template
                if (--asyncAttributes.remaining === 0) {
                    // If we were the last fragment to complete then fulfil the promise for
                    // the template rendering using the output of the underlying writer
                    asyncAttributes.deferred.resolve(this.writer.toString());
                }
            }
            catch(e) {
                asyncAttributes.deferred.reject(e); // Something went wrong... make sure we always keep the promise
            }
            
        },

        childFinished: function() {
            // Decrement the remaining child counter and check if all the children have completed
            if (--this.remaining === 0) {
                // The last child has completed
                
                // If all the children have completed and we are ready then flush this parent
                if (this.ready) {
                    this.flush();    
                }
                
                // Let the notifications trickle up to all ancestors
                if (this.parent) {
                    this.parent.childFinished();
                }
            }
        },

        flush: function() {

            if (!this.ready || this.flushed) {
                throw new Error('Invalid state');
            }

            if (!this.finished) {
                // Skipped Flushing since not finished
                return;
            }

            // When trying to flush an async fragment that has children
            // we want to make sure all of the children are flushed first
            var firstChild = this.firstChild;

            if (firstChild && !firstChild.flushed) {
                // Flush the children and switch them over to the original writer
                firstChild.ready = true; // Let the first child know that it is ready since its parent is ready
                firstChild.writer = firstChild.context.writer = this.writer; // Force the child to use the original writer
                firstChild.flush(); // Flush the first child. This will trigger linked siblings to flush if they are ready as well
            }

            // Abort the flush if we still have nested async fragments pending
            if (this.remaining) {
                return;
            }

            // Mark this fragment as flush for book keeping purposes
            this.flushed = true;
            this.writer.write(this.buffer.toString()); // Flush all of the buffered output after this fragment

            // This fragment has been flushed, now check if
            // there is another fragment that is ready to be
            // flushed
            var next = this.next;
            if (next) {
                next.ready = true; // Since we have flushed the next fragment is ready
                next.writer = next.context.writer = this.writer; // Update the next fragment to use the original writer
                next.flush(); // Now flush the next fragment (if it is not finish then it will just do nothing)
            }
        }

    };

    return {

        /**
         * [asyncFragment description]
         * @return {[type]} [description]
         */
        beginAsyncFragment: function(callback) {

            // Pull output attributes that are shared across the original context and all sub-contexts
            var asyncAttributes = getAsyncAttributes(this);

            // Keep a count of all of the async fragments for this rendering
            asyncAttributes.remaining++;

            // Keep a flag to indicate if this async fragment is ready to be flushed
            var ready = true; // We'll optimistically assume this fragment is ready to be flushed

            // Create a new rendering context for the asynchronous
            // fragment and use the existing writer
            // NOTE: The current writer might be a buffer created
            //       by an earlier async fragment
            var asyncContext = this.createNestedContext(this.writer);

            // Buffer everything after this async fragment
            var buffer = new StringBuilder();
            this.writer = buffer;

            // Create a new async fragment and associate it
            // with the new async rendering context and the buffer
            var asyncFragment = new AsyncFragment(asyncContext, buffer);


            // See if this async fragment is nested within another
            // async fragment
            var parentAsyncFragment = this.parentAsyncFragment;
            if (parentAsyncFragment) {
                // If so, record that there is an additional
                // nested async fragment
                if (parentAsyncFragment.remaining++ === 0) {
                    // Keep track of the first child so the parent can flush children when ready
                    parentAsyncFragment.firstChild = asyncFragment;    
                }
                

                // If the parent that we are nested in is not ready
                // then this fragment is not ready either
                if (!parentAsyncFragment.ready) {
                    ready = false;
                }

                asyncFragment.parent = parentAsyncFragment;
            }

            asyncContext.parentAsyncFragment = asyncFragment;

            var prevAsyncFragment = this.prevAsyncFragment;

            // See if we are being buffered by a previous asynchronous
            // fragment
            if (prevAsyncFragment && !prevAsyncFragment.flushed) {
                // If the previous asynchronous fragment has not been
                // flushed then we are not ready to be flushed
                 
                // Add a link to the previous async fragment
                // so that it can let us know when we are ready to be flushed
                prevAsyncFragment.next = asyncFragment;

                ready = false; // If we are preceeded by another async fragment then we aren't ready to be flushed
            }

            asyncFragment.ready = ready; // Set the ready flag based on our earlier checks above

            this.prevAsyncFragment = asyncFragment; // Record the previous async fragment for linking purposes
            callback(asyncContext, asyncFragment); // Provide the user with the async context and the async fragment
        },


        requestData: function(name, args) {
            return getDataProviders(this).requestData(name, args);
        },

        dataProvider: function(name, callback, thisObj) {
            var dataProviders = getDataProviders(this);
            dataProviders.add.apply(dataProviders, arguments);
        }
    };
});