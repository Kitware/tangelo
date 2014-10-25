/*global module:false*/
var fs = require("fs");

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Task configuration.
    prompt: {
        virtualenv: {
            options: {
                questions: [
                    {
                        config: "virtualenv",
                        type: "input",
                        message: "Path to virtualenv?",
                        default: "/usr/bin/virtualenv"
                    }
                ]
            }
        }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib_test: {
        files: '<%= jshint.lib_test.src %>',
        tasks: ['jshint:lib_test', 'nodeunit']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks("grunt-prompt");
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Configuration task.
  grunt.registerTask("configure", "Write configuration options to disk", function () {
    var text;

    // If there is no config file already, then schedule the approprriate prompt
    // task, followed by a retry of the current task, then bail.
    if (!grunt.config("virtualenv")) {
        grunt.task.run("prompt:virtualenv");
        grunt.task.run("configure");
        return;
    }

    // Build a configuration object from the config values.
    text = JSON.stringify({
        virtualenv: grunt.config("virtualenv")
    }, null, 4) + "\n";

    // Serialize to disk.
    try {
        fs.writeFileSync("configuration.json", text);
    } catch (e) {
        grunt.fail.warn("Could not write configuration.json" + e);
    }
  });

  // Default task.
  grunt.registerTask('default', ['jshint', 'nodeunit']);

};
