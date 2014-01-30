import tangelo

import json

def run(path=""):
    if len(path) == 0:
        return {"error": "missing required argument 'path'"}

    if path[0] not in ["/", "~"]:
        return {"error": "path must refer to an absolute web path"}

    path = tangelo.abspath(path)

    try:
        with open(path) as f:
            spec = json.loads(f.read())
    except (OSError, IOError):
        return {"status": "could not open file",
                "result": {}}
    except ValueError as e:
        return {"error": "could not parse JSON - %s" % (e.message)}

    return {"status": "OK",
            "result": spec}
