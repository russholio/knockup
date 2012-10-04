// Knockup, ORM for Knockout, v0.1.0
// Copyright (c) Trey Shugart http://iamtres.com
// License: MIT http://www.opensource.org/licenses/mit-license.php
!function(factory) {
    // Common / Node
    if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
        factory(require('knockout'), module['exports'] || exports);
    // AMD
    } else if (typeof define === 'function' && define.amd) {
        define(['knockout', 'exports'], factory);
    // Global
    } else {
        factory(ko, window.ku = {});
    }
}(function(ko, ku) {
    // Require KnockoutJS.
    if (typeof ko === 'undefined') {
        throw new Error('KnockoutJS is required. Download at https://github.com/SteveSanderson/knockout.');
    }
    
    // Returns whether or not the mmber is a getter.
    ku.isGetter = function(name) {
        return name.indexOf('get') === 0;
    };

    // Returns whether or not the member is a setter.
    ku.isSetter = function(name) {
        return name.indexOf('set') === 0;
    };

    // Transforms the name from a getter name.
    ku.fromGetter = function(name) {
        return name.substring(3, 4).toLowerCase() + name.substring(4);
    };

    // Transforms the name from a setter name.
    ku.fromSetter = function(name) {
        return name.substring(3, 4).toLowerCase() + name.substring(4);
    };

    // Transforms the name to a getter name.
    ku.toGetter = function(name) {
        return 'get' + name.substring(0, 1).toUpperCase() + name.substring(1);
    };

    // Transforms the name to a setter name.
    ku.toSetter = function(name) {
        return 'set' + name.substring(0, 1).toUpperCase() + name.substring(1);
    };

    // Creates a knockup model.
    ku.model = function(define) {
        var model = function(data) {
            var computed   = {},
                properties = {},
                relations  = {},
                methods    = {},
                self       = this;

            // The observer is what is returned when the object is accessed.
            this.observer = generateObserver.call(this);
            
            // Defers the call to the specified function in the current context.
            this.defer = function(fn) {
                if (typeof fn === 'string') {
                    fn = self[fn];
                }
                
                if (!fn) {
                    return function() {};
                }
                
                var args = Array.prototype.slice.call(arguments, 1);
                
                return function() {
                    return fn.apply(self, args);
                }
            };

            // Fills the model with the specified values.
            this.import = function(obj) {
                if (ku.isModel(obj)) {
                    obj = obj.export();
                }

                // Update each value.
                each(obj, function(name, value) {
                    if (typeof self[name] === 'function') {
                        self[name](value);
                    }
                });

                // Tell everyone.
                this.observer.notifySubscribers();

                return this;
            };

            this.export = function() {
                var out = {}

                each(properties, function(i, v) {
                    out[i] = self[i]();
                });

                each(computed, function(i, v) {
                    out[i] = self[ku.formatGetter(i)]();
                });

                each(relations, function(i, v) {
                    out[i] = self[i].export();
                });

                return out;
            };

            // Clones the object.
            this.clone = function() {
                var clone = new model(this.export());
                clone.$parent = this.$parent;
                return clone;
            };

            // Resest the model back to defaults.
            this.reset = function() {
                each(properties, function(i, v) {
                    self[i](v);
                });
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

                    // Mark it as a relation.
                    relations[i] = v;

                    // Continue iteration.
                    return;
                }

                // Handle functions, both get*, set* and normal.
                if (typeof v === 'function') {
                    var name, type;

                    if (ku.isGetter(i)) {
                        name = ku.fromGetter(i);
                        type = 'read';
                    } else if (ku.isSetter(i)) {
                        name = ku.fromSetter(i);
                        type = 'write';
                    }

                    // If a "get" or "set" prefix was found, it is a computed observable.
                    if (type) {
                        // We make sure that an object is registered so
                        // that future getters or setters can be applied
                        // to it.
                        if (typeof computed[name] === 'undefined') {
                            computed[name] = {};
                        }

                        // Apply the function to the computed observer.
                        computed[name][type] = v;

                        return;
                    }

                    // Normal functions have to be wrapped in a function
                    // that will apply the current context to it and pass
                    // along the arguments.
                    self[i] = function() {
                        return v.apply(self, arguments);
                    };

                    // Mark as a method.
                    methods[i] = v;

                    return;
                }

                // Make observable.
                self[i] = ko.observable(v);

                // Mark as property.
                properties[i] = v;
            });

            // Apply computed properties.
            each(computed, function(name, computed) {
                // Automatically apply the current model.
                computed.owner = self;

                // If evaluation is not deferred, then some properties
                // accessed within the observer may not be available.
                computed.deferEvaluation = true;

                // Apply the computed observer.
                self[name] = ko.computed(computed);
            });

            // Fill with instance values.
            this.import(data);

            // Initialize if given an initializer.
            if (typeof this.init === 'function') {
                this.init();
            }
        };

        // The set constuctor for the current model.
        model.collection = ku.collection(model);

        // Save the model definition.
        model.definition = define;

        // So static members can be accessed from an instance.
        model.prototype.$static = model;

        // Ability to extend another model's definition.
        model.extend = function(otherModel) {
            otherModel = ku.isModel(otherModel) ? otherModel : ku.model(otherModel);
            each(define, function(i, v) {
                if (typeof otherModel.definition[i] === 'undefined') {
                    otherModel.definition[i] = v;
                }
            });
            return otherModel;
        };

        // Ability to inherit another model's definition.
        model.inherit = function(otherModel) {
            otherModel = ku.isModel(otherModel) ? otherModel : ku.model(otherModel);
            each(otherModel.definition, function(i, v) {
                define[i] = v;
            });
            return model;
        };
        
        // Ability to statically bind.
        model.knockup = function(to) {
            return new model().knockup(to);
        };

        return model;
    };

    // Contains a set of models and can be used like an array.
    ku.collection = function(model) {
        var collection = function(data) {
            Array.prototype.push.apply(this, []);

            // The observer is what is returned when the object is accessed.
            this.observer = generateObserver.call(this);
            
            // Returns an array values for the specified model property.
            this.aggregate = function(joiner, fields) {
                var arr = [];

                if (!fields) {
                    fields = [joiner];
                    joiner = '';
                }
                
                this.each(function(k, model) {
                    var parts = [];

                    each(fields, function(kk, field) {
                        if (typeof model[field] === 'function') {
                            parts.push(model[field]());
                        }
                    });

                    arr.push(parts.join(joiner));
                });
                
                return arr;
            };

            // Returns the item at the specified index.
            this.at = function(index) {
                return typeof this[index] === 'undefined' ? false : this[index];
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
                var at = typeof at === 'number' ? at : this.index(at);

                // Only attempt to remove if it exists.
                if (this.has(at)) {
                    // Remove the item.
                    Array.prototype.splice.call(this, at, 1);

                    // Notify subscribers.
                    this.observer.notifySubscribers();
                }

                return this;
            };
            
            // Clears the whole collection leave the collection empty
            this.empty = function() {
                Array.prototype.splice.call(this, 0, this.length);
                this.observer.notifySubscribers();
            }

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
                // Ensure instance of specified model.
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
            this.import = function(data) {
                var self = this;

                if (ku.isCollection(data)) {
                    data = data.export();
                }

                each(data, function(i, model) {
                    self.append(model);
                });

                return this;
            };

            this.export = function() {
                var out = [];

                this.each(function(i, v) {
                    out.push(v.export());
                });

                return out;
            };

            // Executes the callback for each item in the set.
            this.each = function(fn, data) {
                for (var i = 0; i < this.length; i++) {
                    fn.call(this, i, this[i]);
                }
                return this;
            };

            // Finds several items in the set.
            this.find = function(query, limit, page) {
                var collection = new this.$static.model.collection;

                // Ensure proper object hierarchy.
                collection.$parent = this.$parent;

                // If a model is passed, convert to raw values.
                if (ku.isModel(query)) {
                    query = query.export();
                }

                // If an object is passed, create a query for it.
                if (typeof query === 'object') {
                    query = (function(query) {
                        return function() {
                            var self = this,
                                ret  = true;

                            each(query, function(k, v) {
                                if (typeof self[k] === 'undefined' || self[k]() !== v) {
                                    ret = false;
                                    return false;
                                }
                            });

                            return ret;
                        }
                    })(query);
                }

                // Query each item.
                this.each(function(i, model) {
                    // If limiting and pagin, make sure we are at the proper offset.
                    if (limit && page) {
                        var offset = (limit * page) - limit;
                        
                        if (offset < i) {
                            return;
                        }
                    }
                    
                    // Append the item to the new collection.
                    if (query.call(model, i)) {
                        collection.append(model);
                    }

                    // If the limit has been reached, break;
                    if (limit && collection.length === limit) {
                        return false;
                    }
                });

                // We return collections so that object hierarchy is maintained and methods can continue to be called.
                return collection;
            };

            // Finds one item in the set.
            this.findOne = function(query) {
                return this.find(query, 1).first();
            };

            // Fill with the initial data.
            this.import(data);
        };

        // Model constructor.
        collection.model = model;

        // Instance members.
        collection.prototype = {
            $static: collection
        };

        return collection;
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
                if (fn(i, items[i]) === false) {
                    return;
                }
            }
        } else {
            for (var i in items) {
                if (fn(i, items[i]) === false) {
                    return;
                }
            }
        }
    };
    
    // Generates an observer for the applied context.
    function generateObserver() {
        return ko.computed({
            read: function() {
                return this;
            },
            write: function(value) {
                this.import(value);
            },
            owner: this
        });
    }
});