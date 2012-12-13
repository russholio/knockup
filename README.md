Knockup - MVC for Knockout
==========================

Knockup builds on Knockout to give you a complete MVC solution for building RESTful JavaScript web applications. Its only dependency is Knockout, but is compatible with any CommonJS AMD library. There's no silly "Starter Kit", or chain of depenencies that you need to install. Just make sure you've got Knockout and Knockup, and you're ready to start coding.

Features include:

- Full MVC separation.
- Full AMD / CommonJS support.
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

### Main Content Area

The first part is using a main content area. The main view area is bound to a router and affected by changes in the URL. Controllers are automatically called, and views are rendered and bound as the content to the main content area. It is not required to have a main content area but it is something most web-based applications will make ample use of.

To give the UI something to bind itself to, we must first set up our router:

    var router = new ku.Router;
    
    router.set('my/url', MyController);
    
    ku.set('my-router', router);

Now we have something we can bind the UI to:

    <div data-ku-main="my-router"></div>

All we have to do to make everything work is:

    ku.run();

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

You can even tell that component to use an external view:

    <div data-ku-model="notifications" data-ku-view="notifications"></div>

That would automatically go and look for the view in `views/notifications.html` relative to the current URL render it inside of the component and bind the specified model to it.

Models and Collections
----------------------

The theory behind Knockup models is that every project, no matter what, can be represented by a set of business objects that may or may not have relationships with each other and that affect completely separate parts of the UI. Knockout, although great at what it set out to do, leaves you to your own devices when managing your objects.

Other frameworks who advertise modeling miss one key point: relationships. Maintainers have actually told me that they don't believe it to be an issue and in our opinion it's something that quite simply cannot be overlooked.

### Conventions

Knockup makes a few design choices for you to keep things as simple as possible:

1. You define your model by passing an object, or definition, to the `ku.model` function and it returns a constructor.
2. Any property passed in becomes a Knockout observable and its value is used as the default. These properties are used exactly as you would normally use a Knockout observable.
3. If you pass a model constructor as a default property value, that property will always contain an instance of that model.
4. If you pass a collection constructor as a default property value, that property will always contain a collection of its corresponding models.
5. Functions prefixed with `read` become a computed observable reader.
6. Functions prefixed with `write` become a computer observable writer.
7. Computed observable owners are set to the model that they are defined in allowing you to access the currrent model using `this`.
8. All other functions are simply instance methods.

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

Collections are just a grouping of models. Each collection ensures that an item within it is an instance of the model that is representing.

License
-------

Copyright (c) 2012 Trey Shugart

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.