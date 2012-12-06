module('models');

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

test('Readers', function() {
    var User = ku.model({
        forename: '',
        surname: '',
        readName: function() {
            return this.forename() + ' ' + this.surname();
        }
    });

    var user = new User;
    user.forename('Barbara');
    user.surname('Barberson');

    var exported = user.export();

    ok(user.name() === 'Barbara Barberson', 'The `name` reader should return the full name.');
    ok(exported.name === 'Barbara Barberson', 'The `name` reader should have been exported.');
});