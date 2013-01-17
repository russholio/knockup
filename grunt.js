module.exports = function(grunt) {
    var fs = require('fs');

    grunt.initConfig({
        concat: {
            dist: {
                src: 'src/ku/*.js',
                dest: 'dist/knockup.js'
            },
            min: {
                src: 'dist/knockup.js',
                dest: 'dist/knockup.min.js'
            }
        },
        lint: {
            files: [
                'src/*.js',
                'tests/*.js'
            ]
        },
        meta: {
            banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */'
        },
        pkg: '<json:package.json>',
        qunit: {
            index: ['http://localhost:8000/tests/index.html']
        },
        server: {
            port: 8000,
            base: '.'
        },
        wrap: {
            dest: {
                file: 'dist/knockup.js',
                wrapper: 'src/wrapper.js'
            }
        }
    });

    grunt.registerTask('travis', 'lint server qunit');
    grunt.registerTask('pre-commit', 'concat wrap min travis');
    grunt.registerTask('test', 'pre-commit');

    grunt.registerMultiTask('wrap', 'Wraps the "file" with "wrapper" using the "placeholder".', function() {
        var file        = fs.readFileSync('./' + this.data.file, 'UTF-8'),
            wrapper     = fs.readFileSync('./' + this.data.wrapper, 'UTF-8') || this.data.wrapper,
            placeholder = this.data.placeholder || '{content}',
            content     = wrapper.replace(placeholder, file);
        
        fs.writeFileSync(file, content);
    });
};