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