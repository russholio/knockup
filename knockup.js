// Knockup, ORM for Knockout, v0.1.0
// Copyright (c) Trey Shugart http://iamtres.com
// License: MIT http://www.opensource.org/licenses/mit-license.php
!function() {

    // If knockout is not defined, let them know.
    if (typeof ko === 'undefined') {
        throw new Error('KnockoutJS is required. Download at https://github.com/SteveSanderson/knockout.');
    }

    // Expose.
    window.ku = {};

    // Creates a knockup model.
    // The initial data in the model is specified by the "inherit" argument.
    ku.model = function(define) {
        var model = function(data) {
            var comp = {},
                self = this;

            // The observer is what is returned when the object is accessed.
            this.observer = ko.computed({
                read: function() {
                    return this;
                },
                write: function(value) {
                    this.fill(value);
                },
                owner: this
            });

            // Fills the model with the specified values.
            this.fill = function(obj) {
                // Update each value.
                each(obj, function(name, value) {
                    self[name](value);
                });

                // Tell everyone.
                this.observer.notifySubscribers();

                return this;
            };

            // Applies the model to the specified root element.
            // The root element defaults to the document object.
            this.knockup = function(to) {
                ko.applyBindings(this, to);
                return this;
            };

            // Define the object structure.
            each(define, function(i, v) {
                if (ku.isModel(v) || ku.isCollection(v)) {
                    // Create the new model.
                    var obj = new v;

                    // Set the property to the model observer.
                    self[i] = obj.observer;

                    // The model / collection should have a parent.
                    obj.$parent = self;

                    // Continue iteration.
                    return;
                }

                // Handle functions, both get*, set* and normal.
                if (typeof v === 'function') {
                    var type;

                    if (i.indexOf('get') === 0) {
                        type = 'read';
                    } else if (i.indexOf('set') === 0) {
                        type = 'write';
                    }

                    // If a "get" or "set" prefix was found, it is a computed observable.
                    if (type) {
                        var name = i.substring(3, 4).toLowerCase() + i.substring(4);

                        // We make sure that an object is registered so
                        // that future getters or setters can be applied
                        // to it.
                        if (typeof comp[name] === 'undefined') {
                            comp[name] = {};
                        }

                        // Apply the function to the computed observer.
                        comp[name][type] = v;

                        return;
                    }

                    // Normal functions have to be wrapped in a function
                    // that will apply the current context to it and pass
                    // along the arguments.
                    self[i] = function() {
                        return v.apply(self, arguments);
                    };

                    return;
                }

                self[i] = ko.observable(v);
            });

            // Apply computed properties.
            each(comp, function(name, comp) {
                // Automatically apply the current model.
                comp.owner = self;

                // If evaluation is not deferred, then some properties
                // accessed within the observer may not be available.
                comp.deferEvaluation = true;

                // Apply the computed observer.
                self[name] = ko.computed(comp);
            });

            // Fill with instance values.
            this.fill(data);
        };

        // The set constuctor for the current model.
        model.collection = ku.collection(model);

        return model;
    };

    // Contains a set of models and can be used like an array.
    ku.collection = function(model) {
        return function(data) {
            Array.prototype.push.apply(this, []);

            // The observer is what is returned when the object is accessed.
            this.observer = ko.computed({
                read: function() {
                    return this;
                },
                write: function(value) {
                    this.fill(value);
                },
                owner: this
            });

            // Returns the item at the specified index.
            this.at = function(index) {
                return this[index] || false;
            };

            // Returns the first item.
            this.first = function() {
                return this.at(0);
            };

            // Returns the last item.
            this.last = function() {
                return this.at(this.length - 1);
            };

            // Returns whether or not an item exists at the specified index.
            this.has = function(index) {
                return typeof this[index] !== 'undefined';
            };

            // Removes the item at the specified index.
            this.remove = function(at) {
                var at   = typeof at === 'number' ? at : this.index(at);
                    item = this.at(at);

                if (item) {
                    // Remove the item.
                    Array.prototype.splice.call(this, at, 1);

                    // Notify subscribers.
                    this.observer.notifySubscribers();
                }

                return this;
            };

            // Prepends the specified model.
            this.prepend = function(item) {
                return this.insert(0, item);
            };

            // Appends the specified model.
            this.append = function(item) {
                return this.insert(this.length, item);
            };

            // Inserts the model at the specified index.
            this.insert = function(at, item) {
                // Create the item to add from the passed in data.
                item = ku.isModel(item) ? item : new model(item);

                // Notify the model about its parent context.
                item.$parent = this.$parent;

                // Insert it into the collection.
                Array.prototype.splice.call(this, at, 0, item);

                // Notify anyone who cares about the update.
                this.observer.notifySubscribers();

                return this;
            };

            // Returns the index of the specified item.
            this.index = function(item) {
                var index = -1;

                this.each(function(i, it) {
                    if (it === item) {
                        index = i;
                        return;
                    }
                });

                return index;
            };

            // Fills the set with the specified data.
            this.fill = function(data) {
                var self = this;

                each(data, function(i, model) {
                    self.append(model);
                });

                return this;
            };

            // Executes the callback for each item in the set.
            this.each = function(fn, data) {
                for (var i = 0; i < this.length; i++) {
                    fn(i, this[i]);
                }
                return this;
            };

            // Finds several items in the set.
            this.find = function(query, limit) {
                var collection = new model.collection;

                this.each(function(i, model) {
                    if (query(i, model)) {
                        collection.append(model);
                    }

                    if (limit && collection.length === limit) {
                        return;
                    }
                });

                return collection;
            };

            // Finds one item in the set.
            this.findOne = function(query) {
                return this.find(query, 1).first();
            };

            // Fill with the initial data.
            this.fill(data);
        };
    };

    // Returns whether or not the speicfied function is a model constructor.
    var modelString = ku.model().toString();
    ku.isModel = function(fn) {
        return fnCompare(fn, modelString);
    };

    // Returns whether or not the speicfied function is a collection constructor.
    var collectionString = ku.collection().toString();
    ku.isCollection = function(fn) {
        return fnCompare(fn, collectionString);
    };

    // Compares the passed in function to the definition string.
    function fnCompare(fn, str) {
        if (!fn) {
            return false;
        }

        if (typeof fn === 'object' && fn.constructor) {
            fn = fn.constructor;
        }

        if (typeof fn === 'function') {
            fn = fn.toString();
        }

        return fn === str;
    }

    // Iterates over an array or hash.
    function each(items, fn) {
        var items = items || [];

        if (typeof items === 'string') {
            items = [items];
        }

        if (typeof items.length === 'number') {
            for (var i = 0; i < items.length; i++) {
                fn(i, items[i]);
            }
        } else {
            for (var i in items) {
                fn(i, items[i]);
            }
        }
    };

}();