import tangelo
import tangelo.util
from tangelo.server import analyze_url
from tangelo.server import Content


def run(*path, **query):
    if len(path) == 0:
        tangelo.http_status(400, "Missing Path")
        return {"error": "missing path to config file"}

    required = query.get("required") is not None

    url = "/" + "/".join(path)
    content = analyze_url(url).content

    if content is None or content.type not in [Content.File, Content.NotFound]:
        tangelo.http_status(400, "Illegal Path")
        return {"error": "illegal web path (path does not point to a config file)"}
    elif content.type == Content.NotFound:
        if required:
            return {"error": "File not found",
                    "file": url}
        else:
            return {"result": {}}

    try:
        config = tangelo.util.yaml_safe_load(content.path, dict)
    except IOError:
        tangelo.http_status(404)
        return {"error": "could not open file at %s" % (url)}
    except TypeError:
        tangelo.http_status(400, "Not An Associative Array")
        return {"error": "file at %s did not contain a top-level associative array" % (url)}
    except ValueError as e:
        tangelo.http_status(400, "YAML Error")
        return {"error": "could not parse YAML from file at %s: %s" % (url, e.message)}

    return {"result": config}
