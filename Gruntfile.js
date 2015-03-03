/*global module:false */
/*jshint node:true */
/*jshint camelcase:false */
module.exports = function (grunt) {
    "use strict";

    var fs = require("fs"),
        path = require("path"),
        windows = /^win/.test(process.platform),
        bin = windows ? "venv/Scripts/" : "venv/bin/",
        lib = windows ? "venv/Lib/" : "venv/lib/",
        zipExt = windows ? ".zip" : ".tar.gz",
        config,
        python = path.resolve(bin + "python"),
        pip = path.resolve(bin + "pip"),
        sphinx = path.resolve(bin + "sphinx-build"),
        flake8 = path.resolve(bin + "flake8"),
        nosetests = path.resolve(bin + "nosetests"),
        coverage = path.resolve(bin + "coverage"),
        tangelo_script = path.resolve(bin + "tangelo"),
        tangelo_dir = path.resolve(lib + (windows ? "" : "python-2.7/" + "site-packages/tangelo")),
        version = grunt.file.readJSON("package.json").version,
        tangeloCmdLine,
        pkgDataDir = "tangelo/tangelo/pkgdata/",
        pluginDir = pkgDataDir + "plugin/",
        webDir = pkgDataDir + "web/",
        styleCheckFiles;

    tangeloCmdLine = function (hostname, port, root, cover) {
        var cmd,
            args,
            sourceDirs;

        if (cover) {
            sourceDirs = [
                "bokeh/python",
                "config/web",
                "girder",
                "impala/web",
                "mongo/web",
                "stream/web",
                "tangelo/web",
                "vtkweb",
                "vtkweb/web"
            ].map(function (p) {
                return "venv/lib/python2.7/site-packages/tangelo/pkgdata/plugin/" + p;
            });
        }

        if (windows) {
            cmd = python;
            args = [tangelo_script];
        } else {
            cmd = cover ? coverage : tangelo_script;
            args = cover ? ["run", "-a", "--source", [tangelo_dir].concat(sourceDirs).join(","), tangelo_script] : [];
        }

        return {
            cmd: cmd,
            args: args.concat([
                "--host", hostname,
                "--port", port,
                "--root", root,
                "--config", "tests/bundled-plugins.yaml"
            ])
        };
    };

    styleCheckFiles = [
        "js/src/**/*.js",
        pluginDir + "**/*.js",
        "!" + pluginDir + "docs/**/*.js",
        "!" + pluginDir + "**/geo.min.js",
        "!" + pluginDir + "**/geo.ext.min.js",
        "!" + pluginDir + "**/vgl.min.js",
        "!" + pluginDir + "tangelo/web/tangelo.min.js",
        "!" + pluginDir + "vtkweb/web/lib/autobahn.min.js",
        "!" + pluginDir + "vtkweb/web/lib/vtkweb-all.min.js"
    ];

    // Project configuration.
    grunt.initConfig({
      version: {
          src: [
              "tangelo/tangelo/__main__.py",
              pluginDir + "tangelo/web/version.py",
              "tangelo/setup.py",
              "js/src/core.js"
          ]
      },
      concat: {
          options: {
              banner: "<%= banner %>",
              stripBanners: true
          },
          dist: {
              src: ["js/src/**/*.js"],
              dest: pluginDir + "tangelo/web/tangelo.js"
          }
      },
      uglify: {
          options: {
              banner: "<%= banner %>"
          },
          dist: {
              src: "<%= concat.dist.dest %>",
              dest: pluginDir + "tangelo/web/tangelo.min.js"
          }
      },
      jshint: {
          gruntfile: {
              src: "Gruntfile.js"
          },
          tangelo: {
              src: styleCheckFiles
          },
          test: {
              src: ["js/tests/*.js"]
          }
      },
      jscs: {
          options: {
              config: ".jscsrc"
          },
          gruntfile: {
              src: ["Gruntfile.js"]
          },
          tangelo: {
              src: styleCheckFiles
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
                  "node_modules/grunt-blanket-qunit/reporter/grunt-reporter.js"
              ],
              dest: "js/tests/results/js/"
          }
      },
      jade: {
          jstest: {
              files: {
                  "js/tests/results/js/index.html": "js/tests/jade/qunitHarness.jade"
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
      blanket_qunit: {
          all: {
              options: {
                  urls: ["http://localhost:50047/results/js/index.html?coverage=true&lights=4"],
                  threshold: 20,
                  verbose: true
              }
          }
      },
      server_tests: {
          main: {
              src: ["tests/*.py"]
          }
      },
      coverage_report: {
          options: {
              threshold: 20,
              html_dir: "js/tests/results/python"
          },
          main: {}
      },
      flake8: {
          files: {
              src: [
                  "tangelo/**/*.py",
                  "tests/**/*.py"
              ]
          }
      },
      cleanup: {
          node: ["node_modules"],
          venv: ["venv"],
          config: ["configuration.json"],
          sdist: ["sdist"],
          test: ["js/tests/results"],
          package: [
              "tangelo/MANIFEST",
              "tangelo/README",
              pluginDir + "docs",
              webDir + "js"
          ]
      }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks("grunt-continue");
    grunt.loadNpmTasks("grunt-version");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-jscs");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-jade");
    grunt.loadNpmTasks("grunt-blanket-qunit");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-clean");

    // Configuration task.
    grunt.registerTask("config", "Record configuration options", function (option, value) {
        var defaultConfig,
            readConfig,
            writeConfig;

        defaultConfig = function () {
            return {
                virtualenv: "virtualenv"
            };
        };

        readConfig = function () {
            var text;

            try {
                text = fs.readFileSync("configuration.json");
            } catch (e) {
                config = defaultConfig();
                return;
            }

            try {
                config = JSON.parse(text);
            } catch (e) {
                grunt.fail.warn("configuration.json does not appear to contain JSON text");
            }

            if (Object.prototype.toString.call(config) !== "[object Object]") {
                grunt.fail.warn("configuration.json does not contain a JSON object");
            }
        };

        writeConfig = function () {
            var text = JSON.stringify(config, null, 4) + "\n";
            try {
                fs.writeFileSync("configuration.json", text);
            } catch (e) {
                grunt.fail.warn("could not write configuration.json");
            }
        };

        if (option === undefined) {
            readConfig();
            console.log(config);
        } else if (defaultConfig().hasOwnProperty(option)) {
            if (value === undefined) {
                readConfig();
                console.log(config[option]);
            } else {
                readConfig();
                config[option] = value;
                writeConfig();
            }
        } else {
            grunt.fail.warn("Illegal configuration option '" + option + "'");
        }
    });

    // Virtualenv installation task.
    grunt.registerTask("virtualenv", "Create a virtual python environment", function () {
        var done;

        if (!config) {
            grunt.task.run("config");
            grunt.task.run("virtualenv");
            return;
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
            "Sphinx==1.3b2",
            "flake8==2.2.2",
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

    grunt.registerMultiTask("flake8", "Style check Python sources", function () {
        var done = this.async();

        grunt.util.spawn({
            cmd: flake8,
            args: this.filesSrc,
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
        var done,
            pyversion;

        done = this.async();

        // This is necessary to reconcile Python setuptools's notion of version
        // numbers with npm's.  Both accept "foobar-0.8.1-dev" as a valid
        // version number, but setuptools will "normalize" it to
        // "foobar-0.8.1.dev0", so we need to do the same in order to install
        // the package created by the grunt package task.
        pyversion = version.replace("-dev", ".dev0");

        grunt.util.spawn({
            cmd: pip,
            args: ["install", "--upgrade", "sdist/tangelo-" + pyversion + zipExt],
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

    grunt.registerMultiTask("server_tests", "Run server tests (with coverage on non-Windows platforms)", function () {
        var done = this.async(),
            source_dirs;

        if (windows) {
            grunt.util.spawn({
                cmd: nosetests,
                args: ["--verbose", "--tests=" + this.filesSrc.join(",")],
                opts: {
                    stdio: "inherit"
                }
            }, function (error, result, code) {
                done(code === 0);
            });
        } else {
            grunt.util.spawn({
                cmd: coverage,
                args: ["run", "-a", "--source", [tangelo_dir].concat(source_dirs).join(","),
                       nosetests, "--verbose", "--tests=" + this.filesSrc.join(",")],
                opts: {
                    stdio: "inherit"
                }
            }, function (error, result, code) {
                done(code === 0);
            });
        }
    });

    grunt.registerTask("coverage", "Manipulate coverage results", function (action) {
        var done;

        if (windows) {
            return;
        }

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
                   pluginDir + "docs/web"],
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
        var done = this.async(),
            tangeloCmd;

        if (host === undefined && port === undefined) {
            host = "localhost";
            port = "8080";
        } else if (port === undefined) {
            port = host;
            host = "localhost";
        }

        tangeloCmd = tangeloCmdLine(host, port, "venv/lib/python2.7/site-packages/tangelo/pkgdata/web", false);

        grunt.util.spawn({
            cmd: tangeloCmd.cmd,
            args: tangeloCmd.args,
            opts: {
                stdio: "inherit"
            }
        }, function () {
            done();
        });
    });

    grunt.registerTask("serve:test", "Serve Tangelo in testing mode", function () {
        var done = this.async(),
            tangeloCmd;

        tangeloCmd = tangeloCmdLine("localhost", "50047", "js/tests", false);

        grunt.util.spawn({
            cmd: tangeloCmd.cmd,
            args: tangeloCmd.args,
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

                cmdline = tangeloCmdLine("localhost", "50047", "js/tests", !windows);

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

    grunt.registerTask("test:server", [
        "coverage:erase",
        "server_tests",
        "coverage:combine",
        "coverage_report"
    ]);

    grunt.registerTask("test:client", [
        "jade:jstest",
        "copy:jstest",
        "tangelo:start",
        "continueOn",
        "blanket_qunit",
        "continueOff",
        "tangelo:stop"
    ]);

    grunt.registerTask("test:client:coverage", [
        "coverage:erase",
        "test:client",
        "coverage:combine",
        "coverage_report"
    ]);

    grunt.registerTask("test", [
        "coverage:erase",
        "server_tests",
        "test:client",
        "coverage:combine",
        "coverage_report"
    ]);

    // Clean task.
    grunt.renameTask("clean", "cleanup");
    grunt.registerTask("clean:sdist", "cleanup:sdist");
    grunt.registerTask("clean:test", "cleanup:test");
    grunt.registerTask("clean:package", "cleanup:package");
    grunt.registerTask("clean:config", "cleanup:config");
    grunt.registerTask("clean:node", "cleanup:node");
    grunt.registerTask("clean:venv", "cleanup:venv");
    grunt.registerTask("clean", ["clean:sdist",
                                 "clean:test",
                                 "clean:package"]);
    grunt.registerTask("clean:all", ["clean",
                                     "clean:config",
                                     "clean:node",
                                     "clean:venv"]);

    // Default task.
    grunt.registerTask("default", ["version",
                                   "virtualenv",
                                   "pydeps",
                                   "flake8",
                                   "docs",
                                   "jshint",
                                   "jscs",
                                   "js",
                                   "copy:readme",
                                   "package",
                                   "install"]);
};
