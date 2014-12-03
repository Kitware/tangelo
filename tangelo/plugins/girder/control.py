from girder.utility.server import configureServer


def setup(config, store):
    config = {"server": {"api_root": "/plugin/girder/girder/api/v1",
                         "static_root": "/plugin/girder/girder/static"}}
    girder_app, config = configureServer(curConfig=config)

    return {"apps": [(girder_app, config, "girder")]}
