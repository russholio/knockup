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