import datetime
import sys
import HTMLParser
import os
import cherrypy
import json
import imp
import traceback
import types

import tangelo
from   tangelo.minify_json import json_minify
import tangelo.util

cpserver = None

class Tangelo(object):
    # An HTML parser for use in the error_page handler.
    html = HTMLParser.HTMLParser()

    def __init__(self, vtkweb=None, stream=None):
        self.vtkweb = vtkweb
        self.stream = stream

        # A dict containing information about imported modules.
        self.modules = {}

        # Mount a streaming API if requested.
        #
        # TODO(choudhury): make the mounting directory configurable by the user.
        if self.stream:
            cherrypy.tree.mount(stream, "/stream")

        # Mount a VTKWeb API if requested.
        #
        # TODO(choudhury): make the mounting directory configurable by the user.
        if self.vtkweb is not None:
            cherrypy.tree.mount(self.vtkweb, "/vtkweb")

        # Mount Girder API if available.
        try:
            from girder.api import api_main

            cherrypy.config.update({
                "sessions": {"cookie_lifetime": 180},
                "server": {"mode": "development"},
                "database": {
                    "host": "localhost",
                    "port": 27017,
                    "user": "",
                    "password": "",
                    "database": "girder"
                }
            })

            class Dummy(object):
                pass

            cherrypy.tree.mount(api_main.addApiToNode(Dummy()), "/girder", {
                '/': {
                    'request.dispatch': cherrypy.dispatch.MethodDispatcher()
                }
            })
        except ImportError:
            # Ok, just don't mount it.
            pass

    def cleanup(self):
        if self.vtkweb:
            self.vtkweb.shutdown_all()

    @staticmethod
    def error_page(status, message, traceback, version):
        message = Tangelo.html.unescape(message)
        return """<!doctype html>
<h2>%s</h2>
<p>%s
<hr>
<p><em>Powered by Tangelo</em> <img src=/favicon.ico>""" % (status, message)

    def invoke_service(self, module, *pargs, **kwargs):
        # TODO(choudhury): This method should attempt to load the named module,
        # then invoke it with the given arguments.  However, if the named module
        # is "config" or something similar, the method should instead launch a
        # special "config" app, which lists the available app modules, along
        # with docstrings or similar.  It should also allow the user to
        # add/delete search paths for other modules.
        tangelo.content_type("text/plain")

        # Save the system path (be sure to *make a copy* using the list()
        # function) - it will be modified before invoking the service, and must
        # be restored afterwards.
        origpath = list(sys.path)

        # By default, the result should be an object with error message in if
        # something goes wrong; if nothing goes wrong this will be replaced with
        # some other object.
        result = {}

        # Store the modpath in the thread-local storage (tangelo.paths() makes
        # use of this per-thread data, so this is the way to get the data across
        # the "module boundary" properly).
        modpath = os.path.dirname(module)
        cherrypy.thread_data.modulepath = modpath
        cherrypy.thread_data.modulename = module

        # Extend the system path with the module's home path.
        sys.path.insert(0, modpath)

        # Import the module if not already imported previously (or if the module
        # to import, or its configuration file, has been updated since the last
        # import).
        try:
            stamp = self.modules.get(module)
            mtime = os.path.getmtime(module)

            config_file = module[:-2] + "json"
            config_mtime = None
            if os.path.exists(config_file):
                config_mtime = os.path.getmtime(config_file)

            if stamp is None or mtime > stamp["mtime"] or (config_mtime is not None and config_mtime > stamp["mtime"]):
                if stamp is None:
                    tangelo.log("loading new module: " + module)
                else:
                    tangelo.log("reloading module: " + module)

                # Load any configuration the module might carry with it.
                if config_mtime is not None:
                    try:
                        with open(config_file) as f:
                            config = json.loads(json_minify(f.read()))
                            if type(config) != dict:
                                msg = "Service module configuration file does not contain a key-value store (i.e., a JSON Object)"
                                tangelo.log(msg)
                                raise TypeError(msg)
                    except IOError:
                        tangelo.log("Could not open config file %s" % (config_file))
                        raise
                    except ValueError as e:
                        tangelo.log("Error reading config file %s: %s" % (config_file, e))
                        raise
                else:
                    config = {}

                cherrypy.config["module-config"][module] = config

                # Remove .py to get the module name
                name = module[:-3]

                # Load the module.
                service = imp.load_source(name, module)
                self.modules[module] = { "module": service,
                                         "mtime": max(mtime, config_mtime) }
            else:
                service = stamp["module"]
        except:
            bt = traceback.format_exc()

            tangelo.log("Error importing module %s" % (tangelo.request_path()), "SERVICE")
            tangelo.log(bt, "SERVICE")

            result = tangelo.HTTPStatusCode("501 Error in Python Service", "There was an error while trying to import module %s:<br><pre>%s</pre>" % (tangelo.request_path(), bt))
        else:
            # Try to run the service - either it's in a function called "run()",
            # or else it's in a REST API consisting of at least one of "get()",
            # "put()", "post()", or "delete()".
            #
            # Collect the result in a variable - depending on its type, it will be
            # transformed in some way below (by default, to JSON, but may also raise
            # a cherrypy exception, log itself in a streaming table, etc.).
            #
            try:
                if 'run' in dir(service):
                    # Call the module's run() method, passing it the positional and
                    # keyword args that came into this method.
                    result = service.run(*pargs, **kwargs)
                else:
                    # Reaching here means it's a REST API.  Check for the
                    # requested method, ensure that it was marked as being part
                    # of the API, and call it; or give a 405 error.
                    method = cherrypy.request.method
                    restfunc = service.__dict__[method.lower()]
                    if restfunc is not None and hasattr(restfunc, "restful") and restfunc.restful:
                        result = restfunc(*pargs, **kwargs)
                    else:
                        result = tangelo.HTTPStatusCode(405, "Method not allowed")
            except Exception as e:
                bt = traceback.format_exc()

                tangelo.log("Caught exception while executing service %s" % (tangelo.request_path()), "SERVICE")
                tangelo.log(bt, "SERVICE")

                result = tangelo.HTTPStatusCode("501 Error in Python Service", "There was an error executing service %s:<br><pre>%s</pre>" % (tangelo.request_path(), bt))

        # Restore the path to what it was originally.
        sys.path = origpath

        # Check the type of the result to decide what result to finally return:
        #
        # 1. If it is an HTTPStatusCode object, raise a cherrypy HTTPError
        # exception, which will cause the browser to do the right thing.
        #
        # 2. TODO: If it's a Python generator object, log it with the Tangelo
        # streaming API.
        #
        # 3. If it's a Python dictionary, convert it to JSON.
        #
        # 4. If it's a string, don't do anything to it.
        #
        # This allows the services to return a Python object if they wish, or to
        # perform custom serialization (such as for MongoDB results, etc.).
        if isinstance(result, tangelo.HTTPStatusCode):
            if result.msg:
                raise cherrypy.HTTPError(result.code, result.msg)
            else:
                raise cherrypy.HTTPError(result.code)
        elif "next" in dir(result):
            if self.stream:
                return self.stream.add(result)
            else:
                return json.dumps({"error": "Streaming is not supported in this instance of Tangelo"})
        elif not isinstance(result, types.StringTypes):
            try:
                result = json.dumps(result)
            except TypeError as e:
                t = e.message.split("<service.")[1].split()[0]
                msg = "Service %s returned an object of type %s that could not be serialized to JSON" % (tangelo.request_path(), t)

                tangelo.log("Error: %s" % (msg), "SERVICE")

                raise cherrypy.HTTPError("501 Error in Python Service", msg)

        return result

    @staticmethod
    def dirlisting(dirpath, reqpath):
        if reqpath[-1] == "/":
            reqpath = reqpath[:-1]
        files = filter(lambda x: len(x) > 0 and x[0] != ".", os.listdir(dirpath))
        #filespec = ["Type", "Name", "Last modified", "Size"]
        filespec = []
        for f in files:
            p = dirpath + os.path.sep + f
            try:
                s = os.stat(p)
            except OSError:
                pass
            else:
                mtime = datetime.datetime.fromtimestamp(s.st_mtime).strftime("%Y-%m-%d %H:%M:%S")

                if os.path.isdir(p):
                    f += "/"
                    t = "dir"
                    s = "-"
                else:
                    t = "file"
                    s = s.st_size

                filespec.append([t, "<a href=\"%s/%s\">%s</a>" % (reqpath, f, f), mtime, s])

        filespec = "\n".join(map(lambda row: "<tr>" + "".join(map(lambda x: "<td>%s</td>" % x, row)) + "</tr>", filespec))

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

        #return "<!doctype html><h1>Directory Listing</h1>This is a dummy directory listing placeholder."
        return result

    @cherrypy.expose
    def default(self, *path, **args):
        target = cherrypy.thread_data.target
        if target is not None:
            if target["type"] == "file":
                return cherrypy.lib.static.serve_file(target["path"])
            elif target["type"] == "dir":
                return Tangelo.dirlisting(target["path"], cherrypy.request.path_info)
            elif target["type"] == "service":
                return self.invoke_service(target["path"], *target["pargs"], **args)
            elif target["type"] == "404":
                raise cherrypy.lib.static.serve_file(target["path"])
            else:
                raise RuntimeError("Illegal target type '%s'" % (target["type"]))
