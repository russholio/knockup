!function(factory) {
    if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
        factory(require('knockout'), module['exports'] || exports);
    } else if (typeof define === 'function' && define.amd) {
        define(['knockout', 'exports'], factory);
    } else {
        factory(ko, window.ku = {});
    }
}(function(ko, ku) {
    
if (typeof ko === 'undefined') {
    throw 'KnockoutJS is required. Download at https://github.com/SteveSanderson/knockout.';
}

{content}

});