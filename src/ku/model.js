ku.model = function(define) {
    var Model = function(data) {
        var computed   = {},
            properties = {},
            relations  = {},
            methods    = {},
            self       = this;

        this.observer = generateObserver.call(this);

        this.from = function(obj) {
            if (ku.isModel(obj)) {
                obj = obj.raw();
            }

            each(obj, function(name, value) {
                if (typeof self[name] === 'function') {
                    self[name](value);
                }
            });

            this.observer.notifySubscribers();

            return this;
        };

        this.raw = function() {
            var out = {};

            each(properties, function(i, v) {
                out[i] = self[i]();
            });

            each(computed, function(i, v) {
                out[i] = self[i]();
            });

            each(relations, function(i, v) {
                out[i] = self[i]().raw();
            });

            return out;
        };

        this.clone = function() {
            var clone = new Model(this.raw());

            clone.$parent = this.$parent;

            return clone;
        };

        this.reset = function() {
            each(properties, function(i, v) {
                self[i](v);
            });

            return this;
        };

        each(define, function(i, v) {
            if (ku.isModel(v) || ku.isCollection(v)) {
                var obj = new v();

                self[i] = obj.observer;

                obj.$parent = self;

                relations[i] = v;

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
                    if (typeof computed[name] === 'undefined') {
                        computed[name] = {};
                    }

                    computed[name][type] = v;

                    return;
                }

                self[i] = function() {
                    return v.apply(self, arguments);
                };

                methods[i] = v;

                return;
            }

            self[i] = ko.observable(v);

            properties[i] = v;
        });

        each(computed, function(name, computed) {
            computed.owner = self;

            computed.deferEvaluation = true;

            self[name] = ko.computed(computed);
        });

        this.from(data);

        if (typeof this.init === 'function') {
            this.init();
        }
    };

    Model.Collection      = ku.collection(Model);
    Model.definition      = define;
    Model.prototype.$self = Model;

    Model.extend = function(OtherModel) {
        OtherModel = ku.isModel(OtherModel) ? OtherModel : ku.model(OtherModel);
        
        each(define, function(i, v) {
            if (typeof OtherModel.definition[i] === 'undefined') {
                OtherModel.definition[i] = v;
            }
        });

        return OtherModel;
    };

    Model.inherit = function(OtherModel) {
        OtherModel = ku.isModel(OtherModel) ? OtherModel : ku.model(OtherModel);

        each(OtherModel.definition, function(i, v) {
            define[i] = v;
        });

        return Model;
    };

    return Model;
};