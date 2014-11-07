import json
import traceback
import types

import cherrypy

import tangelo
import tangelo.tool


class TangeloStream(object):
    exposed = True

    def __init__(self, module_cache=None):
        self.modules = tangelo.util.ModuleCache() if module_cache is None else module_cache
        self.streams = {}

    def GET(self, key=None):
        if key is None:
            result = self.get_streams()
        else:
            result = self.get_stream_info(key)

        return json.dumps(result)

    def get_streams(self):
        return self.streams.keys()

    def get_stream_info(self, key):
        cherrypy.response.status = 501
        return {"error": "stream info method currently unimplemented"}

    def POST(self, *pathcomp, **kwargs):
        if len(pathcomp) == 0:
            # raise error condition
            pass

        if pathcomp[0] == "start":
            if len(pathcomp[1:]) == 0:
                cherrypy.response.status = "400 Path To Service Required"
                result = {"error": "No service path was specified"}
            else:
                result = self.stream_start("/" + "/".join(pathcomp[1:]), kwargs)
        elif pathcomp[0] == "next":
            if len(pathcomp[1:]) != 1:
                cherrypy.response.status = "400 Stream Key Required"
                result = {"error": "No stream key was specified"}
            else:
                result = self.stream_next(pathcomp[1])

        return json.dumps(result)

    def stream_start(self, url, kwargs):
        directive = tangelo.tool.analyze_url(url)

        if "target" not in directive or directive["target"].get("type") != "service":
            tangelo.log("STREAM", json.dumps(directive, indent=4))
            cherrypy.response.status = "500 Error Opening Streaming Service"
            result = {"error": "could not open streaming service"}
        else:
            # Extract the path to the service and the list of positional
            # arguments.
            module_path = directive["target"]["path"]
            pargs = directive["target"]["pargs"]

            # Get the service module.
            try:
                service = self.modules.get(module_path)
            except tangelo.HTTPStatusCode as e:
                cherrypy.response.status = e.code
                result = {"error": ""}
                if e.msg:
                    result["error"] = e.msg
            else:
                # Check for a "stream" function inside the module.
                if "stream" not in dir(service):
                    cherrypy.response.status = "400 Non-Streaming Service"
                    result = {"error": "The requested streaming service does not implement a 'stream()' function"}
                else:
                    # Call the stream function and capture its result.
                    try:
                        stream = service.stream(*pargs, **kwargs)
                    except Exception as e:
                        bt = traceback.format_exc()

                        tangelo.log("Caught exception while executing service %s" %
                                    (tangelo.request_path()), "SERVICE")
                        tangelo.log(bt, "SERVICE")

                        cherrypy.response.status = "500 Streaming Service Raised Exception"
                        result = {"error": "Caught exception during streaming service execution: %s" % (str(bt))}
                    else:
                        # Generate a key corresponding to this object.
                        key = tangelo.util.generate_key(self.streams)

                        # Log the object in the streaming table.
                        self.streams[key] = stream

                        # Create an object describing the logging of the generator object.
                        result = {"key": key}

        return result

    def stream_next(self, key):
        if key not in self.streams:
            cherrypy.response.status = "404 No Such Key"
            result = {"error": "Key '%s' does not correspond to an active stream" % (key)}
        else:
            # Grab the stream in preparation for running it.
            stream = self.streams[key]

            # Attempt to run the stream via its next() method - if this
            # yields a result, then continue; if the next() method raises
            # StopIteration, then there are no more results to retrieve; if
            # any other exception is raised, this is treated as an error.
            try:
                result = stream.next()
            except StopIteration:
                cherrypy.response.status = "204 Stream Finished"
                result = "OK"
                del self.streams[key]
            except:
                del self.streams[key]
                cherrypy.response.status = "500 Exception Raised By Streaming Service"
                result = {"error": "Caught exception while executing stream service keyed by %s:<br><pre>%s</pre>" % (key, traceback.format_exc())}

        return result

    def DELETE(self, key=None):
        if key is None:
            cherrypy.response.status = "400 Stream Key Required"
            result = {"error": "No stream key was specified"}
        elif key not in self.streams:
            cherrypy.response.status = "404 No Such Stream Key"
            result = {"error": "Key '%s' does not correspond to an active stream" % (key)}
        else:
            del self.streams[key]
            result = {"key": key}

        return json.dumps(result)
