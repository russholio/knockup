Knockup - ORM for Knockout
==========================

Knockup gives you a simple API for managing and relating JavaScript objects and handing them off to Knockout to use.

Overview
--------

Knockup does not change anything about how you compose your views, just how you compose your models, so it can be a drop in solution:

    // define your person model
    var person = ku.model({
        forename: '',
        surname: '',
        selected: false,
        getName: function() {
            return this.forename() + ' ' + this.surname();
        },
        setName: function(name) {
            var names = name.split(' ');
            this.forename(names[0]);
            this.surname(names[1]);
        },
        toggle: function() {
            this.selected(!this.selected());
        }
    });

    // define the app model
    var app = ku.model({
        people: person.collection,
        getPerson: function() {
            return this.people().findOne({ selected: true });
        }
    });
    
    // bind to the view
    app.knockup();
    
    // add a people to the list
    app.people([
        { name: 'John Doe' },
        { name: 'Jane Doe' }
    ]);
    
    // select John
    app.at(0).toggle();

Your view may looks something like:

    <div data-bind="text: person().forename"></div>
    <ul data-bind="foreach: people">
        <li><a href="#" data-bind="click: toggle, text: name"></a></li>
    </ul>

Conventions
-----------

Knockup makes a few design choices for you, but keeps things as simple as possible:

1. You define your model by passing an object to the `ku.model` function and it returns a constructor for that model.
2. Any property passed in becomes observable and its value is used as the default.
3. Functions prefixed with `get` or `set` become computed observables. All other functions are just normal instance methods.
4. If you pass in a model, that property will always contain an instance of that model.
5. If you pass in a model collection, that property will always contain a collection of its corresponding models.

In order to apply your aggregate root (for you DDD peeps) to the view, you can either:

    app.knockup()
    
Or do it the old fasioned way:

    ko.applyBindings(app);

Whichever is easier for you.

License
-------

Copyright (c) 2012 Trey Shugart

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.