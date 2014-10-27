/*global module:false*/
module.exports = function(grunt) {
  var fs = require("fs"),
      config,
      python = "../venv/bin/python",
      pip = "venv/bin/pip",
      sphinx = "venv/bin/sphinx-build",
      pep8 = "venv/bin/pep8",
      version = grunt.file.readJSON("package.json").version;

  // Project configuration.
  grunt.initConfig({
    // Task configuration.
    prompt: {
        configure: {
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
    version: {
        src: [
            "tangelo/tangelo/__main__.py",
            "tangelo/setup.py"
        ]
    },
    copy: {
        readme: {
            src: "README.rst",
            dest: "tangelo/README"
        }
    },
    test_run: {
        files: {
            src: ["tests/*.py"]
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
  grunt.loadNpmTasks("grunt-continue");
  grunt.loadNpmTasks("grunt-prompt");
  grunt.loadNpmTasks("grunt-version");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Read configuration from disk.
  grunt.registerTask("readconfig", "Read configuration options from disk", function () {
      var text;

      try {
          text = fs.readFileSync("configuration.json");
          config = JSON.parse(text);
      } catch (e) {
          grunt.task.run("configure");
          grunt.task.run("readconfig");
          return;
      }
  });

  // Configuration task.
  grunt.registerTask("configure", "Write configuration options to disk", function () {
    var text;

    // If there is no config file already, then schedule the appropriate prompt
    // task, followed by a retry of the current task, then bail.
    if (!grunt.config("virtualenv")) {
        grunt.task.run("prompt:configure");
        grunt.task.run("configure");
        return;
    }

    // Build a configuration object from the config values.
    text = JSON.stringify({
        virtualenv: grunt.config("virtualenv"),
        python: grunt.config("python")
    }, null, 4) + "\n";

    // Serialize to disk.
    try {
        fs.writeFileSync("configuration.json", text);
    } catch (e) {
        grunt.fail.warn("Could not write configuration.json" + e);
    }
  });

  // Virtualenv installation task.
  grunt.registerTask("virtualenv", "Create a virtual python environment", function () {
      var done;

      if (!config) {
          grunt.fail.warn("Task depends on 'readconfig' task");
      }

      try {
          fs.statSync("venv");
          console.log("Virtual environment already exists");
          return;
      } catch (e) {
          done = this.async();

          grunt.util.spawn({
              cmd: config.virtualenv,
              args: ["venv"],
              opts: {
                  stdio: "inherit"
              }
          }, function (error, result, code) {
              if (error) {
                  grunt.fail.warn("Could not initialize virtualenv:\n" + result.stderr);
              }

              done();
          });
      }
  });

  // Python dependencies installation step.
  grunt.registerTask("pydeps", "Install Python build dependencies", function () {
      var done;

      grunt.task.requires("virtualenv");

      done = this.async();

      grunt.util.spawn({
          cmd: pip,
          args: ["install", "-r", "requirements.txt"],
          opts: {
              stdio: "inherit"
          }
      }, function (error, result, code) {
          if (error) {
              grunt.fail.warn("Could not install Python modules:\n" + result.stderr);
          }

          done();
      });
  });

  // Build the Python package.
  grunt.registerTask("tangelo:package", "Build Tangelo package distribution", function () {
      var done;

      done = this.async();

      grunt.util.spawn({
          cmd: python,
          args: ["setup.py", "sdist", "--dist-dir", "../sdist"],
          opts: {
              stdio: "inherit",
              cwd: "tangelo"
          }
      }, function (error, result, code) {
          if (error) {
              grunt.fail.warn("Could not build Tangelo package:\n" + result.stderr);
          }

          done();
      });
  });

  // Install the Python package to the virtual environment.
  grunt.registerTask("tangelo:venv", "Install Tangelo to the virtual environment", function () {
      var done;

      done = this.async();

      grunt.util.spawn({
          cmd: pip,
          args: ["install", "--upgrade", "sdist/tangelo-" + version + ".tar.gz"],
          opts: {
              stdio: "inherit"
          }
      }, function (error, result, code) {
          if (error) {
              grunt.fail.warn("Could not install Tangelo to virtual environment:\n" + result.stderr);
          }

          done();
      });
  });

  // Run nose tests.
  grunt.registerTask("test", ["continueOn", "test_run", "continueOff"]);

  grunt.registerMultiTask("test_run", "Run nose for each test", function () {
      this.filesSrc.forEach(function (file) {
          grunt.task.run("nose:" + file);
      });
  });

  grunt.registerTask("nose", "Run Tangelo tests with nose", function (file) {
      var done = this.async();

      grunt.util.spawn({
          cmd: "venv/bin/nosetests",
          args: [file],
          opts: {
              stdio: "inherit"
          }
      }, function (error, result, code) {
          done(code === 0);
      });
  });

  // Default task.
  grunt.registerTask('default', ['version',
                                 'readconfig',
                                 'virtualenv',
                                 'pydeps',
                                 'tangelo:package',
                                 'tangelo:venv']);

};
