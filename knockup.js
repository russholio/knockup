// Knockup, ORM for Knockout, v0.1.0
// Copyright (c) Trey Shugart http://iamtres.com
// License: MIT http://www.opensource.org/licenses/mit-license.php
!function() {

    // If knockout is not defined, let them know.
    if (_undefined(ko)) {
        throw new Error('Cannot find KnockoutJS. Download at https://github.com/SteveSanderson/knockout/downloads.');
    }

    // Expose the knockup object.
    window.ku = {};

    // Knockup sets are collections of models.
    // The model is just a constructor returned from ku.model().
    // The data is used to give the array an initialized state.
    ku.set = function(model, data) {
        // The set data is just an observable array.
        var _data = ko.observableArray();

        // Returns the raw observable array.
        this.ko = function() {
            return _data();
        };

        // Returns the item at the specified index.
        this.at = function(index) {
            if (!this.has(index)) {
                this.insert(index, {});
            }
            return _data()[index];
        };

        // Returns whether or not an item exists at the specified index.
        this.has = function(index) {
            return _defined(_data(), index);
        };

        // Prepends the specified model.
        this.prepend = function(item) {
            return this.insert(0, item);
        };

        // Appends the specified model.
        this.append = function(item) {
            return this.insert(_data().length, item);
        };

        // Inserts the model at the specified index.
        this.insert = function(at, item) {
            _data.splice(at, 0, new model(item));
            return this;
        };

        // Fills the set with the specified data.
        this.fill = function(data) {
            _each(data, this, function(i, item, set) {
                set.append(item);
            });
            return this;
        };

        // Returns the total nubmer of items in the set.
        this.count = function() {
            return _data().length;
        };

        // Finds several items in the set.
        this.find = function(query, limit) {
            var found = [];

            _each(_data(), found, function(i, model) {
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

    // Creates a knockup model.
    // The initial data in the model is specified by the "inherit" argument.
    ku.model = function(inherit) {
        var _allow  = [],
            _block  = [],
            _many   = {},
            _one    = {},
            _strict = false;

        // This is the constructor that gets modified and returned.
        var ret = function(fill) {
            var _data = {},
                _self = this;

            // Returns a knockout observable, observableArray or computed.
            this.ko = function(name) {
                // property must be accessible
                if (!this.access(name)) {
                    return;
                }

                // has-manys handle their own observers
                if (_defined(_many, name)) {
                    return _data[name]().ko();
                }

                // allow for flexible objects
                if (_undefined(_data, name)) {
                    _data[name] = ko.observable();
                }

                // return the property observer
                return _data[name];
            };

            // Returns the specified value.
            this.get = function(name) {
                var obs = this.ko(name);

                // if no observer is returned, we don't have access
                if (!obs) {
                    return;
                }

                // has-manys handle their own observers
                if (_defined(_many, name)) {
                    return _data[name]();
                }

                return obs();
            };

            // Sets the specified value.
            this.set = function(name, value) {
                var obs = this.ko(name);

                // if no observer is returned, we don't have access
                if (!obs) {
                    return this;
                }

                // has-manys handle their own observers
                if (_defined(_one, name) || _defined(_many, name)) {
                    _data[name]().fill(value);
                } else if (obs) {
                    obs(value);
                }

                return this;
            };

            // Returns whether or not the model has the specified value.
            this.has = function(name) {
                return _defined(_data, name);
            };

            // Removes the specified value.
            this.remove = function(name) {
                if (this.has(name)) {
                    delete _data[name];
                }
                return this;
            };

            // Returns whether or not the specified property is accessible.
            this.access = function(name) {
                if (_in(_block, name)) {
                    return true;
                }

                if (_in(_allow, name)) {
                    return false;
                }

                return !_strict;
            };

            // Fills the model with the specified values.
            this.fill = function(obj) {
                _each(obj, function(name, value) {
                    _self.set(name, value);
                });
                return this;
            };

            // Returns whether or not the model matches the given hash.
            this.is = function(query) {
                var found = false;

                _each(query, function(name, value) {
                    if (_self.has(name) && _self.get(name) === value) {
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

            // Apply computed observable methods.
            _each(this, [_data, this], function(name, value, data) {
                if (!_function(value)) {
                    return;
                }

                var matched = name.match(/^(get|set)([A-Z][a-zA-Z0-9]?+)$/);

                if (matched) {
                    data[0][_lcfirst(matched[2])] = ko.computed(value, data[1]);
                }
            });

            // Apply has-one relationships.
            _each(_one, _data, function(name, value, data) {
                data[name] = ko.observable(new value);
            });

            // Apply has-many relationships.
            _each(_many, _data, function(name, value, data) {
                data[name] = ko.observable(new ku.set(value));
            });

            // Fill with default values.
            this.fill(inherit);

            // Fill with instance values.
            this.fill(fill);
        };

        // Creates a new model using the specified properties.
        ret.create = function(props) {
            return new ret().fill(props);
        };

        // Applies a one-to-one relationship.
        ret.one = function(name, model) {
            var models = name;

            if (typeof name === 'string') {
                models = {};
                models[name] = model;
            }

            _each(models, _one, function(name, model, one) {
                one[name] = model;
            });

            return ret;
        };

        // Applies a one-to-many relationship.
        ret.many = function(name, model) {
            var models = name;

            if (typeof name === 'string') {
                models = {};
                models[name] = model;
            }

            _each(models, _many, function(name, model, many) {
                many[name] = model;
            });

            return ret;
        };

        // Allows the specified items as model properties.
        ret.allow = function(list) {
            _each(list, _block, function(i, v, l) {
                l.push(v);
            });
            return ret;
        };

        // Blocks the specified model properties from being accessed.
        ret.block = function(list) {
            _each(list, _allow, function(i, v, l) {
                l.push(v);
            });
            return ret;
        };

        // Makes the model closed off from arbitrary modifications.
        // By default, models will accept any property.
        ret.strict = function(bool) {
            _strict = bool ? true : false;
            return ret;
        };

        // Return the model constructor.
        return ret;
    };

    // Iterates over an array or hash.
    function _each(items, data, fn) {
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

    // Returns whether or not the object or specified property on the object is defined.
    function _defined(obj, prop) {
        return !_undefined(obj, prop);
    }

    // Returns whether or not the object or function on the object is a function.
    function _function(obj, fn) {
        typeof arguments.length ? typeof obj[fn] === 'function' : typeof obj === 'function';
    }

    // Return whether or not the specified value exists in the given array.
    function _in(arr, val) {
        return arr.indexOf(val) > -1;
    }

    // Makes the first character of the given string uppercase and returns the string.
    function _ucfirst(str) {
        return str.charAt(0).toUpperCase() + str.substr(1);
    }

    // Returns whether or not the object or specified property on the object is undefined.
    function _undefined(obj, prop) {
        return arguments.length === 2 ? typeof obj[prop] === 'undefined' : typeof obj === 'undefined';
    }

}();