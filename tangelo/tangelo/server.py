import datetime
import sys
import os
import cherrypy
import json
import traceback
import types

import tangelo
import tangelo.util


class Directive(object):
    HTTPRedirect = 1
    InternalRedirect = 2
    ListPlugins = 3

    def __init__(self, t, argument=None):
        self.type = t
        self.argument = argument


class Content(object):
    NotFound = 1
    Directory = 2
    File = 3
    Service = 4
    Restricted = 5

    def __init__(self, t, path=None, pargs=None):
        self.type = t
        self.path = path
        self.pargs = pargs


class UrlAnalysis(object):
    def __init__(self):
        self.directive = None
        self.content = None
        self.reqpathcomp = None
        self.pathcomp = None
        self.plugin_path = None

    def __str__(self):
        import pprint
        d = {}
        for k, v in self.__dict__.iteritems():
            if v is not None and k in ["content", "directive"]:
                d[k] = v.__dict__
            else:
                d[k] = v
        return pprint.pformat(d)


def analyze_url(raw_reqpath):
    webroot = cherrypy.config.get("webroot")
    plugins = cherrypy.config.get("plugins")

    reqpath = raw_reqpath

    analysis = UrlAnalysis()

    # If the request path is blank, redirect to /.
    if reqpath == "":
        analysis.directive = Directive(Directive.HTTPRedirect, argument="/")
        return analysis

    if plugins is not None and reqpath[0] == "/" and reqpath.split("/")[1] == "plugin":
        plugin_comp = reqpath.split("/")
        if len(plugin_comp) < 3:
            analysis.directive = Directive(Directive.ListPlugins)
            return analysis

        plugin = plugin_comp[2]
        if plugin not in plugins.plugins:
            analysis.content = Content(Content.NotFound, path=reqpath)
            return analysis

        analysis.plugin_path = plugins.plugins[plugin].path
        webroot = plugins.plugins[plugin].path + "/web"
        reqpath = "/" + "/".join(plugin_comp[3:])

    # Compute "parallel" path component lists based on the web root and the disk
    # root.
    if reqpath == "/":
        reqpathcomp = []
        pathcomp = [webroot]
    else:
        # Split the request path into path components, omitting the leading
        # slash.
        reqpathcomp = reqpath[1:].split("/")

        # Compute the disk path the URL corresponds to.
        #
        # First check to see whether the path is absolute (i.e. rooted at
        # webroot) or in a user home directory.
        if reqpathcomp[0][0] == "~" and len(reqpathcomp[0]) > 1:
            # Only treat this component as a home directory if there is
            # actually text following the tilde (rather than making the server
            # serve files from the home directory of whatever user account it
            # is using to run).
            pathcomp = [os.path.expanduser(reqpathcomp[0]) +
                        os.path.sep +
                        "tangelo_html"] + reqpathcomp[1:]
        else:
            pathcomp = [webroot] + reqpathcomp

    # Save the request path and disk path components in the thread storage,
    # slightly modifying the request path if it refers to an absolute path
    # (indicated by being one element shorter than the disk path).
    if len(reqpathcomp) == len(pathcomp) - 1:
        reqpathcomp_save = [""] + reqpathcomp
    elif len(reqpathcomp) == len(pathcomp):
        reqpathcomp_save = ["/" + reqpathcomp[0]] + reqpathcomp[1:]
    else:
        raise RuntimeError("reqpathcomp and pathcomp lengths are wonky")

    # If the path represents a directory and has a trailing slash, remove it
    # (this will make the auth update step easier).
    if (len(reqpathcomp_save) > 1 and
            reqpathcomp_save[-1] == "" or
            pathcomp[-1] == ""):
        assert reqpathcomp_save[-1] == "" and pathcomp[-1] == ""
        reqpathcomp_save = reqpathcomp_save[:-1]
        pathcomp_save = pathcomp[:-1]
    else:
        pathcomp_save = pathcomp

    analysis.reqpathcomp = reqpathcomp_save
    analysis.pathcomp = pathcomp_save

    # If pathcomp has more than one element, fuse the first two together.  This
    # makes the search for a possible service below much simpler.
    if len(pathcomp) > 1:
        pathcomp = [pathcomp[0] + os.path.sep + pathcomp[1]] + pathcomp[2:]

    # Form an actual path string.
    path = os.path.sep.join(pathcomp)

    # If the path is a directory, check for a trailing slash.  If missing,
    # perform a redirect to the path WITH the trailing slash.  Otherwise, check
    # for an index.html file in that directory; if found, perform an internal
    # redirect to that file.  Otherwise, leave the path alone - it now
    # represents a request for a directory listing.
    #
    # If instead the path isn't a directory, check to see if it's a regular
    # file.  If it is, save the path in thread local storage - this will let
    # the handler very quickly serve the file.
    #
    # If it is not a regular file, then check to see if it is a python service.
    #
    # Finally, if it is none of the above, then indicate a 404 error.
    if os.path.isdir(path):
        if raw_reqpath[-1] != "/":
            analysis.directive = Directive(Directive.HTTPRedirect, argument=raw_reqpath + "/")
            return analysis
        elif os.path.exists(path + os.path.sep + "index.html"):
            analysis.directive = Directive(Directive.InternalRedirect, argument=raw_reqpath + "index.html")
            return analysis
        else:
            analysis.content = Content(Content.Directory, path=path)
    elif os.path.exists(path):
        # Don't serve Python files (if someone really wants to serve the program
        # text, they can create a symlink with a different file extension and
        # that will be served just fine).
        if len(path) > 3 and path[-3:] == ".py":
            analysis.content = Content(Content.Restricted, path=path)
        else:
            # Also do not serve config files that match up to Python files.
            if (len(path) > 5 and
                    path[-5:] == ".yaml" and
                    os.path.exists(path[:-5] + ".py")):
                analysis.content = Content(Content.Restricted, path=path)
            else:
                analysis.content = Content(Content.File, path=path)
    else:
        service_path = None
        pargs = None
        for i in range(len(pathcomp)):
            service_path = os.path.sep.join(pathcomp[:(i + 1)]) + ".py"
            if os.path.exists(service_path):
                pargs = pathcomp[(i + 1):]
                break

        if pargs is None:
            analysis.content = Content(Content.NotFound, path=path)
        else:
            analysis.content = Content(Content.Service, path=service_path, pargs=pargs)

    return analysis


class AuthUpdate(object):
    # A list of acceptable authentication types.
    allowed_auth_types = ["digest"]

    def __init__(self, app=None):
        self.app = app
        self.security = {}

    @staticmethod
    def parse_htaccess(filename):
        result = {"msg": None,
                  "auth_type": None,
                  "user_file": None,
                  "realm": None,
                  "userpass": None}

        # Try to open and parse the file.
        try:
            with open(filename) as f:
                lines = filter(lambda x: len(x) > 0,
                               map(lambda x: x.strip().split(), f.readlines()))
                keys = map(lambda x: x[0], lines)
                values = map(lambda x: " ".join(x[1:]), lines)

                for i, (k, v) in enumerate(zip(keys, values)):
                    if k == "AuthType":
                        if v not in AuthUpdate.allowed_auth_types:
                            allowed = ", ".join(AuthUpdate.allowed_auth_types)
                            result["msg"] = (
                                "%s is not a supported " +
                                "authentication type.  The " +
                                "supported types are: %s") % (v, allowed)
                            return result
                        else:
                            result["auth_type"] = v
                    elif k in ["AuthPasswordFile", "AuthUserFile"]:
                        result["user_file"] = v
                    elif k == "AuthRealm":
                        result["realm"] = v
                    else:
                        result["msg"] = (
                            "Unknown key '%s' on " +
                            "line %d of file '%s'") % (k, i + 1, filename)
                        return result
        except IOError:
            result["msg"] = "Could not open file '%s'" % (filename)
            return result

        # Open the user file and parse out the username/passwords of those
        # users in the correct realm.
        recs = None
        if result["user_file"] is not None:
            try:
                with open(result["user_file"]) as f:
                    recs = filter(lambda x: x[1] == result["realm"],
                                  map(lambda x: x.strip().split(":"),
                                      f.readlines()))
            except IOError:
                result["msg"] = ("Could not open user " +
                                 "password file '%s'") % (result["user_file"])
                return result
            except IndexError:
                result["msg"] = ("Malformed content in user password file " +
                                 "'%s' (some line has too " +
                                 "few fields)") % (result["user_file"])
                return result

        try:
            result["userpass"] = {x[0]: x[2] for x in recs}
        except IndexError:
            result["msg"] = ("Malformed content in user password file " +
                             "'%s' (some line has too " +
                             "few fields)") % (result["user_file"])
            return result

        return result

    def htaccess(self, htfile, reqpath):
        changed = False
        if htfile is None:
            if reqpath in self.security:
                del self.security[reqpath]

                cfg = self.app.config[reqpath]
                for a in AuthUpdate.allowed_auth_types:
                    key = "tools.auth_%s.on" % (a)
                    if key in cfg:
                        cfg[key] = False
                    self.app.merge({reqpath: cfg})
                    changed = True
        else:
            # Get the mtime of the htfile.
            ht_mtime = os.stat(htfile).st_mtime

            if (reqpath not in self.security or
                    ht_mtime > self.security[reqpath]):
                # We have either a new .htaccess file, or one that has
                # been modified list the last request to this path.
                htspec = AuthUpdate.parse_htaccess(htfile)
                if htspec["msg"] is not None:
                    tangelo.log_error("TANGELO", "[AuthUpdate] Could not register %s: %s" % (reqpath, htspec["msg"]))
                    return changed, htspec["msg"]

                # Create an auth config tool using the values in the htspec.
                toolname = "tools.auth_%s." % (htspec["auth_type"])
                passdict = (
                    lambda realm, username: htspec["userpass"].get(username))
                # TODO(choudhury): replace "deadbeef" with a nonce created
                # randomly in the __init__() method.
                auth_conf = {toolname + "on": True,
                             toolname + "realm": htspec["realm"],
                             toolname + "get_ha1": passdict,
                             toolname + "key": "deadbeef"}

                self.app.merge({reqpath: auth_conf})

                # Store the mtime in the security table.
                self.security[reqpath] = ht_mtime

                changed = True

        return changed, None

    def update(self, reqpathcomp, pathcomp):
        # The lengths of the lists should be equal.
        assert len(reqpathcomp) == len(pathcomp)

        # Create a list of paths to search, starting with the requested
        # resource and moving towards the root.
        paths = reversed(map(lambda i: ("/".join(reqpathcomp[:(i + 1)]) or "/",
                                        os.path.sep.join(pathcomp[:(i + 1)])),
                             range(len(reqpathcomp))))

        # Check each path that represents a directory for a .htaccess file,
        # then decide what to do based on the current auth state for that path.
        for rpath, dpath in paths:
            if os.path.isdir(dpath):
                htfile = dpath + os.path.sep + ".htaccess"
                if not os.path.exists(htfile):
                    htfile = None

                changed, msg = self.htaccess(htfile, rpath)
                if msg is not None:
                    raise cherrypy.HTTPError(401,
                                             "There was an error in the " +
                                             "HTTP authentication " +
                                             "process: %s" % (msg))

                # TODO(choudhury): I really don't understand why this hack is
                # necessary.  Basically, when the auth_* tool is installed on
                # the path in the htaccess() method, it doesn't seem to take
                # hold until the next time the page is loaded.  So this hack
                # forces a page reload, but it would be better to simply make
                # the new config "take hold" instead.
                if changed:
                    raise cherrypy.HTTPRedirect(cherrypy.request.path_info)

                # Don't bother updating the security table for higher paths -
                # we'll process those later, when they are requested.
                break


class Tangelo(object):
    def __init__(self, module_cache=None, plugins=None):
        self.modules = tangelo.util.ModuleCache() if module_cache is None else module_cache
        self.auth_update = None
        self.plugins = plugins

        if self.plugins:
            self.plugins.refresh()

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
        except:
            tangelo.http_status(501, "Error Importing Service")
            tangelo.content_type("application/json")
            result = {"error": "Could not import module %s" % (tangelo.request_path()),
                      "traceback": traceback.format_exc().split("\n")}
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
                stacktrace = traceback.format_exc()

                tangelo.log_warning("SERVICE", "Could not execute service %s:\n%s" % (tangelo.request_path(), stacktrace))

                tangelo.http_status(501, "Web Service Error")
                tangelo.content_type("application/json")
                result = {"error": "Error executing service",
                          "module": tangelo.request_path(),
                          "traceback": stacktrace.split("\n")}

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
                tangelo.http_status(400, "JSON Error")
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

    def execute_analysis(self, query_args):
        # Analyze the URL.
        analysis = analyze_url(cherrypy.request.path_info)
        directive = analysis.directive
        content = analysis.content

        # If any "directives" were found (i.e., redirections) perform them here.
        if directive is not None:
            if directive.type == Directive.HTTPRedirect:
                raise cherrypy.HTTPRedirect(analysis.directive.argument)
            elif directive.type == Directive.InternalRedirect:
                raise cherrypy.InternalRedirect(analysis.directive.argument)
            elif directive.type == Directive.ListPlugins:
                tangelo.content_type("application/json")
                plugin_list = self.plugins.plugin_list() if self.plugins else []
                return json.dumps(plugin_list)
            else:
                raise RuntimeError("fatal internal error:  illegal directive type code %d" % (analysis.directive.type))

        # If content was actually found at the URL, perform any htaccess updates
        # now.
        do_auth = self.auth_update and content is None or content.type != Content.NotFound
        if do_auth:
            self.auth_update.update(analysis.reqpathcomp, analysis.pathcomp)

        # Serve content here, either by serving a static file, generating a
        # directory listing, executing a service, or barring the client entry.
        if content is not None:
            if content.type in [Content.File, Content.NotFound]:
                return cherrypy.lib.static.serve_file(content.path)
            elif content.type == Content.Directory:
                return Tangelo.dirlisting(content.path, cherrypy.request.path_info)
            elif content.type == Content.Service:
                cherrypy.thread_data.pluginpath = analysis.plugin_path
                return self.invoke_service(content.path, *content.pargs, **query_args)
            elif content.type == Content.Restricted:
                raise cherrypy.HTTPError("403 Forbidden", "The path '%s' is forbidden" % (cherrypy.serving.request.path_info))
            else:
                raise RuntimeError("fatal error: illegal content type code %d" % (content.type))
        else:
            raise RuntimeError("fatal internal error:  analyze_url() returned analysis without directive or content")

    @cherrypy.expose
    def plugin(self, *path, **args):
        # Refresh the plugin registry.
        if self.plugins:
            error = self.plugins.refresh()
            if error is not None:
                tangelo.content_type("text/plain")
                tangelo.http_status(400, "Bad Plugin Configuration")
                return error

        return self.execute_analysis(args)

    @cherrypy.expose
    def default(self, *path, **args):
        return self.execute_analysis(args)


class Plugins(object):
    class Plugin(object):
        def __init__(self, path):
            self.path = path
            self.control = None
            self.module = None
            self.apps = []

    def __init__(self, base_package, config_file):
        self.base_package = base_package
        self.config_file = config_file

        self.config_dir = os.path.dirname(self.config_file)
        self.mtime = 0
        self.plugins = {}
        self.missing_msg = "Plugin config file %s seems to have disappeared" % (self.config_file)

        self.modules = tangelo.util.ModuleCache(config=False)

        exec("%s = sys.modules[self.base_package] = types.ModuleType(self.base_package)" % (self.base_package))

    def plugin_list(self):
        return self.plugins.keys()

    def load(self, plugin_name, path):
        tangelo.log("PLUGIN", "Loading plugin %s (from %s)" % (plugin_name, path))

        plugin = Plugins.Plugin(path)

        # Check for a configuration file.
        config_file = os.path.join(path, "config.yaml")
        config = {}
        if os.path.exists(config_file):
            try:
                config = tangelo.util.load_service_config(config_file)
            except TypeError as e:
                tangelo.log_warning("PLUGIN", "\tBad configuration in file %s: %s" % (config_file, e))
                return
            except IOError:
                tangelo.log_warning("PLUGIN", "\tCould not open config file %s" % (config_file))
                return
            except ValueError as e:
                tangelo.log_warning("PLUGIN", "\tError reading config file %s: %s" % (config_file, e))
                return

        # Install the config and an empty dict as the plugin-level
        # config and store.
        cherrypy.config["plugin-config"][path] = config
        cherrypy.config["plugin-store"][path] = {}

        # Check for a "python" directory, and place all modules found
        # there in a virtual submodule of tangelo.plugin.
        python = os.path.join(path, "python")
        if os.path.exists(python):
            tangelo.log("PLUGIN", "\t...loading python module content")

            init = os.path.join(python, "__init__.py")
            if not os.path.exists(init):
                tangelo.log_warning("PLUGIN", "\terror:  plugin '%s' includes a 'python' directory but is missing __init.py__" % (plugin))
                return False
            else:
                module_name = "%s.%s" % (self.base_package, plugin_name)
                plugin.module = module_name
                old_path = sys.path
                sys.path.append(python)
                try:
                    exec('%s = sys.modules[module_name] = self.modules.get(init)' % (module_name))
                except:
                    tangelo.log_warning("PLUGIN", "Could not import python module content:\n%s" % (traceback.format_exc()))
                    sys.path = old_path
                    return False
                finally:
                    sys.path = old_path

        # Check for any setup that needs to be done, including any apps
        # that need to be mounted.
        control_file = os.path.join(path, "control.py")
        if os.path.exists(control_file):
            tangelo.log("PLUGIN", "\t...loading plugin control module")
            try:
                control = self.modules.get(control_file)
                plugin.control = control
            except:
                tangelo.log_warning("PLUGIN", "Could not import control module:\n%s" % (traceback.format_exc()))
                return False
            else:
                if "setup" in dir(control):
                    tangelo.log("PLUGIN", "\t...running plugin setup")
                    try:
                        setup = control.setup(config, cherrypy.config["plugin-store"][path])
                    except:
                        tangelo.log_warning("PLUGIN", "Could not set up plugin:\n%s" % (traceback.format_exc()))
                        return False
                    else:
                        for app in setup.get("apps", []):
                            if len(app) == 2:
                                (app_obj, mountpoint) = app
                                app_config = {}
                            elif len(app) == 3:
                                (app_obj, app_config, mountpoint) = app
                            else:
                                tangelo.log_warning("PLUGIN", "\tapp mount spec has %d item%s (should be either 2 or 3)" % (len(app), "" if len(app) == 1 else "s"))
                                return False

                            app_path = os.path.join("/plugin", plugin_name, mountpoint)
                            if app_path in cherrypy.tree.apps:
                                tangelo.log_warning("PLUGIN", "\tFailed to mount application at %s (app already mounted there)" % (app_path))
                                return False
                            else:
                                tangelo.log("PLUGIN", "\t...mounting application at %s" % (app_path))
                                cherrypy.tree.mount(app_obj, app_path, app_config)
                                plugin.apps.append(app_path)

        self.plugins[plugin_name] = plugin
        return True

    def unload(self, plugin_name):
        tangelo.log("PLUGIN", "Unloading plugin '%s'" % (plugin_name))

        plugin = self.plugins[plugin_name]

        if plugin.module is not None:
            tangelo.log("PLUGIN", "\t...removing module %s" % (plugin.module))
            del sys.modules[plugin.module]
            exec("del %s" % (plugin.module))

        for app_path in plugin.apps:
            tangelo.log("PLUGIN", "\t...unmounting app at %s" % (app_path))
            del cherrypy.tree.apps[app_path]

        if "teardown" in dir(plugin.control):
            tangelo.log("PLUGIN", "\t...running teardown")
            try:
                plugin.control.teardown(cherrypy.config["plugin-config"][plugin.path], cherrypy.config["plugin-store"][plugin.path])
            except:
                tangelo.log_warning("PLUGIN", "Could not run teardown:\n%s", (traceback.format_exc()))

        del self.plugins[plugin_name]

    def refresh(self):
        if not os.path.exists(self.config_file):
            if self.mtime > 0:
                tangelo.log_warning("PLUGIN", self.missing_msg)
                self.mtime = 0
            self.plugins = {}
            return

        mtime = os.path.getmtime(self.config_file)
        if mtime <= self.mtime:
            return

        self.mtime = mtime

        try:
            config = tangelo.util.PluginConfig(self.config_file)
        except IOError:
            tangelo.log_warning("PLUGIN", self.missing_msg)
            return
        except TypeError:
            tangelo.log_warning("PLUGIN", "plugin config file does not contain a top-level associative array")
            return
        except ValueError as e:
            tangelo.log_warning("PLUGIN", "error reading plugin config file: %s" % (e))
            return

        seen = set()
        for plugin, conf in config.plugins.iteritems():
            # See whether the plugin is enabled (yes by default).
            enabled = conf.get("enabled", True)
            if not isinstance(enabled, bool):
                tangelo.log_warning("PLUGIN", "error:  setting 'enabled' in configuration for plugin '%s' must be a boolean value!" % (plugin))
                continue

            if enabled and plugin not in self.plugins:
                # Extract the plugin path.
                try:
                    path = os.path.join(self.config_dir, conf["path"])
                except KeyError:
                    tangelo.log_warning("PLUGIN", "error: configuration for plugin '%s' missing required setting 'path'" % (plugin))
                    continue

                if not self.load(plugin, path):
                    tangelo.log_warning("PLUGIN", "Plugin %s failed to load" % (plugin))
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
