"use strict"

require("coffee-script/register")
#[^] last version of coffee

module.exports = (grunt) ->
  #-------
  #Plugins
  #-------
  require("load-grunt-tasks") grunt

  #-----
  #Tasks
  #-----
  grunt.registerTask "default", "build"
  grunt.registerTask "test", "mochaTest"
  grunt.registerTask "build", ["clean:build", "coffee", "clean:specs", "copy"]
  # grunt bump: increase version, commit, create tag

  #------
  #Config
  #------
  grunt.initConfig
    # Clean build directory
    clean:
      build: src: "build"
      specs: src: "build/*.spec.js"

    # Compile coffee
    coffee:
      compile:
        expand: true
        cwd: "#{__dirname}/src"
        src: ["**/{,*/}*.coffee"]
        dest: "build/"
        rename: (dest, src) ->
          dest + "/" + src.replace(/\.coffee$/, ".js")

    # Copy non-coffee files to the build directory
    copy:
      main:
        files: [
          expand: true
          cwd: "#{__dirname}/src"
          src: ["**", "!*.coffee"]
          dest: "build"
        ]

    # Run tests
    mochaTest:
      options:
        reporter: "spec"
      src: ["src/**/*.spec.coffee"]

    # Upgrade the version of the package
    bump:
      options:
        files: ["package.json"]
        commit: true
        commitMessage: "Release v%VERSION%"
        commitFiles: ["-a"]
        createTag: true
        tagName: "%VERSION%"
        tagMessage: "Version %VERSION%"
        push: false
