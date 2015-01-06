import tangelo
from tangelo.server import Content
import tangelo.util

# Useful aliases for this service's necessary persistent data.
store = tangelo.store()
streams = store["streams"] = {}
modules = store["modules"] = tangelo.util.ModuleCache()


@tangelo.restful
def get(key=None):
    return get_streams() if key is None else get_stream_info(key)


@tangelo.restful
def post(*pathcomp, **kwargs):
    if len(pathcomp) == 0:
        # TODO: raise error condition
        pass

    action = pathcomp[0]
    args = pathcomp[1:]

    if action == "start":
        if len(args) == 0:
            tangelo.http_status(400, "Path To Service Required")
            return {"error": "No service path was specified"}

        return stream_start("/" + "/".join(args), kwargs)
    elif action == "next":
        if len(args) != 1:
            tangelo.http_status(400, "Stream Key Required")
            return {"error": "No stream key was specified"}

        return stream_next(args[0])
    else:
        tangelo.http_status(400, "Illegal POST action")
        return {"error": "Illegal POST action '%s'" % (action)}


@tangelo.restful
def delete(key=None):
    if key is None:
        tangelo.http_status(400, "Stream Key Required")
        return {"error": "No stream key was specified"}
    elif key not in streams:
        tangelo.http_status(404, "No Such Stream Key")
        return {"error": "Key '%s' does not correspond to an active stream" % (key)}
    else:
        del streams[key]
        return {"key": key}


def get_streams():
    return streams.keys()


def get_stream_info(key):
    tangelo.http_status(501)
    return {"error": "stream info method currently unimplemented"}


def stream_start(url, kwargs):
    content = tangelo.server.analyze_url(url).content

    if content is None or content.type != Content.Service:
        tangelo.http_status(500, "Error Opening Streaming Service")
        return {"error": "could not open streaming service"}
    else:
        # Extract the path to the service and the list of positional
        # arguments.
        module_path = content.path
        pargs = content.pargs

        # Get the service module.
        try:
            service = modules.get(module_path)
        except:
            tangelo.http_status(501, "Error Importing Streaming Service")
            tangelo.content_type("application/json")
            return tangelo.util.traceback_report(error="Could not import module %s" % (module_path))
        else:
            # Check for a "stream" function inside the module.
            if "stream" not in dir(service):
                tangelo.http_status(400, "Non-Streaming Service")
                return {"error": "The requested streaming service does not implement a 'stream()' function"}
            else:
                # Call the stream function and capture its result.
                try:
                    stream = service.stream(*pargs, **kwargs)
                except Exception:
                    result = tangelo.util.traceback_report(error="Caught exception during streaming service execution",
                                                           module=tangelo.request_path())

                    tangelo.log_warning("STREAM", "Could not execute service %s:\n%s" % (tangelo.request_path(), "\n".join(result["traceback"])))

                    tangelo.http_status(500, "Streaming Service Raised Exception")
                    tangelo.content_type("application/json")
                    return result
                else:
                    # Generate a key corresponding to this object.
                    key = tangelo.util.generate_key(streams)

                    # Log the object in the streaming table.
                    streams[key] = stream

                    # Create an object describing the logging of the generator object.
                    return {"key": key}


def stream_next(key):
    if key not in streams:
        tangelo.http_status(404, "No Such Key")
        return {"error": "Stream key does not correspond to an active stream",
                "stream": key}
    else:
        # Grab the stream in preparation for running it.
        stream = streams[key]

        # Attempt to run the stream via its next() method - if this
        # yields a result, then continue; if the next() method raises
        # StopIteration, then there are no more results to retrieve; if
        # any other exception is raised, this is treated as an error.
        try:
            return stream.next()
        except StopIteration:
            del streams[key]

            tangelo.http_status(204, "Stream Finished")
            return "OK"
        except:
            del streams[key]
            tangelo.http_status(500, "Streaming Service Exception")
            tangelo.content_type("application/json")
            return tangelo.util.traceback_report(error="Caught exception while executing stream service", stream=key)
