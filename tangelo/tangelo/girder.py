from __future__ import absolute_import

import cherrypy
import os

from girder import constants

class TangeloGirder(object):
    exposed = True

    def __init__(self):
        # The girder module expects these cherrypy config options to be set
        # already by the time it's imported.
        cherrypy.config.update({
            "sessions": {"cookie_lifetime": 180},
            "server": {"mode": "development"},
            "database": {
                "host": "localhost",
                "port": 27017,
                "user": "",
                "password": "",
                "database": "girder"
                },
            "users": {
                "email_regex": "^[\w\.\-]*@[\w\.\-]*\.\w+$",
                "login_regex": "^[a-z][\da-z\-]{3}[\da-z\-]*$",
                "login_description": "Login be at least 4 characters, start with a letter, and may only contain letters, numbers, or dashes.",
                "password_regex": ".{6}.*",
                "password_description": "Password must be at least 6 characters."
                },
            "auth": {
                "hash_alg": "bcrypt",
                "bcrypt_rounds": 12
                }
            })

        # Now import the girder modules.  If this fails, it's up to the
        # administrator to make sure Girder is installed and on the PYTHONPATH.
        import girder.events
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

    def GET(self):
        return cherrypy.lib.static.serve_file(
            os.path.join(self.root_dir, "clients", "web", "static",
                         "built", "index.html"), content_type="text/html")
