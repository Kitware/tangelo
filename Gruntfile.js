/*global module:false*/
module.exports = function(grunt) {
  var fs = require("fs"),
      path = require("path"),
      config,
      python = path.resolve("venv/bin/python"),
      pip = path.resolve("venv/bin/pip"),
      sphinx = path.resolve("venv/bin/sphinx-build"),
      pep8 = path.resolve("venv/bin/pep8"),
      nosetests = path.resolve("venv/bin/nosetests"),
      tangelo = path.resolve("venv/bin/tangelo"),
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
    pep8: {
        files: {
            src: [
                "tangelo/setup.py",
                "tangelo/setupahhhh.py",
                "tangelo/scripts/tangelo",
                "tangelo/scripts/tangelo-passwd",
                "tangelo/scripts/vtkweb-launcher",
                "tangelo/tangelo/__init__.py",
                "tangelo/tangelo/__main__.py",
                "tangelo/tangelo/girder.py",
                "tangelo/tangelo/info.py",
                "tangelo/tangelo/server.py",
                "tangelo/tangelo/stream.py",
                "tangelo/tangelo/tool.py",
                "tangelo/tangelo/util.py",
                "tangelo/tangelo/vtkweb.py",
                "tangelo/tangelo/websocket.py",
                "tangelo/www/service/celery.py",
                "tangelo/www/service/config.py",
                "tangelo/www/service/impala-json.py",
                "tangelo/www/service/mongo.py",
                "tangelo/www/service/svg2pdf.py"
            ]
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

  grunt.registerMultiTask("pep8", "Style check Python sources", function () {
      var done = this.async();

      grunt.util.spawn({
          cmd: pep8,
          args: ["--ignore=E501"].concat(this.filesSrc),
          opts: {
              stdio: "inherit"
          }
      }, function (error, result, code) {
          done(code === 0);
      });
  });

  // Build the Python package.
  grunt.registerTask("package", "Build Tangelo package distribution", function () {
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
  grunt.registerTask("install", "Install Tangelo to the virtual environment", function () {
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
          cmd: nosetests,
          args: [file],
          opts: {
              stdio: "inherit"
          }
      }, function (error, result, code) {
          done(code === 0);
      });
  });

  // Build documentation with Sphinx.
  grunt.registerTask("docs", "Build Tangelo documentation with Sphinx", function () {
      var done = this.async();

      grunt.util.spawn({
          cmd: sphinx,
          args: ["-b", "html",
                 "-D", "version=" + version,
                 "-D", "release=" + version,
                 "docs",
                 "tangelo/www/docs"],
          opts: {
              stdio: "inherit"
          }
      }, function (error, result, code) {
          if (error) {
              grunt.fail.warn("Could not build documentation:\n" + result.stderr);
          }

          done(code === 0);
      });
  });

  // Serve Tangelo.
  grunt.registerTask("serve", "Serve Tangelo on a given port (8080 by default)", function (host, port) {
      var done = this.async();

      if (host === undefined && port === undefined) {
          host = "localhost";
          port = "8080";
      } else if (port === undefined) {
          port = host;
          host = "localhost";
      }

      grunt.util.spawn({
          cmd: tangelo,
          args: ["--hostname", host,
                 "--port", port,
                 "--root", "venv/share/tangelo/www"],
          opts: {
              stdio: "inherit"
          }
      }, function () {
          done();
      });
  });

  // Default task.
  grunt.registerTask('default', ['version',
                                 'readconfig',
                                 'virtualenv',
                                 'pydeps',
                                 'pep8',
                                 'docs',
                                 'package',
                                 'install']);

};
