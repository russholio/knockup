module.exports = function(grunt) {
    grunt.initConfig({
        lint: {
            files: [
                'src/*.js',
                'tests/*.js'
            ]
        },
        qunit: {
            index: ['http://localhost:8000/tests/index.html']
        },
        server: {
            port: 8000,
            base: '.'
        }
    });

    grunt.registerTask('travis', 'server qunit');
};