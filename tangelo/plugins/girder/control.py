import cherrypy
import os


def setup(config, store):
    from girder.utility.server import setup_helper

    config = {"server": {"api_root": "/plugin/girder/girder/api/v1",
                         "static_root": "/plugin/girder/girder/static"}}
    girder_app, config = setup_helper(cur_config=config)

    return {"apps": [(girder_app, config, "girder")]}


def setup2(config, store):
    import girder.events
    from girder import constants
    from girder import constants
    from girder.utility import plugin_utilities, model_importer, config, webroot

    # TODO: replace host and port args with values from plugin config.

    cur_static_root = constants.ROOT_DIR
    if not os.path.exists(os.path.join(cur_static_root, "clients")):
        cur_static_root = constants.PACKAGE_DIR

    appconf = {
        '/': {
            'request.dispatch': cherrypy.dispatch.MethodDispatcher(),
            'tools.staticdir.root': cur_static_root,
            'request.methods_with_bodies': ('POST', 'PUT', 'PATCH')
        },
        '/static': {
            'tools.staticdir.on': 'True',
            'tools.staticdir.dir': '%s/clients/web/static' % (cur_static_root)
        }
    }

    from girder.api import api_main

    root = webroot.Webroot()
    api_main.addApiToNode(root)

    cherrypy.engine.subscribe("start", girder.events.daemon.start)
    cherrypy.engine.subscribe("stop", girder.events.daemon.stop)

    settings = model_importer.ModelImporter().model("setting")
    plugins = settings.get(constants.SettingKey.PLUGINS_ENABLED, default=())

    root.updateHtmlVars({
        "apiRoot": "/plugin/girder/girder/api/v1",
        "staticRoot": "/plugin/girder/girder/static"
    })

    root.api.v1.updateHtmlVars({
        "staticRoot": "/plugin/girder/girder/static"
    })

    # TODO: figure out how to load plugins without trashing the root config
    # object.
    #
    root, appconf, _ = plugin_utilities.loadPlugins(plugins, root, appconf, root.api.v1, cur_config={})

    return {"apps": [(root, appconf, "girder")]}
