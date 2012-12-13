module('Attribute Bindings');

asyncTest('Main', function() {
    var div = document.createElement('div');
    div.setAttribute('data-ku-main', 'main.router');

    ku.set('main.router', new ku.Router);
    ku.get('main.router').set('index', function() {
        return {
            name: 'test'
        };
    });

    ku.get('main.router').view.http.events.on('success', function() {
        ok(div.childNodes[0].innerText === 'test', 'Inner text on div\'s child span should update.');
        start();
    });

    ku.run(div);
    ku.get('main.router').go('index');
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
        ok(div.childNodes[0].innerText === 'test', 'Inner text on div\'s child span should update.');
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