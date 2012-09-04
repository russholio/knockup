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

            // Returns whether or not the model matches the given hash.
            this.is = function(query) {
                var found = false;

                each(query, function(name, value) {
                    if (typeof this[name] === 'function' && this[name]() === value) {
                        found = true;
                    } else {
                        found = false;
                        return;
                    }
                });

                return found;
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
                    self[i] = new v().observer;
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

                        if (typeof comp[name] === 'undefined') {
                            comp[name] = {};
                        }

                        comp[name][type] = v;

                        return;
                    }

                    self[i] = v;

                    return;
                }

                self[i] = ko.observable(v);
            });

            // Apply computed properties.
            each(comp, function(name, comp) {
                comp.owner  = self;
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
                if (!this.has(index)) {
                    this.insert(index, {});
                }

                return this[index];
            };

            // Returns whether or not an item exists at the specified index.
            this.has = function(index) {
                return typeof this[index] !== 'undefined';
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
                Array.prototype.splice.call(this, at, 0, new model(item));
                this.observer.notifySubscribers();
                return this;
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
                var found = [];

                this.each(function(i, model) {
                    if (model.is(query)) {
                        found.push(model);
                    }

                    if (limit && found.length === limit) {
                        return;
                    }
                });

                return new ku.set(model, found);
            };

            // Finds one item in the set.
            this.findOne = function(query) {
                var set = this.find(query, 1);

                if (set.count()) {
                    return set.at(0);
                }
            };

            // Fill with the initial data.
            this.fill(data);
        };
    };

    // Returns whether or not the speicfied function is a model constructor.
    var modelString = ku.model().toString();
    ku.isModel = function(fn) {
        return fn.toString() === modelString;
    };

    // Returns whether or not the speicfied function is a collection constructor.
    var collectionString = ku.collection().toString();
    ku.isCollection = function(fn) {
        return fn.toString() === collectionString;
    };

    // Iterates over an array or hash.
    function each(items, data, fn) {
        var fn    = arguments.length === 2 ? data : fn;
        var items = items || [];

        if (typeof items === 'string') {
            items = [items];
        }

        if (typeof items.length === 'number') {
            for (var i = 0; i < items.length; i++) {
                fn(i, items[i], data);
            }
        } else {
            for (var i in items) {
                fn(i, items[i], data);
            }
        }
    };

}();