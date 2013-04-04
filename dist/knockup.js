!function(factory) {
    if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
        factory(require('knockout'), module.exports || exports);
    } else if (typeof define === 'function' && define.amd) {
        define(['knockout', 'exports'], factory);
    } else {
        factory(ko, window.ku = {});
    }
}(function(ko, ku) {
    
if (typeof ko === 'undefined') {
    throw 'KnockoutJS is required. Download at https://github.com/SteveSanderson/knockout.';
}

ku.bindings = {
    model: function(element, value) {
        if (this.attr(element, 'view')) {
            return;
        }

        ko.applyBindings(this.get(value), element);
    },

    router: function(element, value) {
        var router = this.get(value);

        if (!router) {
            ku.throwForElement(element, 'Cannot bind router "' + value + '" to the main view because it does not exist.');
        }

        if (!router instanceof this.Router) {
            ku.throwForElement(element, 'Cannot bind router "' + value + '" to the main view because it is not an instanceof "ku.Router".');
        }

        router.view.target = element;
        router.bind();
    },

    view: function(element, value) {
        var path  = this.attr(element, 'path'),
            model = this.get(this.attr(element, 'model')),
            view;

        if (path) {
            view = this.get(value);
        } else {
            var prefix = this.attr(element, 'prefix'),
                suffix = this.attr(element, 'suffix');

            view = new ku.View();

            if (prefix) {
                view.http.prefix = prefix;
            }

            if (suffix) {
                view.http.suffix = suffix;
            }
        }

        view.target = element;
        view.render(path, model);
    }
};
ku.collection = function(model) {
    var Collection = function(data) {
        Array.prototype.push.apply(this, []);

        this.observer = generateObserver(this);

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

        this.at = function(index) {
            return typeof this[index] === 'undefined' ? false : this[index];
        };

        this.first = function() {
            return this.at(0);
        };

        this.last = function() {
            return this.at(this.length - 1);
        };

        this.has = function(index) {
            return typeof this[index] !== 'undefined';
        };

        this.remove = function(at) {
            at = typeof at === 'number' ? at : this.index(at);

            if (this.has(at)) {
                Array.prototype.splice.call(this, at, 1);

                this.observer.notifySubscribers();
            }

            return this;
        };

        this.empty = function() {
            Array.prototype.splice.call(this, 0, this.length);
            this.observer.notifySubscribers();

            return this;
        };

        this.prepend = function(item) {
            return this.insert(0, item);
        };

        this.append = function(item) {
            return this.insert(this.length, item);
        };

        this.insert = function(at, item) {
            item         = ku.isModel(item) ? item : new model(item);
            item.$parent = this.$parent;

            Array.prototype.splice.call(this, at, 0, item);
            this.observer.notifySubscribers();

            return this;
        };

        this.replace = function (at, item) {
            item         = ku.isModel(item) ? item : new model(item);
            item.$parent = this.$parent;

            Array.prototype.splice.call(this, at, 1, item);
            this.observer.notifySubscribers();

            return this;
        };

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

        this.from = function(data) {
            var that = this;

            if (ku.isCollection(data)) {
                data = data.raw();
            }

            each(data, function(i, model) {
                if (that.has(i)) {
                    that.replace(i, model);
                } else {
                    that.replace(i, model);
                }
            });

            return this;
        };

        this.raw = function() {
            var out = [];

            this.each(function(i, v) {
                out.push(v.raw());
            });

            return out;
        };

        this.each = function(fn) {
            for (var i = 0; i < this.length; i++) {
                fn.call(this, i, this[i]);
            }
            return this;
        };

        this.find = function(query, limit, page) {
            var collection     = new this.$self.Model.Collection();
            collection.$parent = this.$parent;

            if (ku.isModel(query)) {
                query = query.raw();
            }

            if (typeof query === 'object') {
                query = (function(query) {
                    return function() {
                        var that = this,
                            ret  = true;

                        each(query, function(k, v) {
                            if (typeof that[k] === 'undefined' || that[k]() !== v) {
                                ret = false;
                                return false;
                            }
                        });

                        return ret;
                    };
                })(query);
            }

            this.each(function(i, model) {
                if (limit && page) {
                    var offset = (limit * page) - limit;

                    if (offset < i) {
                        return;
                    }
                }

                if (query.call(model, i)) {
                    collection.append(model);
                }

                if (limit && collection.length === limit) {
                    return false;
                }
            });

            return collection;
        };

        this.findOne = function(query) {
            return this.find(query, 1).first();
        };

        // alias deprecated methods
        this['export'] = this.raw;
        this['import'] = this.from;

        this.from(data);
    };

    Collection.Model = model;

    Collection.prototype = {
        $self: Collection
    };

    return Collection;
};
var globals = {};

ku.set = function(name, value) {
    globals[name] = value;

    return this;
};

ku.get = function(name) {
    return this.has(name) ? globals[name] : null;
};

ku.has = function(name) {
    return typeof globals[name] !== 'undefined';
};

ku.remove = function(name) {
    if (this.has(name)) {
        delete globals[name];
    }

    return this;
};

ku.reset = function() {
    globals = {};
    return this;
};
ku.Event = function() {
    this.stack = [];
    return this;
};

ku.Event.prototype = {
    bind: function(cb) {
        this.stack.push(cb);
        return this;
    },

    unbind: function(cb) {
        if (cb) {
            var stack = [];

            for (var i in this.stack) {
                if (this.stack[i] !== cb) {
                    stack.push(this.stack[i]);
                }
            }

            this.stack = stack;
        } else {
            this.stack = [];
        }

        return this;
    },

    trigger: function(args) {
        for (var i in this.stack) {
            if (this.stack[i].apply(this, args) === false) {
                return false;
            }
        }
    }
};
ku.Events = function() {
    this.events = {};
    return this;
};

ku.Events.prototype = {
    on: function(name, handler) {
        if (typeof this.events[name] === 'undefined') {
            this.events[name] = new ku.Event();
        }

        this.events[name].bind(handler);

        return this;
    },

    off: function(name, handler) {
        if (!name) {
            this.events = {};
            return this;
        }

        if (typeof this.events[name] !== 'undefined') {
            this.events[name].unbind(handler);
        }

        return this;
    },

    trigger: function(name, args) {
        if (typeof this.events[name] !== 'undefined') {
            if (this.events[name].trigger(args) === false) {
                return false;
            }
        }
    }
};
ku.Http = function() {
    this.events = new ku.Events();
    return this;
};

ku.Http.prototype = {
    prefix: '',

    suffix: '',

    headers: {},

    parsers: {
        'application/json': function(response) {
            try {
                return JSON.parse(response);
            } catch (error) {
                throw 'Error parsing response "' + response + '" with message "' + error + '".';
            }
        }
    },

    'delete': function(url, data, fn) {
        return this.request(url, data || {}, 'delete', fn || data);
    },

    get: function(url, data, fn) {
        return this.request(url, data || {}, 'get', fn || data);
    },

    head: function(url, data, fn) {
        return this.request(url, data || {}, 'head', fn || data);
    },

    options: function(url, data, fn) {
        return this.request(url, data || {}, 'options', fn || data);
    },

    patch: function(url, data, fn) {
        return this.request(url, data, 'patch', fn);
    },

    post: function(url, data, fn) {
        return this.request(url, data, 'post', fn);
    },

    put: function(url, data, fn) {
        return this.request(url, data, 'put', fn);
    },

    request: function(url, data, type, fn) {
        var self        = this,
            request     = this.createRequestObject(),
            queryString = '';

        if (typeof data === 'function') {
            data = undefined;
        }

        if (ku.isModel(data)) {
            data = data.raw();
        }

        if (typeof data === 'object') {
            data = this.serialize(data);
        }

        if (data && type.toLowerCase() == 'get') {
            queryString = '?' + data;
            data = undefined;
        }

        request.open(type.toUpperCase(), this.prefix + url + this.suffix + queryString, true);

        for (var header in this.headers) {
            request.setRequestHeader(header, this.headers[header]);
        }

        request.onreadystatechange = function () {
            if (request.readyState !== 4) {
                return;
            }

            if (request.status !== 200 && request.status !== 304) {
                self.events.trigger('error', [request]);
                self.events.trigger('stop', [request]);
                return;
            }

            var response = request.responseText,
                headers  = request.getAllResponseHeaders();

            if (typeof headers['Content-Type'] === 'string' && typeof self.parsers[headers['Content-Type']] === 'function') {
                response = self.parsers[headers['Content-Type']](response);
            } else if (typeof self.headers.Accept === 'string' && typeof self.parsers[self.headers.Accept] === 'function') {
                response = self.parsers[self.headers.Accept](response);
            }

            if (typeof fn === 'function') {
                fn(response, request);
            }

            self.events.trigger('success', [response, request]);
            self.events.trigger('stop', [request]);
        };

        if (request.readyState === 4) {
            return;
        }

        if (data) {
            request.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
        }

        this.events.trigger('start', [request]);
        request.send(data);

        return this;
    },

    serialize: function(obj, prefix) {
        var str = [];

        for (var p in obj) {
            var k = prefix ? prefix + '[' + p + ']' : p, v = obj[p];
            str.push(typeof v === 'object' ? this.serialize(v, k) : encodeURIComponent(k) + '=' + encodeURIComponent(v));
        }

        return str.join('&');
    },

    createRequestObject: function() {
        var request   = false;
            factories = [
                function () { return new XMLHttpRequest(); },
                function () { return new ActiveXObject('Msxml2.XMLHTTP'); },
                function () { return new ActiveXObject('Msxml3.XMLHTTP'); },
                function () { return new ActiveXObject('Microsoft.XMLHTTP'); }
            ];

        for (var i = 0; i < factories.length; i++) {
            try {
                request = factories[i]();
            } catch (e) {
                continue;
            }
        }

        if (!request) {
            throw 'An XMLHttpRequest could not be generated.';
        }

        return request;
    }
};

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

function each(items, fn) {
    items = items || [];

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
        for (var x in items) {
            if (fn(x, items[x]) === false) {
                return;
            }
        }
    }
}

function generateObserver(obj) {
    return ko.computed({
        read: function() {
            return obj;
        },
        write: function(value) {
            obj.from(value);
        },
        owner: obj
    });
}
ku.prefix = 'data-ku-';

ku.element = document;

ku.run = function(element) {
    element = element || this.element;

    if (typeof element === 'function') {
        element = element();
    }

    if (typeof element === 'string') {
        element = document.getElementById(element);
    }

    if (element !== document) {
        ku.bindOne(element);
    }

    ku.bindDescendants(element);
};

ku.bindOne = function(element) {
    var self = this;

    each(element.attributes, function(i, node) {
        if (node.name.indexOf(self.prefix) === 0) {
            var name = node.name.substring(self.prefix.length);

            if (typeof self.bindings[name] === 'function') {
                self.bindings[name].call(self, element, node.value);
            }
        }
    });
};

ku.bindDescendants = function(element) {
    each(element.childNodes, function(i, el) {
        ku.run(el);
    });
};

ku.attr = function(element, attribute, value) {
    attribute = ku.prefix + attribute;

    if (typeof value === 'undefined') {
        if (element.getAttribute) {
            return element.getAttribute(attribute);
        }

        return typeof element[attribute] === 'undefined' ? null : element[attribute];
    }

    if (!value) {
        if (element.removeAttribute) {
            element.removeAttribute(attribute);
        } else if (typeof element[attribute] !== 'undefined') {
            delete element[attribute];
        }

        return this;
    }

    if (element.setAttribute) {
        element.setAttribute(attribute, value);
    } else {
        element[attribute] = value;
    }

    return this;
};

ku.outerHtml = function(element) {
    var div = document.createElement('div');
    div.appendChild(element);
    return div.innerHTML;
};

ku.throwForElement = function(element, message) {
    throw message + "\n" + ku.outerHtml(element);
};

ku.isReader = function(name) {
    return name.indexOf('read') === 0;
};

ku.isWriter = function(name) {
    return name.indexOf('write') === 0;
};

ku.toReader = function(name) {
    return 'read' + name.substring(0, 1).toUpperCase() + name.substring(1);
};

ku.toWriter = function(name) {
    return 'write' + name.substring(0, 1).toUpperCase() + name.substring(1);
};

ku.fromReader = function(name) {
    return name.substring(4, 5).toLowerCase() + name.substring(5);
};

ku.fromWriter = function(name) {
    return name.substring(5, 6).toLowerCase() + name.substring(6);
};

ku.isModel = function(fn) {
    return fnCompare(fn, ku.model().toString());
};

ku.isCollection = function(fn) {
    return fnCompare(fn, ku.collection().toString());
};
ku.model = function(definition) {
    var Model = function(data) {
        var that = this;

        this.clone = function() {
            var clone     = new Model(this.raw());
            clone.$parent = this.$parent;
            return clone;
        };

        this.from = function(obj) {
            if (ku.isModel(obj)) {
                obj = obj.raw();
            }

            each(obj, function(name, value) {
                if (typeof that[name] === 'function') {
                    that[name](value);
                }
            });

            this.observer.notifySubscribers();

            return this;
        };

        this.raw = function() {
            var out = {};

            each(that.$self.properties, function(i, v) {
                out[i] = that[i]();
            });

            each(that.$self.computed, function(i, v) {
                out[i] = that[i]();
            });

            each(that.$self.relations, function(i, v) {
                out[i] = that[i]().raw();
            });

            return out;
        };

        this.reset = function() {
            each(that.$self.properties, function(i, v) {
                that[i](v);
            });

            return this;
        };

        // alias deprecated methods
        this['export'] = this.raw;
        this['import'] = this.from;

        define(this);
        this.from(data);

        if (typeof this.init === 'function') {
            this.init();
        }
    };

    Model.Collection      = ku.collection(Model);
    Model.computed        = {};
    Model.methods         = {};
    Model.properties      = {};
    Model.relations       = {};
    Model.prototype.$self = Model;

    Model.extend = function(OtherModel) {
        OtherModel = ku.isModel(OtherModel) ? OtherModel : ku.model(OtherModel);

        each(Model.computed, function(i, v) {
            if (typeof OtherModel.computed[i] === 'undefined') {
                OtherModel.computed[i] = v;
            }
        });

        each(Model.methods, function(i, v) {
            if (typeof OtherModel.methods[i] === 'undefined') {
                OtherModel.methods[i] = v;
            }
        });

        each(Model.properties, function(i, v) {
            if (typeof OtherModel.properties[i] === 'undefined') {
                OtherModel.properties[i] = v;
            }
        });

        each(Model.relations, function(i, v) {
            if (typeof OtherModel.relations[i] === 'undefined') {
                OtherModel.relations[i] = v;
            }
        });

        return OtherModel;
    };

    Model.inherit = function(OtherModel) {
        return OtherModel.extend(Model);
    };

    interpretDefinition(Model, definition);

    return Model;
};

function interpretDefinition(Model, definition) {
    each(definition, function(i, v) {
        if (ku.isModel(v) || ku.isCollection(v)) {
            Model.relations[i] = v;
            return;
        }

        if (typeof v === 'function') {
            var name, type;

            if (ku.isReader(i)) {
                name = ku.fromReader(i);
                type = 'read';
            } else if (ku.isWriter(i)) {
                name = ku.fromWriter(i);
                type = 'write';
            }

            if (type) {
                if (typeof Model.computed[name] === 'undefined') {
                    Model.computed[name] = {};
                }

                Model.computed[name][type] = v;
                return;
            }

            Model.methods[i] = v;
            return;
        }

        Model.properties[i] = v;
    });
}

function define(obj) {
    obj.observer = generateObserver(obj);

    defineComputed(obj);
    defineMethods(obj);
    defineProperties(obj);
    defineRelations(obj);
}

function defineComputed(obj) {
    each(obj.$self.computed, function(name, computed) {
        obj[name] = ko.computed({
            owner: obj,
            deferEvaluation: true,
            read: computed.read,
            write: computed.write
        });
    });
}

function defineMethods(obj) {
    each(obj.$self.methods, function(name, method) {
        obj[name] = function() {
            return method.apply(obj, arguments);
        };
    });
}

function defineProperties(obj) {
    each(obj.$self.properties, function(name, property) {
        if (Object.prototype.toString.call(property) === '[object Array]') {
            obj[name] = ko.observableArray(property);
        } else {
            obj[name] = ko.observable(property);
        }
    });
}

function defineRelations(obj) {
    each(obj.$self.relations, function(name, relation) {
        var instance     = new relation();
        obj[name]        = instance.observer;
        instance.$parent = obj;
    });
}
var bound = [];

ku.Router = function() {
    this.events = new ku.Events();
    this.routes = {};
    this.state  = new ku.State();
    this.view   = new ku.View();

    return this;
};

ku.Router.prototype = {
    route: false,

    bind: function() {
        bound.push(this);

        if (!('onpopstate' in window) || (!this.state.enabled || (this.state.enabled && !window.location.hash))) {
            this.dispatch();
        }

        return this;
    },

    unbind: function() {
        for (var i = 0; i < bound.length; i++) {
            if (this === bound[i]) {
                delete bound[i];
            }
        }

        return this;
    },

    set: function(name, options) {
        if (typeof options === 'function') {
            options = {
                match: new RegExp('^' + name + "$"),
                format: name,
                controller: options
            };
        }

        if (!options.view) {
            options.view = name;
        }

        this.routes[name] = options instanceof ku.Route ? options : new ku.Route(options);

        return this;
    },

    get: function(name) {
        if (this.has(name)) {
            return this.routes[name];
        }

        throw 'Route "' + name + '" does not exist.';
    },

    has: function(name) {
        return typeof this.routes[name] !== 'undefined';
    },

    remove: function(name) {
        if (this.has(name)) {
            delete this.routes[name];
        }

        return this;
    },

    dispatch: function(request) {
        if (typeof request === 'undefined') {
            request = this.state.get();
        }

        for (var i in this.routes) {
            var route  = this.routes[i],
                params = route.query(request);

            if (typeof params.length !== 'number') {
                continue;
            }

            if (this.events.trigger('exit', [this]) === false) {
                return this;
            }

            if (this.route && this.events.trigger('exit.' + i, [this, this.route]) === false) {
                return this;
            }

            if (this.events.trigger('enter', [this]) === false) {
                return this;
            }

            if (this.events.trigger('enter.' + i, [this, route]) === false) {
                return this;
            }

            var model = route.controller.apply(route.controller, params);

            if (model && model.constructor === Object) {
                model = new (ku.model(model))();
            }

            if (model !== false) {
                this.view.render(route.view, model);
            }

            this.route = route;

            this.state.previous = request;

            return this;
        }

        this.route = false;

        return this;
    },

    go: function(name, params, data) {
        this.state.push(this.get(name).generate(params), data);
        return this;
    },

    generate: function(name, params) {
        return this.get(name).generate(params);
    }
};



ku.Route = function(options) {
    for (var i in options) {
        this[i] = options[i];
    }

    return this;
};

ku.Route.prototype = {
    match: /.*/,

    format: '',

    view: false,

    controller: function(){},

    query: function(request) {
        var params = request.match(this.match);

        if (params === null) {
            return false;
        }

        params.shift();

        return params;
    },

    generate: function(params) {
        var format = this.format;

        for (var name in params) {
            format = format.replace(new RegExp('\\:' + name, 'g'), params[name]);
        }

        return format;
    }
};



var oldState = window.location.hash;

var interval;

var isStarted = false;

ku.State = function() {
    this.states = {};
    ku.State.start();
    return this;
};

ku.State.interval = 500;

ku.State.start = function() {
    if (isStarted) {
        return ku.State;
    }

    var isIeLyingAboutHashChange = 'onhashchange' in window && /MSIE\s(6|7)/.test(navigator.userAgent);

    if ('onpopstate' in window) {
        bind('popstate');
    } else if (!isIeLyingAboutHashChange) {
        bind('hashchange');
    } else {
        bind('hashchange');
        interval = setInterval(function() {
            if (oldState !== window.location.hash) {
                oldState = window.location.hash;
                trigger('hashchange');
            }
        }, ku.State.interval);
    }

    isStarted = true;

    return ku.State;
};

ku.State.stop = function() {
    if (interval) {
        clearInterval(interval);
    }

    var e = 'onpopstate' in window ? 'popstate' : 'hashchange';
    if (window.removeEventListener) {
        window.removeEventListener(e, dispatch);
    } else if (window[e]) {
        delete window[e];
    }

    isStarted = false;

    return State;
};

ku.State.prototype = {
    previous: false,

    enabled: false,

    scroll: false,

    get: function() {
        if (this.enabled && window.history.pushState) {
            return removeHostPart(window.location.href);
        }
        return window.location.hash.substring(1);
    },

    push: function(uri, data, description) {
        if (this.enabled && window.history.pushState) {
            window.history.pushState(data, description, uri || '.');
            dispatch();
        } else {
            updateHash(uri, this.scroll);
        }

        this.states[uri] = data;

        return this;
    },

    data: function(state) {
        state = state || this.get();

        if (typeof this.states[state] === 'undefined') {
            return null;
        }

        return this.states[state];
    }
};



function removeHostPart(href) {
    return href.replace(/http(s)?\:\/\/[^\/]+/, '');
}

function bind(e) {
    if (window.addEventListener) {
        window.addEventListener(e, dispatch, false);
    } else {
        window['on' + e] = dispatch;
    }
}

function trigger(e) {
    if (document.createEvent) {
        event = document.createEvent('HTMLEvents');
        event.initEvent(e, true, true);
        window.dispatchEvent(event);
    } else {
        window['on' + e](document.createEventObject());
    }
}

function updateHash(uri, scroll) {
    if (scroll) {
        return;
    }

    var id    = uri.replace(/^#/, '');
    var node  = document.getElementById(id);
    var x     = window.pageXOffset ? window.pageXOffset : document.body.scrollLeft;
    var y     = window.pageYOffset ? window.pageYOffset : document.body.scrollTop;
    var dummy = document.createElement('div');

    if (node) {
        node.id = '';
    }

    dummy.id             = id || '_';
    dummy.style.position = 'absolute';
    dummy.style.width    = 0;
    dummy.style.height   = 0;
    dummy.style.left     = x + 'px';
    dummy.style.top      = y + 'px';
    dummy.style.padding  = 0;
    dummy.style.margin   = 0;

    document.body.appendChild(dummy);
    window.location.hash = '#' + dummy.id;
    document.body.removeChild(dummy);

    if (node) {
        node.id = id;
    }
}

function dispatch() {
    for (var i = 0; i < bound.length; i++) {
        bound[i].dispatch();
    }
}
ku.View = function() {
    this.cache       = {};
    this.http        = new ku.Http();
    this.http.prefix = 'views/';
    this.http.suffix = '.html';
    this.http.accept = 'text/html';

    return this;
};

ku.View.prototype = {
    http: false,

    target: null,

    idPrefix: 'ku-view-',

    idSuffix: '',

    idSeparator: '-',

    render: function(name, model) {
        var self = this,
            id   = this.idPrefix + name.replace(/\//g, this.idSeparator) + this.idSuffix;

        if (this.cache[name]) {
            this.renderer(this.cache[name], model);
        } else if (document.getElementById(id)) {
            this.renderer(this.cache[name] = document.getElementById(id).innerHTML, model);
        } else if (this.http) {
            this.http.get(name, function(html) {
                self.renderer(self.cache[name] = html, model);
            });
        }

        return this;
    },

    renderer: function(view, model) {
        var target = this.target;

        if (!target) {
            throw 'Cannot render view because no target was specified.';
        }

        if (typeof target === 'string') {
            target = document.getElementById(target);
        } else if (typeof target === 'function') {
            target = target();
        }

        target.innerHTML = view;

        ku.bindDescendants(target);
        ko.applyBindings(model, target);
    }
};

});