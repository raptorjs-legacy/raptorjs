

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
        dataProviders = require('raptor/data-providers'),
        logger = require('raptor/logging').logger('raptor/render-context/Context');

    var getAsyncAttributes = function(context) {
        var attrs = context.getAttributes();
        return attrs.async || (attrs.async = {});
    };

    var Fragment = function(context) {
        this.context = context; // The context that this async fragment is associated with
        this.writer = context.writer;  // The original writer this fragment was associated with
        this.finished = false; // Used to keep track if this async fragment was ended
        this.flushed = false; // Set to true when the contents of this async fragment have been 
                              // flushed to the original writer
        this.next = null; // A link to the next sibling async fragment (if any)
        this.ready = true; // Will be set to true if this fragment is ready to be flushed 
                        // (i.e. when there are no async fragments preceeding this fragment)
    };

    var flushNext = function(fragment) {
        var next = fragment.next;
        if (next) {
            next.ready = true; // Since we have flushed the next fragment is ready
            next.writer = next.context.writer = fragment.writer; // Update the next fragment to use the original writer
            next.flush(); // Now flush the next fragment (if it is not finish then it will just do nothing)
        }
    }

    var BufferedFragment = function(context, buffer) {
        Fragment.call(this, context);
        this.buffer = buffer;
    };

    BufferedFragment.prototype = {

        flush: function() {

            if (!this.ready || this.flushed) {
                throw new Error('Invalid state');
            }

            this.writer.write(this.buffer.toString());
            this.flushed = true;
            flushNext(this);
        }

    };

    var AsyncFragment = function(context) {
        Fragment.call(this, context);
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

                if (this.ready) {
                    // There are no nesting asynchronous fragments that are
                    // remaining and we are ready to be flushed then let's do it!
                    this.flush();
                }

                // Keep track of how many asynchronous fragments are in the template
                if (--asyncAttributes.remaining === 0) {
                    // If we were the last fragment to complete then fulfil the promise for
                    // the template rendering using the output of the underlying writer
                    asyncAttributes.deferred.resolve(this.context);
                }
            }
            catch(e) {
                asyncAttributes.deferred.reject(e); // Something went wrong... make sure we always keep the promise
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

            this.flushed = true;
            flushNext(this);
        }

    };

    var getDataProviders = function(context) {
        var asyncAttributes = getAsyncAttributes(context);
        return asyncAttributes.dataProviders || 
                (asyncAttributes.dataProviders = context.createDataProviders());
    }

    var registerDataProviders = function(name, callback, thisObj) {
        var dataProviders = getDataProviders(this);
        dataProviders.register.apply(dataProviders, arguments);
    };

    return {
        createDataProviders: function() {
            return dataProviders.create();
        },

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
            var asyncFragment = new AsyncFragment(asyncContext);
            var bufferedFragment = new BufferedFragment(this, buffer);
            asyncFragment.next = bufferedFragment;

            asyncContext.parentAsyncFragment = asyncFragment;

            var prevAsyncFragment = this.prevAsyncFragment || this.parentAsyncFragment;

            // See if we are being buffered by a previous asynchronous
            // fragment
            if (prevAsyncFragment) {

                 
                // Splice in our two new fragments and add a link to the previous async fragment
                // so that it can let us know when we are ready to be flushed
                bufferedFragment.next = prevAsyncFragment.next;
                prevAsyncFragment.next = asyncFragment;

                if (!prevAsyncFragment.flushed) {
                    ready = false; // If we are preceeded by another async fragment then we aren't ready to be flushed    
                }
            }

            asyncFragment.ready = ready; // Set the ready flag based on our earlier checks above

            this.prevAsyncFragment = bufferedFragment; // Record the previous async fragment for linking purposes
            try
            {
                callback(asyncContext, asyncFragment); // Provide the user with the async context and the async fragment    
            }
            catch(e) {
                logger.error('Error: ' + e, e);
                asyncFragment.end();
            }
        },


        requestData: function(name, args) {
            return getDataProviders(this).requestData(name, args);
        },

        dataProviders: registerDataProviders,
        dataProvider: registerDataProviders
    };
});