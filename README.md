Knockup - MVC for Knockout
==========================

Knockup builds on Knockout to give you a complete MVC solution for building RESTful JavaScript web applications. Its only dependency is Knockout, but is compatible with any CommonJS AMD library. There's no silly "Starter Kit", or chain of depenencies that you need to install. Just make sure you've got Knockout and Knockup, and you're ready to start coding.

Conventions
-----------

Knockup makes a few design choices for you to keep things as simple as possible:

1. You define your model by passing an object to the `ku.model` function and it returns a constructor for that model.
2. Any property passed in becomes observable and its value is used as the default.
3. Functions prefixed with `read` or `write` become computed observables. All other functions are just normal instance methods.
4. If you pass in a model, that property will always contain an instance of that model.
5. If you pass in a model collection, that property will always contain a collection of its corresponding models.

License
-------

Copyright (c) 2012 Trey Shugart

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.