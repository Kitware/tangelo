import cherrypy
import json

import tangelo


class TangeloInfo(object):
    exposed = True
    general = ["version", "cmdline"]
    attrs = ["config_file",
             "hostname",
             "port",
             "webroot",
             "drop_privileges",
             "group",
             "user",
             "access_auth",
             "sessions",
             "ssl_key",
             "ssl_cert",
             "vtkpython",
             "girderconf"]
    allowed = general + attrs

    def __init__(self, version=None, cmdline=None, settings=None):
        self.version = version
        self.cmdline = cmdline

        for attr in TangeloInfo.attrs:
            self.__dict__[attr] = settings[attr]

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

            if attr == "girderconf":
                tangelo.content_type("application/json")
                result = json.dumps(result)
        else:
            cherrypy.response.status = "400 Illegal Attribute"
            result = json.dumps({"error": "'%s' is not a legal information attribute" % (attr)})

        return result

    def all_attr(self):
        return {attr: self.__dict__[attr] for attr in TangeloInfo.allowed}
