/*global module:false*/
/*jshint node:true*/
module.exports = function (grunt) {
    "use strict";

    var fs = require("fs"),
        path = require("path"),
        config,
        python = path.resolve("venv/bin/python"),
        pip = path.resolve("venv/bin/pip"),
        sphinx = path.resolve("venv/bin/sphinx-build"),
        pep8 = path.resolve("venv/bin/pep8"),
        nosetests = path.resolve("venv/bin/nosetests"),
        coverage = path.resolve("venv/bin/coverage"),
        tangelo = path.resolve("venv/bin/tangelo"),
        tangelo_dir = path.resolve("venv/lib/python2.7/site-packages/tangelo"),
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
              "tangelo/setup.py",
              "js/src/core/core.js"
          ]
      },
      concat: {
          options: {
              banner: "<%= banner %>",
              stripBanners: true
          },
          dist: {
              src: ["js/src/**/*.js"],
              dest: "tangelo/www/js/tangelo.js"
          }
      },
      uglify: {
          options: {
              banner: "<%= banner %>"
          },
          dist: {
              src: "<%= concat.dist.dest %>",
              dest: "tangelo/www/js/tangelo.min.js"
          }
      },
      jshint: {
          options: {
              // Enforcing options (for strict checking, should be true by
              // default; set to false indicates departure from this policy).
              bitwise: true,
              camelcase: true,
              curly: true,
              eqeqeq: true,
              forin: true,
              immed: true,
              latedef: true,
              newcap: true,
              noempty: false,
              nonbsp: true,
              nonew: true,
              plusplus: false,
              quotmark: "double",
              undef: true,
              unused: true,
              strict: true,
              maxparams: false,
              maxdepth: false,
              maxstatements: false,
              maxcomplexity: false,
              maxlen: false,

              // Relaxing options (for strict checking, should be false by
              // default; set to true indicates departure from this policy).
              eqnull: true,

              // Environment options.
              browser: true,

              // Globals.
              globals: {
                  console: false
              }
          },
          gruntfile: {
              options: {
                  // Disable camelcase enforcement.
                  "-W106": true
              },
              src: "Gruntfile.js"
          },
          tangelo: {
              src: ["js/src/**/*.js"]
          },
          test: {
              options: {
                  globals: {
                      QUnit: false,
                      tangelo: false
                  }
              },
              src: ["js/tests/*.js"]
          }
      },
      jscs: {
          options: {
              requireCurlyBraces: true,
              requireSpaceAfterKeywords: true,
              requireSpaceBeforeBlockStatements: true,
              requireParenthesesAroundIIFE: true,
              requireSpacesInConditionalExpression: true,
              requireSpacesInAnonymousFunctionExpression: {
                  beforeOpeningRoundBrace: true,
                  beforeOpeningCurlyBrace: true
              },
              requireSpacesInNamedFunctionExpression: {
                  beforeOpeningCurlyBrace: true
              },
              requireSpacesInFunctionDeclaration: {
                  beforeOpeningCurlyBrace: true
              },
              requireMultipleVarDecl: true,
              requireBlocksOnNewline: true,
              disallowPaddingNewlinesInBlocks: true,
              disallowEmptyBlocks: true,
              disallowQuotedKeysInObjects: true,
              disallowSpaceAfterObjectKeys: true,
              requireSpaceBeforeObjectValues: true,
              requireCommaBeforeLineBreak: true,
              requireOperatorBeforeLineBreak: true,
              disallowSpaceAfterPrefixUnaryOperators: true,
              disallowSpaceBeforePostfixUnaryOperators: true,
              disallowImplicitTypeConversion: ["numeric", "boolean", "binary", "string"],
              disallowMultipleLineStrings: true,
              disallowMultipleLineBreaks: true,
              disallowMixedSpacesAndTabs: true,
              disallowTrailingWhitespace: true,
              disallowTrailingComma: true,
              disallowKeywordsOnNewLine: ["else if", "else"],
              requireLineFeedAtFileEnd: true,
              requireCapitalizedConstructors: true,
              requireDotNotation: true,
              requireSpaceAfterLineComment: true,
              disallowNewlineBeforeBlockStatements: true,
              validateLineBreaks: "LF",
              validateIndentation: 4,
              validateParameterSeparator: ", ",
              safeContextKeyword: ["that"]
          },
          gruntfile: {
              src: ["Gruntfile.js"]
          },
          tangelo: {
              src: ["js/src/**/*.js"]
          },
          test: {
              src: ["js/tests/*.js"]
          }
      },
      copy: {
          readme: {
              src: "README.rst",
              dest: "tangelo/README"
          },
          jstest: {
              expand: true,
              flatten: true,
              src: [
                  "js/tests/lib/blanket.js",
                  "node_modules/grunt-blanket-qunit/reporter/grunt-reporter.js",
                  "js/tests/*.js",
                  "tangelo/www/js/tangelo.js",
                  "tangelo/www/js/tangelo.min.js"
              ],
              dest: "jstest/"
          }
      },
      jade: {
          jstest: {
              files: {
                  "jstest/tests.html": "js/tests/jade/qunitHarness.jade"
              },
              options: {
                  client: false,
                  data: function () {
                      return {
                          scripts: grunt.file.expand("js/tests/*.js").map(function (s) {
                              var path = s.split("/");
                              return path[path.length - 1];
                          })
                      };
                  }
              }
          }
      },
      /*jshint camelcase: false */
      blanket_qunit: {
      /*jshint camelcase: true */
          all: {
              options: {
                  urls: ["http://localhost:50047/jstest/tests.html?coverage=true"],
                  threshold: 20
              }
          }
      },
      nose_coverage: {
          main: {
              src: ["tests/*.py"]
          }
      },
      coverage_report: {
          options: {
              threshold: 20,
              html_dir: "jstest/nose_coverage"
          },
          main: {}
      },
      pep8: {
          files: {
              src: [
                  "tangelo/**/*.py",
                  "!tangelo/tangelo/minify_json.py"
              ]
          }
      },
      cleanup: {
          node: ["node_modules"],
          venv: ["venv"],
          config: ["configuration.json"],
          sdist: ["sdist"],
          jstest: ["jstest"],
          package: [
              "tangelo/MANIFEST",
              "tangelo/README",
              "tangelo/www/docs",
              "tangelo/www/js"
          ]
      }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks("grunt-continue");
    grunt.loadNpmTasks("grunt-prompt");
    grunt.loadNpmTasks("grunt-version");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-jscs");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-jade");
    grunt.loadNpmTasks("grunt-blanket-qunit");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-clean");

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

                done(code === 0);
            });
        }
    });

    // Python dependencies installation step.
    grunt.registerTask("pydeps", "Install Python build dependencies", function () {
        var done,
            packages;

        grunt.task.requires("virtualenv");

        done = this.async();

        packages = [
            "Sphinx==1.2.3",
            "pep8==1.5.7",
            "requests==2.4.3",
            "nose==1.3.4",
            "coverage==3.7.1"
        ];

        grunt.util.spawn({
            cmd: pip,
            args: ["install"].concat(packages),
            opts: {
                stdio: "inherit"
            }
        }, function (error, result, code) {
            if (error) {
                grunt.fail.warn("Could not install Python modules:\n" + result.stderr);
            }

            done(code === 0);
        });
    });

    grunt.registerMultiTask("pep8", "Style check Python sources", function () {
        var done = this.async();

        grunt.util.spawn({
            cmd: pep8,
            args: ["--ignore=E501,E265"].concat(this.filesSrc),
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

            done(code === 0);
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

            done(code === 0);
        });
    });

    // Run nose tests.
    grunt.registerTask("test:server", [
        "coverage:erase",
        "nose_coverage",
        "coverage:combine",
        "coverage_report"
    ]);

    grunt.registerMultiTask("nose_coverage", "Run server tests with coverage", function () {
        var done = this.async();

        grunt.util.spawn({
            cmd: coverage,
            args: ["run", "-a", "--source", tangelo_dir,
                   nosetests, "--verbose", "--tests=" + this.filesSrc.join(",")],
            opts: {
                stdio: "inherit"
            }
        }, function (error, result, code) {
            done(code === 0);
        });
    });

    grunt.registerTask("coverage", "Manipulate coverage results", function (action) {
        var done;

        switch (action) {
            case "erase":
            case "combine": {
                done = this.async();
                grunt.util.spawn({
                    cmd: coverage,
                    args: [action],
                    opts: {
                        stdio: "inherit"
                    }
                }, function (error, result, code) {
                    done(code === 0);
                });
                break;
            }

            default: {
                grunt.fail("illegal action '" + action + "'");
            }
        }
    });

    grunt.registerMultiTask("coverage_report", "Report coverage results", function () {
        var done = this.async(),
            options,
            do_report,
            files;

        options = this.options({
            threshold: 100
        });

        do_report = function (html_code) {
            grunt.util.spawn({
                cmd: coverage,
                args: ["report", "--fail-under", options.threshold],
                opts: {
                    stdio: "inherit"
                }
            }, function (error, result, code) {
                if (html_code !== 0) {
                    grunt.warn("HTML generation failed");
                }

                if (code === 2) {
                    grunt.warn("Required coverage level of " + options.threshold + "% not met!");
                }

                done(code === 0);
            });
        };

        if (options.html_dir) {
            if (fs.existsSync(options.html_dir)) {
                files = fs.readdirSync(options.html_dir);
                files.forEach(function (f) {
                    fs.unlinkSync(path.join(options.html_dir, f));
                });
                fs.rmdirSync(options.html_dir);
            }
            grunt.util.spawn({
                cmd: coverage,
                args: ["html", "-d", options.html_dir],
                opts: {
                    stdio: "inherit"
                }
            }, function (error, result, code) {
                do_report(code);
            });
        } else {
            do_report(0);
        }
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

    grunt.registerTask("serve:test", "Serve Tangelo in testing mode", function () {
        var done = this.async();

        grunt.util.spawn({
            cmd: tangelo,
            args: ["--hostname", "localhost",
                   "--port", "50047",
                   "--root", "."],
            opts: {
                stdio: "inherit"
            }
        }, function () {
            done();
        });
    });

    // Build tangelo.js.
    grunt.registerTask("js", "Build tangelo.js and tangelo.min.js", ["version", "concat", "uglify"]);

    // Tangelo launch/kill task.
    (function () {
        var process = null,
            stopping,
            output = [];

        grunt.registerTask("tangelo", "Starts/stops a Tangelo server instance.", function (op) {
            var done,
                cmdline,
                fragment = null;

            if (op === "start") {
                if (process) {
                    grunt.fail.warn("Tangelo is running already.");
                }

                stopping = false;

                done = this.async();

                cmdline = {
                    cmd: tangelo,
                    args: [
                        "--port", "50047",
                        "--root", "."
                    ]
                };

                console.log("Starting Tangelo server with: " + cmdline.cmd + " " + cmdline.args.join(" "));
                process = grunt.util.spawn(cmdline, function () {});
                if (!process) {
                    grunt.fail.fatal("Could not launch Tangelo");
                }

                process.stderr.setEncoding("utf8");

                process.stderr.on("data", function (chunk) {
                    var complete = chunk.slice(-1) === "\n",
                        lines,
                        i,
                        n;

                    if (fragment) {
                        chunk = fragment + chunk;
                        fragment = null;
                    }

                    lines = chunk.split("\n");
                    n = complete ? lines.length : lines.length - 1;
                    for (i = 0; i < n; i++) {
                        if (!stopping && lines[i].indexOf("ENGINE Bus STARTED") !== -1) {
                            console.log("Tangelo started with PID " + process.pid);
                            done();
                        }

                        output.push(lines[i]);
                    }

                    if (!complete) {
                        fragment = lines[lines.length - 1];
                    }
                });

                process.stderr.on("end", function () {
                    if (stopping) {
                        return;
                    }
                    grunt.fail.fatal("Tangelo could not be started\n" + output.join("\n"));
                });
            } else if (op === "stop") {
                if (!process) {
                    grunt.fail.warn("Tangelo is not running");
                }

                stopping = true;
                done = this.async();

                process.kill();

                process.stderr.on("end", function () {
                    done();
                });

                setTimeout(function () {
                    grunt.fail.warn("Could not kill Tangelo\n" + output.join("\n"));
                }, 10000);
            } else {
                grunt.fail.warn("Unknown argument: '" + op + "'");
            }
        });
    }());

    grunt.registerTask("test:client", [
        "jade:jstest",
        "copy:jstest",
        "tangelo:start",
        "continueOn",
        "blanket_qunit",
        "continueOff",
        "tangelo:stop"
    ]);

    grunt.registerTask("test", ["test:server", "test:client"]);

    // Clean task.
    grunt.renameTask("clean", "cleanup");
    grunt.registerTask("clean:sdist", "cleanup:sdist");
    grunt.registerTask("clean:jstest", "cleanup:jstest");
    grunt.registerTask("clean:package", "cleanup:package");
    grunt.registerTask("clean:config", "cleanup:config");
    grunt.registerTask("clean:node", "cleanup:node");
    grunt.registerTask("clean:venv", "cleanup:venv");
    grunt.registerTask("clean", ["clean:sdist",
                                 "clean:jstest",
                                 "clean:package"]);
    grunt.registerTask("clean:all", ["clean",
                                     "clean:config",
                                     "clean:node",
                                     "clean:venv"]);

    // Default task.
    grunt.registerTask("default", ["version",
                                   "readconfig",
                                   "virtualenv",
                                   "pydeps",
                                   "pep8",
                                   "docs",
                                   "jshint",
                                   "jscs",
                                   "js",
                                   "copy:readme",
                                   "package",
                                   "install"]);
};
