module.exports = function(grunt) {
    var fs = require('fs');

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.initConfig({
        concat: {
            dist: {
                src: 'src/ku/*.js',
                dest: 'dist/knockup.js'
            }
        },
        connect: {
            server: {
                options: {
                    port: 8000,
                    base: '.'
                }
            }
        },
        jshint: {
            files: [
                'src/ku/*.js',
                'tests/*.js'
            ]
        },
        meta: {
            banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */'
        },
        pkg: grunt.file.readJSON('package.json'),
        qunit: {
            all: {
                options: {
                    urls: [
                        'http://localhost:8000/tests/index.html'
                    ]
                }
            }
        },
        uglify: {
            dist: {
                'dist/knockup.min.js': [
                    'dist/knockup.js'
                ]
            }
        },
        wrap: {
            dest: {
                file: 'dist/knockup.js',
                wrapper: 'src/wrapper.js'
            }
        }
    });

    grunt.registerTask('test', 'Lint and run unit tests.', ['jshint', 'connect', 'qunit']);
    grunt.registerTask('travis', 'TravisCI command for running tests.', ['test']);
    grunt.registerTask('build', 'Concatenate, minify, lint and run unit tests.', ['concat', 'wrap', 'uglify', 'test']);

    grunt.registerMultiTask('wrap', 'Wraps the "file" with "wrapper" using the "placeholder".', function() {
        var wrapper     = fs.readFileSync('./' + this.data.wrapper, 'UTF-8') || this.data.wrapper,
            placeholder = this.data.placeholder || '{content}',
            content     = wrapper.replace(placeholder, fs.readFileSync('./' + this.data.file, 'UTF-8'));
        
        fs.writeFileSync(this.data.file, content);
    });
};