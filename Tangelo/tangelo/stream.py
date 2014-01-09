import json
import traceback

import cherrypy

import tangelo

class TangeloStream(object):
    def __init__(self):
        self.streams = {}

    @cherrypy.expose
    def default(self, key=None):
        # Perform the requested action: GET means to either return a list of
        # stream keys, or to run the keyed stream one step; DELETE means to
        # delete a keyed stream from the registry.
        method = cherrypy.request.method
        if method == "GET":
            if key is None:
                return json.dumps(self.streams.keys())
            elif key not in self.streams:
                return "\"Unknown key\""
            else:
                # Grab the stream in preparation for running it.
                stream = self.streams[key]

                # Construct a result object.
                result = {}
                result["finished"] = False

                # Attempt to run the stream via its next() method - if this yields a
                # result, then continue; if the next() method raises StopIteration,
                # then there are no more results to retrieve; if any other exception
                # is raised, this is treated as an error.
                try:
                    result["data"] = stream.next()
                except StopIteration:
                    result["finished"] = True
                    del self.streams[key]
                except:
                    del self.streams[key]
                    raise cherrypy.HTTPError("501 Error in Python Service",
                            "Caught exception while executing stream service keyed by %s:<br><pre>%s</pre>" % (key, traceback.format_exc()))

                try:
                    return json.dumps(result)
                except TypeError:
                    raise cherrypy.HTTPError("501 Bad Response from Python Service",
                            "The stream keyed by %s returned a non JSON-seriazable result: %s" % (key, result["data"]))

        elif method == "DELETE":
            if key is None:
                return "\"No key specified\""
            elif key not in self.streams:
                return "\"Unknown key\""
            else:
                del self.streams[key]
                return "\"OK\""

    def add(self, stream):
        # Generate a key corresponding to this object.
        key = tangelo.util.generate_key(self.streams)

        # Log the object in the streaming table.
        self.streams[key] = stream

        # Create an object describing the logging of the generator object.
        result = {"stream_key": key}

        # Serialize it to JSON.
        return json.dumps(result)
