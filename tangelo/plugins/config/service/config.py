import tangelo

import json


def run(*path):
    if len(path) == 0:
        tangelo.http_status(400, "Missing Path")
        return {"error": "missing path to config file"}

    url = "/" + "/".join(path)
    directive = tangelo.tool.analyze_url(url)
    if "target" not in directive or directive["target"].get("type") != "file":
        tangelo.http_status(400, "Illegal Path")
        return {"error": "illegal web path (path does not point to a config file)"}

    try:
        config = tangelo.util.load_service_config(directive["target"]["path"])
    except IOError:
        tangelo.http_status(404)
        return {"error": "could not open file at %s" % (url)}
    except TypeError:
        tangelo.http_status(400, "Not A JSON Object")
        return {"error": "file at %s did not contain a JSON object" % (url)}
    except ValueError as e:
        tangelo.http_status(400, "Not JSON")
        return {"error": "could not parse JSON from file at %s: %s" % (url, e.message)}

    return {"result": config}
