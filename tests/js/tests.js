var _undefined;

module('Attribute Bindings');

test('Model', function() {
    var div = document.createElement('div');
    div.setAttribute('data-ku-model', 'test.model');

    var span = document.createElement('span');
    span.setAttribute('data-bind', 'text: name');

    div.appendChild(span);

    ku.set('test.model', {
        name: 'test'
    });

    ku.run(div);

    ok(div.childNodes[0].innerHTML === 'test', 'Inner text on div\'s child span should update.');
});

asyncTest('Router', function() {
    var div = document.createElement('div');
    div.setAttribute('data-ku-router', 'test.router');

    var router = new ku.Router();
    router.view.http.events.on('success', function() {
        ok(div.childNodes[0].innerHTML === 'test', 'Inner text on div\'s child span should update.');
        start();
    });
    router.set('index', function() {
        return {
            name: 'test'
        };
    });

    ku.set('test.router', router);
    ku.run(div);
    ku.get('test.router').go('index');
});

asyncTest('View', function() {
    var div = document.createElement('div');
    div.setAttribute('data-ku-view', 'test.view');
    div.setAttribute('data-ku-path', 'index');
    div.setAttribute('data-ku-model', 'test.model');

    ku.set('test.view', new ku.View());
    ku.set('test.model', {
        name: 'test'
    });

    ku.get('test.view').http.events.on('success', function() {
        ok(div.childNodes[0].innerHTML === 'test', 'Inner text on div\'s child span should update.');
        start();
    });

    ku.run(div);
});



module('Models and Collections');

test('Defining', function() {
    var User = ku.model({
        name: '',
        addresses: [],
        readComputed: function() {

        }
    });

    var bob = new User({
        name: 'Bob Bobberson'
    });

    ok(ku.isModel(User), '`ku.model()` should return a valid model.');
    ok(ko.isObservable(bob.name), 'The property should be an observable.');
    ok(typeof bob.addresses.push === 'function', 'The property should be an observable array.');
    ok(ko.isComputed(bob.computed), 'The property should be a computed observable.');
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

    var exported = user.raw();

    ok(exported.bestFriend.name === user.bestFriend().name(), 'Dog should be the best friend.');
    ok(exported.friends[0].name === user.friends().first().name(), 'Cat should be 2nd best.');
    ok(exported.friends[1].name === user.friends().at(1).name(), 'Lizard should be 3rd best.');
});

test('Collection Manipulation', function() {
    var Item = ku.model({
        name: ''
    });

    var Items = ku.model({
        items: Item.Collection
    });

    var model = new Items;

    model.items([{
        name: 'test1',
    }, {
        name: 'test2'
    }]);

    ok(model.items().length === 2, 'Items not set.');

    model.items([{
        name: 'test1',
    }, {
        name: 'test2'
    }]);

    ok(model.items().length === 2, 'Items should be replaced when directly set.');
});

test('Observable Arrays', function() {
    var list  = document.createElement('ul');
    var item  = document.createElement('li');
    var model = ku.model({
        items: []
    });

    list.setAttribute('data-ku-model', 'model');
    list.setAttribute('data-bind', 'foreach: items');
    item.setAttribute('data-bind', 'text: $data');
    list.appendChild(item);
    ku.set('model', new model);
    ku.run(list);

    ok(ku.get('model').items.length === list.childNodes.length, 'No items should be present.');

    ku.get('model').items([
        'test1',
        'test2'
    ]);

    ok(ku.get('model').items.length === list.childNodes.length, 'Changes in view model not present.');
});

test('Computed Observables - Readers and Writers', function() {
    var User = ku.model({
        forename: '',
        surname: '',
        readName: function() {
            return this.forename() + ' ' + this.surname();
        },
        writeName: function(name) {
            name = name.split(' ');
            this.forename(name[0]).surname(name[1]);
            return this;
        }
    });

    var user     = new User().name('Barbara Barberson');
    var exported = user.raw();

    ok(exported.name === user.name(), 'The `name` reader should have been exported.');
});

test('Ownership Binding', function() {
    var NoParentModel = ku.model({
        name: ''
    });

    var ChildModel = ku.model({
        name: ''
    });

    var ParentModel = ku.model({
        child: ChildModel,
        children: ChildModel.Collection
    });

    var owner = new ParentModel({
        child: {
            name: 'test'
        },
        children: [{
            name: 'test'
        }]
    });

    ok(owner.child().$parent instanceof ParentModel, 'The child model\'s $parent should be an instanceof ParentModel.');
    ok(owner.children().at(0).$parent instanceof ParentModel, 'The children collection\'s $parent should be an instanceof ParentModel.');
});



module('Views');

test('No Model Binding', function() {
    var view = new ku.View();

    view.target = document.createElement('div');
    view.cache.test = 'test';

    view.render('test');

    ok(view.target.innerHTML === 'test', 'The view should render without a bound model.');
});



module('Http');

asyncTest('Parsing Based on Request Header', function() {
    var http = new ku.Http();

    http.headers.Accept = 'application/json';

    http.get('data/bob.json', function(r) {
        ok(r.name === 'Bob Bobberson', 'JSON object should be properly parsed.');
        start();
    });
});

test('Overloading Data and Callback Parameters', function() {
    var http = new ku.Http();

    http.request = function(url, data, type, callback) {
        callback({
            url: url,
            data: data,
            type: type,
            callback: callback
        });
    };

    http['delete']('test', function(r) {
        ok(!r.data.arg);
    });

    http['delete']('test', {
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