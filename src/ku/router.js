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