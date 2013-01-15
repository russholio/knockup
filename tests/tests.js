module('Attribute Bindings');

test('Model', function() {
    var div = document.createElement('div');
    div.setAttribute('data-ku-model', 'model.model');

    var span = document.createElement('span');
    span.setAttribute('data-bind', 'text: name');

    div.appendChild(span);

    ku.set('model.model', {
        name: 'test'
    });

    ku.run(div);

    ok(div.childNodes[0].innerHTML === 'test', 'Inner text on div\'s child span should update.');
});

asyncTest('Router', function() {
    var div = document.createElement('div');
    div.setAttribute('data-ku-router', 'router.router');

    ku.set('router.router', new ku.Router);
    ku.get('router.router').set('index', function() {
        return {
            name: 'test'
        };
    });

    ku.get('router.router').view.http.events.on('success', function() {
        ok(div.childNodes[0].innerHTML === 'test', 'Inner text on div\'s child span should update.');
        start();
    });

    ku.run(div);
    ku.get('router.router').go('index');
});

asyncTest('View', function() {
    var div = document.createElement('div');
    div.setAttribute('data-ku-view', 'view.view');
    div.setAttribute('data-ku-path', 'index');
    div.setAttribute('data-ku-model', 'view.model');

    ku.set('view.view', new ku.View);
    ku.set('view.model', {
        name: 'test'
    });

    ku.get('view.view').http.events.on('success', function() {
        ok(div.childNodes[0].innerHTML === 'test', 'Inner text on div\'s child span should update.');
        start();
    });

    ku.run(div);
});



module('Models and Collections');

test('Defining', function() {
    var User = ku.model({
        name: 'Bob Bobberson'
    });

    ok(ku.isModel(User), '`ku.model()` should return a valid model.');
});

test('Instantiating', function() {
    var User = ku.model({
        name: ''
    });

    var instance = new User({
        name: 'test',
        undefinedProperty: 'test'
    });

    ok(instance instanceof User, 'The `user` instance should be an instance of the `User` model.');
    ok(ko.isObservable(instance.observer), 'The `observer` property should be a Knockout observable.');
    ok(instance.name() === 'test', 'The instance should be filled when data is passed to the constructor.');
    ok(typeof instance.undefinedProperty === 'undefined', 'Undefined properties should not be set.');
});

test('Relationships', function() {
    var Friend = ku.model({
        name: ''
    });

    var User = ku.model({
        bestFriend: Friend,
        friends: Friend.Collection
    });

    var user = new User().bestFriend({
        name: 'Dog'
    }).friends([
        { name: 'Cat' },
        { name: 'Lizard' }
    ]);

    var exported = user.export();

    ok(exported.bestFriend.name === user.bestFriend().name(), 'Dog should be the best friend.');
    ok(exported.friends[0].name === user.friends().first().name(), 'Cat should be 2nd best.');
    ok(exported.friends[1].name === user.friends().at(1).name(), 'Lizard should be 3rd best.');
});

test('Readers', function() {
    var User = ku.model({
        forename: '',
        surname: '',
        readName: function() {
            return this.forename() + ' ' + this.surname();
        }
    });

    var user     = new User().forename('Barbara').surname('Barberson');
    var exported = user.export();

    ok(exported.name === user.name(), 'The `name` reader should have been exported.');
});



module('Views');

test('No Model Binding', function() {
    var view = new ku.View;
    
    view.target = document.createElement('div');
    view.cache.test = 'test';

    view.render('test');

    ok(view.target.innerHTML === 'test', 'The view should render without a bound model.')
});



module('Http');

asyncTest('Parsing Based on Request Header', function() {
    var http = new ku.Http;

    http.headers['Accept'] = 'application/json';

    http.get('data/bob.json', function(r) {
        ok(r.name === 'Bob Bobberson', 'JSON object should be properly parsed.');
        start();
    });
});

test('Overloading Data and Callback Parameters', function() {
    var http = new ku.Http;

    http.request = function(url, data, type, callback) {
        callback({
            url: url,
            data: data,
            type: type,
            callback: callback
        });
    };

    http.delete('test', function(r) {
        ok(!r.data.arg);
    });

    http.delete('test', {
        arg: 'yes'
    }, function(r) {
        ok(r.data.arg === 'yes');
    });

    http.get('test', function(r) {
        ok(!r.data.arg);
    });

    http.get('test', {
        arg: 'yes'
    }, function(r) {
        ok(r.data.arg === 'yes');
    });

    http.head('test', function(r) {
        ok(!r.data.arg);
    });

    http.head('test', {
        arg: 'yes'
    }, function(r) {
        ok(r.data.arg === 'yes');
    });

    http.options('test', function(r) {
        ok(!r.data.arg);
    });

    http.options('test', {
        arg: 'yes'
    }, function(r) {
        ok(r.data.arg === 'yes');
    });
});