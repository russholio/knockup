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