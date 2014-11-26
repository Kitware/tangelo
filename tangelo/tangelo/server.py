import ConfigParser
import datetime
import sys
import os
import cherrypy
import json
import traceback
import types

import tangelo
import tangelo.util


class Tangelo(object):
    def __init__(self, module_cache=None):
        # A dict containing information about imported modules.
        self.modules = tangelo.util.ModuleCache() if module_cache is None else module_cache

    def invoke_service(self, module, *pargs, **kwargs):
        # TODO(choudhury): This method should attempt to load the named module,
        # then invoke it with the given arguments.  However, if the named
        # module is "config" or something similar, the method should instead
        # launch a special "config" app, which lists the available app modules,
        # along with docstrings or similar.  It should also allow the user to
        # add/delete search paths for other modules.
        tangelo.content_type("text/plain")

        # Save the system path (be sure to *make a copy* using the list()
        # function) - it will be modified before invoking the service, and must
        # be restored afterwards.
        origpath = list(sys.path)

        # By default, the result should be an object with error message in if
        # something goes wrong; if nothing goes wrong this will be replaced
        # with some other object.
        result = {}

        # Store the modpath in the thread-local storage (tangelo.paths() makes
        # use of this per-thread data, so this is the way to get the data
        # across the "module boundary" properly).
        modpath = os.path.dirname(module)
        cherrypy.thread_data.modulepath = modpath
        cherrypy.thread_data.modulename = module

        # Extend the system path with the module's home path.
        sys.path.insert(0, modpath)

        try:
            service = self.modules.get(module)
        except tangelo.util.ModuleCache.Error as e:
            tangelo.http_status(501, "Error Importing Service")
            tangelo.content_type("application/json")
            result = e.error_dict()
        else:
            # Try to run the service - either it's in a function called
            # "run()", or else it's in a REST API consisting of at least one of
            # "get()", "put()", "post()", or "delete()".
            #
            # Collect the result in a variable - depending on its type, it will
            # be transformed in some way below (by default, to JSON, but may
            # also raise a cherrypy exception, log itself in a streaming table,
            # etc.).
            try:
                if 'run' in dir(service):
                    # Call the module's run() method, passing it the positional
                    # and keyword args that came into this method.
                    result = service.run(*pargs, **kwargs)
                else:
                    # Reaching here means it's a REST API.  Check for the
                    # requested method, ensure that it was marked as being part
                    # of the API, and call it; or give a 405 error.
                    method = cherrypy.request.method
                    restfunc = service.__dict__.get(method.lower())
                    if (restfunc is not None and hasattr(restfunc, "restful") and restfunc.restful):
                        result = restfunc(*pargs, **kwargs)
                    else:
                        tangelo.http_status(405, "Method Not Allowed")
                        tangelo.content_type("application/json")
                        result = {"error": "Method '%s' is not allowed in this service" % (method)}
            except:
                bt = traceback.format_exc()

                tangelo.log("ERROR", "Caught exception while executing service %s" %
                            (tangelo.request_path()))
                tangelo.log("ERROR", bt)

                tangelo.http_status(501, "Web Service Error")
                tangelo.content_type("application/json")
                result = {"error": "Error executing service",
                          "module": tangelo.request_path(),
                          "traceback": bt.split("\n")}

        # Restore the path to what it was originally.
        sys.path = origpath

        # If the result is not a string, attempt to convert it to one via JSON
        # serialization.  This allows services to return a Python object if they
        # wish, or to perform custom serialization (such as for MongoDB results,
        # etc.).
        if not isinstance(result, types.StringTypes):
            try:
                result = json.dumps(result)
            except TypeError as e:
                tangelo.http_status(501, "Web Service Error")
                tangelo.content_type("application/json")
                result = {"error": "JSON type error executing service",
                          "message": e.message}
            else:
                tangelo.content_type("application/json")

        return result

    @staticmethod
    def dirlisting(dirpath, reqpath):
        if reqpath[-1] == "/":
            reqpath = reqpath[:-1]
        files = filter(lambda x: len(x) > 0 and x[0] != ".",
                       os.listdir(dirpath))
        # filespec = ["Type", "Name", "Last modified", "Size"]
        filespec = []
        for f in files:
            p = dirpath + os.path.sep + f
            try:
                s = os.stat(p)
            except OSError:
                pass
            else:
                mtime = (datetime.datetime
                         .fromtimestamp(s.st_mtime)
                         .strftime("%Y-%m-%d %H:%M:%S"))

                if os.path.isdir(p):
                    f += "/"
                    t = "dir"
                    s = "-"
                else:
                    t = "file"
                    s = s.st_size

                filespec.append([t, "<a href=\"%s/%s\">%s</a>" %
                                    (reqpath, f, f),
                                 mtime, s])

        filespec = "\n".join(
            map(lambda row: "<tr>" +
                            "".join(map(lambda x: "<td>%s</td>" % x,
                                    row)) +
                            "</tr>",
                filespec))

        result = """<!doctype html>
<title>Index of %s</title>
<h1>Index of %s</h1>
<table>
<tr>
    <th>Type</th><th>Name</th><th>Last Modified</th><th>Size</th>
</tr>
%s
</table>
""" % (reqpath, reqpath, filespec)

        return result

    @cherrypy.expose
    def default(self, *path, **args):
        target = cherrypy.thread_data.target
        if target is not None:
            if target["type"] == "file":
                return cherrypy.lib.static.serve_file(target["path"])
            elif target["type"] == "dir":
                return Tangelo.dirlisting(target["path"],
                                          cherrypy.request.path_info)
            elif target["type"] == "service":
                return self.invoke_service(target["path"],
                                           *target["pargs"],
                                           **args)
            elif target["type"] == "404":
                raise cherrypy.lib.static.serve_file(target["path"])
            elif target["type"] == "restricted":
                raise cherrypy.HTTPError("403 Forbidden",
                                         "The path '%s' is forbidden" % (cherrypy.serving.request.path_info))
            else:
                raise RuntimeError("Illegal target type '%s'" %
                                   (target["type"]))


class Plugins(object):
    class Plugin(object):
        def __init__(self, path):
            self.path = path
            self.control = None
            self.module = None
            self.apps = []

    def __init__(self, base_package, config_file, tangelo_server):
        self.base_package = base_package
        self.config_file = config_file
        self.tangelo_server = tangelo_server

        self.config_dir = os.path.dirname(self.config_file)
        self.mtime = 0
        self.plugins = {}
        self.missing_msg = "Plugin config file %s seems to have disappeared" % (self.config_file)

        self.modules = tangelo.util.ModuleCache(config=False, http_error=False)

        exec("%s = sys.modules[self.base_package] = types.ModuleType(self.base_package)" % (self.base_package))

    def load(self, plugin_name, path):
        tangelo.log("PLUGIN", "Loading plugin %s (from %s)" % (plugin_name, path))

        plugin = Plugins.Plugin(path)

        # Check for a configuration file.
        config_file = os.path.join(path, "config.json")
        config = {}
        if os.path.exists(config_file):
            try:
                config = tangelo.util.load_service_config(config_file)
            except TypeError as e:
                tangelo.log("PLUGIN", "Bad configuration in file %s: %s" % (config_file, e))
                return
            except IOError:
                tangelo.log("PLUGIN", "Could not open config file %s" % (config_file))
                return
            except ValueError as e:
                tangelo.log("PLUGIN", "Error reading config file %s: %s" % (config_file, e))
                return

        # Install the config and an empty dict as the plugin-level
        # config and store.
        cherrypy.config["plugin-config"][path] = config
        cherrypy.config["plugin-store"][path] = {}

        # Check for a "python" directory, and place all modules found
        # there in a virtual submodule of tangelo.plugin.
        python = os.path.join(path, "python")
        if os.path.exists(python):
            tangelo.log("PLUGIN", "Loading python module content")

            init = os.path.join(python, "__init__.py")
            if not os.path.exists(init):
                tangelo.log("PLUGIN", "error:  plugin '%s' includes a 'python' directory but is missing __init.py__" % (plugin))
            else:
                module_name = "%s.%s" % (self.base_package, plugin_name)
                plugin.module = module_name
                old_path = sys.path
                sys.path.append(python)
                try:
                    exec('%s = sys.modules[module_name] = self.modules.get(init)' % (module_name))
                finally:
                    sys.path = old_path

        # Check for any setup that needs to be done, including any apps
        # that need to be mounted.
        control_file = os.path.join(path, "control.py")
        if os.path.exists(control_file):
            tangelo.log("PLUGIN", "...loading plugin control module")
            try:
                control = self.modules.get(control_file)
                plugin.control = control
            except ImportError:
                tangelo.log("PLUGIN", "Could not import control module:")
                tangelo.log("PLUGIN", traceback.format_exc())
                return
            else:
                if "setup" in dir(control):
                    tangelo.log("PLUGIN", "...running plugin setup")
                    try:
                        setup = control.setup(config, cherrypy.config["plugin-store"][path])
                    except:
                        tangelo.log("PLUGIN", "Caught exception while running setup:")
                        tangelo.log("PLUGIN", traceback.format_exc())
                        return
                    else:
                        for app in setup.get("apps", []):
                            if len(app) == 2:
                                (app_obj, mountpoint) = app
                                app_config = {}
                            elif len(app) == 3:
                                (app_obj, app_config, mountpoint) = app
                            else:
                                tangelo.log("PLUGIN", "app mounting has %d item%s (should be either 2 or 3)" % (len(app), "" if len(app) == 1 else "s"))
                                return

                            app_path = os.path.join("/plugin", plugin_name, mountpoint)
                            if app_path in cherrypy.tree.apps:
                                tangelo.log("PLUGIN", "Failed to mount application at %s (app already mounted there)" % (app_path))
                                return
                            else:
                                cherrypy.tree.mount(app_obj, app_path, app_config)
                                plugin.apps.append(app_path)
                                tangelo.log("PLUGIN", "...mounting application at %s" % (app_path))

        self.plugins[plugin_name] = plugin

    def unload(self, plugin_name):
        tangelo.log("PLUGIN", "Unloading plugin '%s'" % (plugin_name))

        plugin = self.plugins[plugin_name]

        if plugin.module is not None:
            tangelo.log("PLUGIN", "...removing module %s" % (plugin.module))
            del sys.modules[plugin.module]
            exec("del %s" % (plugin.module))

        for app_path in plugin.apps:
            tangelo.log("PLUGIN", "...unmounting app at %s" % (app_path))
            del cherrypy.tree.apps[app_path]

        if "teardown" in dir(plugin.control):
            tangelo.log("PLUGIN", "...running teardown")
            try:
                plugin.control.teardown(cherrypy.config["plugin-config"][plugin.path], cherrypy.config["plugin-store"][plugin.path])
            except:
                tangelo.log("PLUGIN", "Caught exception while running teardown:")
                tangelo.log("PLUGIN", traceback.format_exc())

        del self.plugins[plugin_name]

    def refresh(self):
        if not os.path.exists(self.config_file):
            if self.mtime > 0:
                tangelo.log("PLUGIN", self.missing_msg)
                self.mtime = 0
            self.plugins = {}
            return

        mtime = os.path.getmtime(self.config_file)
        if mtime <= self.mtime:
            return

        parser = ConfigParser.RawConfigParser({"enabled": "true"})
        files = parser.read(self.config_file)
        if len(files) == 0:
            tangelo.log("PLUGIN", self.missing_msg)
            return

        plugins = parser.sections()
        seen = set()
        for plugin in plugins:
            # See whether the plugin is enabled (default: yes)
            try:
                enabled = parser.getboolean(plugin, "enabled")
            except ValueError:
                tangelo.log("PLUGIN", "error:  setting 'enabled' in configuration for plugin '%s' must be a boolean value!" % (plugin))
                continue

            if enabled and plugin not in self.plugins:
                # Extract the plugin path.
                try:
                    path = os.path.join(self.config_dir, parser.get(plugin, "path"))
                except ConfigParser.NoOptionError:
                    tangelo.log("PLUGIN", "error: configuration for plugin '%s' missing required setting 'path'" % (plugin))
                    continue

                self.load(plugin, path)
            elif not enabled and plugin in self.plugins:
                self.unload(plugin)

            # Record the fact that this plugin was referenced in the plugin
            # config file.
            seen.add(plugin)

        # All plugins that are still loaded, and yet weren't mentioned in the
        # config file, should be unloaded (i.e., deleting a section from the
        # plugin config file is the same as leaving it there but setting
        # "enabled" to False).
        for plugin in filter(lambda x: x not in seen, self.plugins):
            self.unload(plugin)

    def unload_all(self):
        for plugin_name in self.plugins.keys():
            self.unload(plugin_name)

    @cherrypy.expose
    def index(self):
        error = self.refresh()
        if error is not None:
            tangelo.content_type("text/plain")
            tangelo.http_status(400, "Bad Plugin Configuration")
            return error

        tangelo.content_type("application/json")
        return json.dumps(self.plugins.keys())

    @cherrypy.expose
    def default(self, plugin, *path, **query):
        # Refresh the plugin registry.
        error = self.refresh()
        if error is not None:
            tangelo.content_type("text/plain")
            tangelo.http_status(400, "Bad Plugin Configuration")
            return error

        # If the named plugin isn't registered, bail out immediately.
        if plugin not in self.plugins:
            tangelo.http_status(404, "Plugin Not Found")
            tangelo.content_type("application/json")
            return json.dumps({"error": "Requested plugin not found in registry",
                               "plugin": plugin})

        plugin_path = self.plugins[plugin].path

        if len(path) == 0:
            # Perform a redirect to a trailing-slash path if there isn't one.
            if tangelo.request_path()[-1] != "/":
                raise cherrypy.HTTPRedirect("/plugin/%s/" % (plugin))

            # Look for an index file in the root of the plugin content
            # directory, and serve it if found.
            for index in (os.path.join(plugin_path, "web", i) for i in ["index.html", "index.htm"]):
                if os.path.exists(index):
                    return cherrypy.lib.static.serve_file(index)

            # Look for a README file in the plugin directory, and serve it if
            # found.
            candidates = (os.path.join(plugin_path, f) for f in ["README.md", "README.rst", "README.txt", "README"])
            for c in candidates:
                if os.path.exists(c):
                    return cherrypy.lib.static.serve_file(c)

            # Finally, if all else fails, serve a friendly message confirming
            # the existence of the plugin (in all cases, the 200 response code
            # indicates this as well).
            tangelo.content_type("text/plain")
            return "Plugin '%s' is here, but there's no README!  If you know the authors of this plugin, you should get them to write one!" % (plugin)
        else:
            # Check for a possible service being named by the requested path.
            base_path = os.path.join(plugin_path, "web")
            for i in range(1, len(path) + 1):
                service_path = os.path.join(base_path, *(path[:i])) + ".py"
                if os.path.exists(service_path):
                    cherrypy.thread_data.pluginname = plugin_path
                    val = self.tangelo_server.invoke_service(service_path, *path[i:], **query)
                    cherrypy.thread_data.plugin_path = None
                    return val

            # Reaching here means we should try to serve the requested path as a
            # static resource.
            return cherrypy.lib.static.serve_file(os.path.join(base_path, *path))
