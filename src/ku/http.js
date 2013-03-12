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
        var self    = this,
            request = this.createRequestObject();

        request.open(type.toUpperCase(), this.prefix + url + this.suffix, true);
        request.setRequestHeader('Accept', this.accept);

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

        if (ku.isModel(data)) {
            data = data.raw();
        }

        if (typeof data === 'object') {
            data = this.serialize(data);
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
