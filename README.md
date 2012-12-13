Knockup - MVC for Knockout
==========================

Knockup builds on Knockout to give you a complete MVC solution for building RESTful JavaScript web applications. Its only dependency is Knockout, but is compatible with any CommonJS AMD library. There's no silly "Starter Kit", or chain of depenencies that you need to install. Just make sure you've got Knockout and Knockup, and you're ready to start coding.

Features include:

- Full MVC separation.
- Full AMD / CommonJS support while falling back to setting the global `ku` object.
- Complete Model / Collection and relationship management.
- View component allowing views ot be separated into their own HTML files and cached for reuse.
- Attribute bindings similar to AngularJS.
- REST Client with built-in JSON support.
- Simple and flexible routing with full support for both browser state and hashchange events.

Integration
-----------

Knockup uses Knockout behind the scenes has been designed so that you can drop it into your existing Knockout app and start using it right away without changing your existing models or bindings.

Getting Started
---------------

To get started with Knockup, you must understand the two key points of how it binds itself to your UI and how it accesses the objects required to do that.

### Routable Content Area

The first part is using a container that is bound to a router. This container is bound to a router and affected by changes in the URL. Controllers are automatically called and views are automatically rendered and bound as the content to the container. You can have as many containers bound to as many routers as you want. Most web-applications will just use one.

To give the UI something to bind itself to, we must first set up our router:

    var router = new ku.Router;

Then give it a route:
    
    router.set('my/url', MyController);

And finally make the router accessible to other parts of your app:
    
    ku.set('my-router', router);

Now we have something we can bind the UI to:

    <div data-ku-router="my-router"></div>

All we have to do to make everything work together is:

    ku.run();

When the URL `#my/url` is accessed, the route will be matched, controller executed and the view `views/my/url.html` will be rendered, placed in the container and then bound to the model that was returned from the controller.

### Active Components

The second part is binding objects to different areas in your UI. These areas can be bound to a Knockup Model:

    var Notification = ku.model({
        content: '21 Unread Messages'
    });
    
    ku.set('notifications', {
        notifications: Notification.Collection
    });

Now you can bind that item to something in your UI:

    <div data-ku-model="notifications">
        <ul data-bind="foreach: notifications">
            <li data-bind="text: content"></li>
        </ul>
    </div>

You can even tell that element to use an external view:

    <div data-ku-model="notifications" data-ku-view="notifications"></div>

That would automatically go and look for the view in `views/notifications.html` relative to the current URL, render it inside of the element and bind the specified model to it.

### Adding Your Own Attribute Bindings

All you need to do to add your own attribute bindings is to add a function to the `ku.bindings` object.

    ku.bindings['my-custom-attribute'] = function(element, value) {

    };

Your function is passed the `element` that the attribute was bound to and the attribute `value` that the attribute was set to. You could now use this binding by:

    <div data-ku-my-custom-attribute="my value"></div>

### Changing the `data-ku-` Attribute Prefix

If you need to, or feel like it, you can specify the prefix that you want to use for attribute bindings. All you need to do is change the `ku.prefix` property.

    ku.prefix = 'my-custom-prefix-';

Routing
-------

Application routing can range from simple to complex. A simple route only requires two arguments: the route name (which is also the URL to match) and the callable controller. A more complex route takes an options object instead of a controller that specifies different aspects of the route.

    router.set('user', {
        match: /^user\/([^\/]+)$/,
        format: 'user/:id',
        view: 'user/index',
        controller: function(id) {
            
        }
    });

#### Matching

The `match` option specifies a regular expression that the current request is matched against. The current request if using `hashchange` is anything after the `#`. If using browser state, then it is anything relative to the current page.

Parameters that are captured using parenthesis are passed in captured order to the controller function.

#### Formatting

The `format` paramter is a string that can be reverse engineered by the router given a parameters object.

    // user/1
    router.get('user').generate({ id: 1 });

#### Views

The `view` option specifies which view to render using the view instance that is bound to the router. By default, the view prefix is `views/` and the suffix is `.html`. So in the case of the example, it would render `views/user/index.html`. If you didn't specify a view option, this would defalut to the route name and render `views/user.html`.

#### Controllers

The controller is just a function that is executed that returns the model that should be applied to the view that will be rendered.

The parameters passed to the controller are the parameters that were matched in the `match` regex in the order they were captured.

Models and Collections
----------------------

The theory behind Knockup models is that every project, no matter what, can be represented by a set of business objects that may or may not have relationships with each other and that affect completely separate parts of the UI. Knockout, although great at what it set out to do, leaves you to your own devices when managing your objects.

Other frameworks who advertise modeling miss one key point: relationships. Maintainers have actually told me that they don't believe it to be an issue and in our opinion it's something that quite simply cannot be overlooked.

### Models

Take an example where a blog post may have many comments and everything must be observable (which is a common use case). In Knockout we might do the following:

    function fill(obj, props) {
        for (var i in props) {
            if (typeof obj[i] === 'function') {
                obj[i](props[i]);
            }
        }
    };

    var Blog = function(props) {
        this.title    = ko.observable('');
        this.content  = ko.observable('');
        this.comments = ko.observableArray([]);
        
        fill(this, props);
    };
    
    var Comment = function(props) {
        this.title   = ko.observable('');
        this.content = ko.observable('');
        
        fill(this, props);
    };

    var viewModel = {
        blog: ko.observable(new Blog({
            title: 'Blog Title',
            content: 'Blog content.',
            comments: [
                new Comment({
                    title: 'Comment 1',
                    content: 'Comemnt 1 content.'
                }),
                new Comment({
                    title: 'Comment 1',
                    content: 'Comemnt 1 content.'
                })
            ])
        }))
    };
    
    ko.applyBindings(viewModel);

This is the same example using Knockup:

    var Comment = ku.model({
        title: '',
        content: ''
    });

    var Blog = ku.model({
        title: '',
        content: '',
        comments: Comment.Collection
    });
    
    var App = ku.model({
        blog: Blog
    });
    
    var app = new App({
        blog: {
            title: 'Blog Title',
            content: 'Blog Content.',
            comments: [{
                title: 'Comment 1',
                content: 'Comment 1 content.'
            }, {
                title: 'Comment 2',
                content: 'Comment 2 content.'
            }]
        }
    });
    
    ko.applyBindings(app);

Models also allow you to do more than just manage relationships.

#### Specifying a Constructor

Since a constructor is generated, you are allowed to pass a method called `init` to the model definition. This method gets called after the model is set up and all data is imported that was passed to the constructor.

    var model = ku.mode({
        init: function() {
            // do some setup
        }
    });

#### Anything is Observable

Any scalar value passed in becomes observable.

    var User = ku.model({
        id: 0,
        username: '',
        password: ''
    });

#### Using Computed Observables

Computed observables are generated from functions prefixed with `read` or `write`.

    var Person = ku.model({
        forename: '',
        surname: '',
        readName: function() {
            return this.forename() + ' ' + this.surname();
        },
        writeName: function(name) {
            var names = name.split(' ');
            this.forename(names[0]);
            this.surname(names[1]);
        }
    });
    
    var bob = new Person({
        forename: 'Bob',
        surname: 'Bobberson'
    });
    
    // Bob Bobberson
    bob.name();
    bob.name('Marge Margaretson');
    
    // Marge
    bob.forename();

#### One-to-One Relationships

To specify a one-to-one relationship, all you need to do is pass a model constructor.

    var Address = ku.model({
        street: '',
        city: '',
        country: '',
        postcode: ''
    });

    var Person = ku.model({
        address: Address
    });
    
    var bob = new Person;

You can immeidately use the relationship:

    bob.address().street('100 Hastings Road');

Or you can fill it with something:

    bob.address({
        street: '100 Hastings Road'
    });

#### One-to-Many Relationships

To specify a one-to-many relationship, all you need to do is pass a collection constructor.

    var Address = ku.model({
        street: '',
        city: '',
        country: '',
        postcode: ''
    });

    var Person = ku.model({
        addresses: Address.Collection
    });

You can now manipulate that collection and the bound UI will change with each item in the collection just like a `ko.observableArray`.

#### Normal Functions

Any function that doesn't meet any special requirements is just that, an instance method.

    var Person = ku.model({
        save: function() {
            ku.get('http').put('user', this.export());
        }
    });

#### Importing Data

You can import data using the `import()` method:

    model.import(data);

Any existing data in the model that is *not* specified in the data object is *not* removed. Any data conflicts are overwritten by the passed in data.

#### Exporting Data

Inversely to importing, you can export data using the `export()` method:

    var raw = model.export();

This will export a raw object of data using each defined property, computed reader and recursive relationships.

#### Cloning

There will be times when you need to make changes to an object without affecting its original instance. This is where cloning is useful.

    var clone = model.clone();
    
    clone.property('different value');
    
    // false
    console.log(model.property() === clone.property());

#### Resetting Data

If you need to clear all data on a model just use the `reset()` method:

    model.reset();

#### Extending

You can extend models by using the `extend()` and `inherit()` static methods.

    var Person = ku.model({
        name: 'Bob Bobberson'
    });
    
    var User = Person.extend({
        username: '',
        password: ''
    });

Or you can inherit from another model:

    var Person = ku.model({
        name: 'Bob Bobberson'
    });

    var User = Person.extend({
        username: '',
        password: ''
    });
    
    User.inherit(Person);

#### Accessing Model Information

You can access information about the model if need be. The most used one would be the static `Collection` property. This is a collection constructor for that model.

    var Model      = ku.model();
    var collection = new Model.Collection;

Models also publicly record their definition information:

    var definition = Model.definition;

You can also statically access the model from an instance:

    var model = new Model;
    
    // true
    console.log(model.$self === Model);

### Collections

Collections are just a grouping of models. Each collection ensures that an item within it is an instance of the model that is representing and allows you to easily manipulate the items inside of it.

#### Importing and Exporting

Importing and exporting work just like with models, but you're just using an array of models - or another collection - instead.

#### Accessing Specific Items

All collections behave like an array, so you can access it with square brackets.

    bob.addresses()[0].street();

Methods:

    bob.addresses().first().street();
    bob.addresses().last().street();
    bob.addresses().at(0).street();

#### Finding Items

Item location can be done in many ways. You can simply check if it exists at a given index:

    bob.addresses().has(0);

You can find an item using an object as a query:
    
    var query = { street: '100 Hastings Road' };
    
    if (address = bob.addresses().findOne(query)) {
        console.log(address.street());
    }

Or a query function:

    var limit = 10;
    var page  = 2;
    var query = function(address) {
        return address.street().match(/Road$/);
    };
    
    bob.addresses().find(query, limit, page).each(function(i, address) {
        console.log(address.street());
    }); 

When using `find`, it returns a new collection of items that contain references to the original models. So any modifications made to the return collection if found items will change the originals.

#### Finding the Index of an Item

Sometimes you know a model exists in a collection, but don't know at which index.

    bob.addresses().index(address);

If the same model instance is found, it returns the index at which it exists in the collection.

#### Adding Items

There are many different ways to add items to a collection apart from using `import()`.

    bob.addresses().prepend({ street: '99 Hastings Road' });
    bob.addresses().append({ street: '101 Hastings Road' });
    bob.addresses().insert(1, { street: '100 Hastings Road' });

#### Removing Items

To remove an item, you either need the item's index, or the actual model instance.

    bob.addresses().remove(0);
    bob.addresses().remove(address);

#### Iteration

To iterate over a collection of items you can use the `each()` method.

    bob.addresses().each(callback);

#### Field Aggregation

Sometimes you may need an array of field values from all items in a collection. To do this you can use the `aggregate()` method and specify the field name you want to get the values for.

    // [ '100 Hastings Road', '101 Hastings Road' ]
    bob.addresses().aggregate('street');

For more advanced behavior, you can specify a string to join multiple values with.

    // [ '100 Hastings Road, Middle of Nowhere', '101 Hastings Road, Middle of Nowhere ]
    bob.addresses().aggregate(', ', [ 'street', 'city' ]);

License
-------

Copyright (c) 2012 Trey Shugart

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.