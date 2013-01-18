ku.View = function() {
    this.cache       = {};
    this.http        = new ku.Http;
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

    render: function(name, model) {
        var self = this,
            id   = this.idPrefix + name + this.idSuffix;

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
            var target = document.getElementById(target);
        } else if (typeof target === 'function') {
            var target = target();
        }

        target.innerHTML = view;

        ku.bindDescendants(target);
        ko.applyBindings(model, target);
    }
};