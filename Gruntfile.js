module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                devel: true,
                node: true,
                '-W030': true,//Expected an assignment or function call and instead saw an expression.
                '-W097': true,//Use the function form of "use strict".
                'newcap': false,//Missing 'new' prefix when invoking a constructor.
                globals: {}
            },
            all: ['libs/**/*.js', 'tests/**/*.js']
        },
        mochaTest: {
            all: ['tests/**/*test.js']
        }
    });
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.registerTask('default', ['jshint']);
    grunt.registerTask('test', ['jshint', 'mochaTest']);
};
