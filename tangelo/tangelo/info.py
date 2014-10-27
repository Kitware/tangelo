import cherrypy
import json

import tangelo


class TangeloInfo(object):
    exposed = True
    allowed = ["version"]

    def __init__(self, version=None):
        self.version = version

    def GET(self, attr=None, pretty=None):
        tangelo.content_type("application/json")
        if attr is None:
            if pretty is None:
                result = json.dumps(self.all_attr())
            else:
                result = json.dumps(self.all_attr(), indent=4, separators=(",", ": "))
        elif attr in TangeloInfo.allowed:
            tangelo.content_type("text/plain")
            result = self.__dict__[attr]
        else:
            cherrypy.response.status = "400 Illegal Attribute"
            result = json.dumps({"error": "'%s' is not a legal information attribute" % (attr)})

        return result

    def all_attr(self):
        return {attr: self.__dict__[attr] for attr in TangeloInfo.allowed}
