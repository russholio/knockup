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