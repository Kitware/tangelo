import tangelo
import tangelo.util

# Useful aliases for this service's necessary persistent data.
store = tangelo.store()
websockets = store["websockets"] = set()
modules = store["modules"] = tangelo.util.ModuleCache()


@tangelo.restful
def post(*args, **query):
    if len(pathcomp) == 0:
        tangelo.http_status(400, "Path To Service Required")
        return {"error": "No service path was specified"}

    return mount_websocket("/" + "/".join(args), query)


@tangelo.restful
def delete(key=None):
    if key is None:
        tangelo.http_status(400, "Websocket Key Required")
        return {"error": "No websocket key was specified"}
    elif key not in streams:
        tangelo.http_status(404, "No Such Websocket Key")
        return {"error": "Key '%s' does not correspond to an active websocket" % (key)}
    else:
        tangelo.unmount_websocket(key)
        websockets.remove(key)
        return {"key": key}


def launch_websocket(url, kwargs):
    directive = tangelo.tool.analyze_url(url)

    if "target" not in directive or directive["target"].get("type") != "service":
        tangelo.log("WEBSOCKET", json.dumps(directive, indent=4))
        tangelo.http_status(500, "Error Opening Websocket Service")
        return {"error": "could not open websocket service"}
    else:
        # Extract the path to the service and the list of positional
        # arguments.
        module_path = directive["target"]["path"]
        pargs = directive["target"]["pargs"]

        # Get the service module.
        try:
            service = modules.get(module_path)
        except tangelo.HTTPStatusCode as e:
            tangelo.http_status(e.code)
            return {"error": e.msg or ""}
        else:
            # Check for a "WebSocket" class or function inside the module.
            if "WebSocket" not in dir(service):
                tangelo.http_status(400, "Non-Websocket Service")
                return {"error": "The requested websocket service does not implement a 'WebSocket' class or function"}
            else:
                # If "WebSocket" is a function, call it; otherwise, use its
                # value directly.
                if isinstance(service.WebSocket, types.FunctionType):
                    try:
                        cls = service.WebSocket(*pargs, **query)
                    except:
                        bt = traceback.format_exc()

                        tangelo.log("Caught exception while executing service %s" %
                                    (tangelo.request_path()), "SERVICE")
                        tangelo.log(bt, "SERVICE")

                        tangelo.http_status(500, "Streaming Service Raised Exception")
                        return {"error": "Caught exception during streaming service execution: %s" % (str(bt))}
                else:
                    cls = service.WebSocket

                # In both cases, the value should be a subclass of the ws4py
                # WebSocket class.
                if not issubclass(cls, ws4py.websocket.WebSocket):
                    tangelo.http_status(400, "Bad Type In Websocket Service")
                    return {"error": "The WebSocket class specified is not a subclass of ws4py.websocket.WebSocket"}

                # Generate a key for the new websocket.
                key = tangelo.util.generate_key(websockets)

                # Initialize the websocket.
                url = tangelo.mount_websocket(key, cls)

                # Log the object in the websocket set.
                websockets.add(key)

                # Send the key back to the user, along with a websocket URL.
                return {"key": key,
                        "url": url}
