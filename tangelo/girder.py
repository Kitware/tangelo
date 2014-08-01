from __future__ import absolute_import

import cherrypy
import os


class TangeloGirder(object):
    exposed = True

    def __init__(self, host, port):
        # Now import the girder modules.  If this fails, it's up to the
        # administrator to make sure Girder is installed and on the PYTHONPATH.
        import girder.events
        from girder import constants
        from girder.api import api_main
        from girder import constants
        from girder.utility import plugin_utilities, model_importer

        self.root_dir = constants.ROOT_DIR

        api_main.addApiToNode(self)

        cherrypy.engine.subscribe("start", girder.events.daemon.start)
        cherrypy.engine.subscribe("stop", girder.events.daemon.stop)

        plugins = model_importer.ModelImporter().model('setting').get(
            constants.SettingKey.PLUGINS_ENABLED, default=())
        plugin_utilities.loadPlugins(plugins, self, cherrypy.config)

        self.config = {
            "/": {
                "request.dispatch": cherrypy.dispatch.MethodDispatcher(),
                "tools.staticdir.root": self.root_dir
            },
            "/static": {
                "tools.staticdir.on": "True",
                "tools.staticdir.dir": "clients/web/static"
            }
        }

    def GET(self):
        return cherrypy.lib.static.serve_file(
            os.path.join(self.root_dir, "clients", "web", "static",
                         "built", "index.html"), content_type="text/html")
