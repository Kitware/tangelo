#!python

import argparse
import ConfigParser
import errno
import itertools
import os
import cherrypy
import platform
import signal
from twisted.internet import reactor
import sys
import time
import tangelo.util
import tangelo.ws4py.server
import json
import re

import tangelo
from tangelo.minify_json import json_minify
import tangelo.girder
import tangelo.info
import tangelo.server
import tangelo.stream
import tangelo.tool
import tangelo.util
import tangelo.vtkweb
import tangelo.websocket

tangelo_version = "0.7.0-dev"

vtkweb = None


def read_config(cfgfile):
    if cfgfile is None:
        return {}

    def getboolean(section, key):
        try:
            return cfg.getboolean(section, key)
        except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
            return None

    def getint(section, key):
        try:
            return cfg.getint(section, key)
        except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
            return None

    def getstring(section, key):
        try:
            return cfg.get(section, key)
        except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
            return None

    # Read the config file.
    cfg = ConfigParser.RawConfigParser()
    files = cfg.read(cfgfile)

    # Signal error if file could not be read.
    if len(files) == 0:
        raise IOError(2, "Could not open configuration file", cfgfile)

    # Populate a dictionary with the values from the config.
    config = {}
    config["access_auth"] = getboolean("tangelo", "access_auth")
    config["drop_privileges"] = getboolean("tangelo", "drop_privileges")
    config["sessions"] = getboolean("tangelo", "sessions")
    config["hostname"] = getstring("tangelo", "hostname")
    config["port"] = getint("tangelo", "port")
    config["user"] = getstring("tangelo", "user")
    config["group"] = getstring("tangelo", "group")
    config["key"] = getstring("tangelo", "key")
    config["cert"] = getstring("tangelo", "cert")
    config["root"] = getstring("tangelo", "root")

    config["vtkpython"] = getstring("vtkweb", "vtkpython")

    config["girder-host"] = getstring("girder", "girder-host")
    config["girder-port"] = getint("girder", "girder-port")
    config["girder-path"] = getstring("girder", "girder-path")

    return config


def polite(signum, frame):
    tangelo.log("TANGELO", "Already shutting down.  To force shutdown immediately, send SIGQUIT (Ctrl-\\).")


def die(signum, frame):
    tangelo.log("TANGELO", "Received quit signal.  Exiting immediately.")
    os.kill(os.getpid(), signal.SIGKILL)


def shutdown(signum, frame):
    tangelo.log("TANGELO", "Received interrupt signal, performing graceful shutdown")

    # Disbale the shutdown handler (i.e., for repeated Ctrl-C etc.) for the
    # "polite" shutdown signals.
    for sig in [signal.SIGINT, signal.SIGTERM]:
        signal.signal(sig, polite)

    # Perform (1) vtkweb process cleanup, (2) twisted reactor cleanup and quit,
    # (3) CherryPy shutdown, and (4) CherryPy exit.
    if vtkweb:
        tangelo.log("TANGELO", "Shutting down VTKWeb processes")
        vtkweb.shutdown_all()

    tangelo.log("TANGELO", "Stopping thread reactor")
    reactor.stop()

    tangelo.log("TANGELO", "Stopping web server")
    cherrypy.engine.stop()
    cherrypy.engine.exit()

    tangelo.log("TANGELO", "Be seeing you.")


def main():
    p = argparse.ArgumentParser(description="Start a Tangelo server.")
    p.add_argument("-c", "--config", type=str, default=None, metavar="FILE", help="specifies configuration file to use")
    p.add_argument("-a", "--access-auth", action="store_const", const=True, default=None, help="enable HTTP authentication (i.e. processing of .htaccess files) (default)")
    p.add_argument("-na", "--no-access-auth", action="store_const", const=True, default=None, help="disable HTTP authentication (i.e. processing of .htaccess files)")
    p.add_argument("-p", "--drop-privileges", action="store_const", const=True, default=None, help="enable privilege drop when started as superuser (default)")
    p.add_argument("-np", "--no-drop-privileges", action="store_const", const=True, default=None, help="disable privilege drop when started as superuser")
    p.add_argument("-s", "--sessions", action="store_const", const=True, default=None, help="enable session tracking (default)")
    p.add_argument("-ns", "--no-sessions", action="store_const", const=True, default=None, help="edisable session tracking")
    p.add_argument("--hostname", type=str, default=None, metavar="HOSTNAME", help="overrides configured hostname on which to run Tangelo")
    p.add_argument("--port", type=int, default=None, metavar="PORT", help="overrides configured port number on which to run Tangelo")
    p.add_argument("-u", "--user", type=str, default=None, metavar="USERNAME", help="specifies the user to run as when root privileges are dropped")
    p.add_argument("-g", "--group", type=str, default=None, metavar="GROUPNAME", help="specifies the group to run as when root privileges are dropped")
    p.add_argument("-r", "--root", type=str, default=None, metavar="DIR", help="the directory from which Tangelo will serve content")
    p.add_argument("--vtkpython", type=str, default=None, metavar="FILE", help="the vtkpython executable, for use with the vtkweb service (default: \"vtkpython\")")
    p.add_argument("--verbose", "-v", action="store_true", help="display extra information as Tangelo starts up")
    p.add_argument("--version", action="store_true", help="display Tangelo version number")
    p.add_argument("--key", type=str, default=None, metavar="FILE", help="the path to the SSL key.  You must also specify --cert to serve content over https.")
    p.add_argument("--cert", type=str, default=None, metavar="FILE", help="the path to the SSL certificate.  You must also specify --key to serve content over https.")
    p.add_argument("--girder-host", type=str, default=None, metavar="HOST", help="the hostname running Girder")
    p.add_argument("--girder-port", type=int, default=None, metavar="PORT", help="the port on which Girder is running")
    p.add_argument("--girder-path", type=str, default=None, metavar="PATH", help="the path on which to mount a Girder API")
    args = p.parse_args()

    # If version flag is present, print the version number and exit.
    if args.version:
        print tangelo_version
        return 0

    # Make sure user didn't specify conflicting flags.
    if args.access_auth and args.no_access_auth:
        tangelo.log("ERROR", "can't specify both --access-auth (-a) and --no-access-auth (-na) together")
        return 1

    if args.drop_privileges and args.no_drop_privileges:
        tangelo.log("ERROR", "can't specify both --drop-privileges (-p) and --no-drop-privileges (-np) together")
        return 1

    if args.no_sessions and args.sessions:
        tangelo.log("ERROR", "can't specify both --sessions (-s) and --no-sessions (-ns) together")
        sys.exit(1)

    # Figure out where this is being called from - that will be useful for a
    # couple of purposes.
    invocation_dir = os.path.abspath(os.path.dirname(os.path.abspath(__file__)) + "/..")

    # Before extracting the other arguments, compute a configuration dictionary.
    # If --no-config was specified, this will be the empty dictionary;
    # otherwise, check the command line arguments for a config file first, then
    # look for one in a sequence of other places.
    config = {}
    cfg_file = args.config
    if cfg_file is None:
        tangelo.log("TANGELO", "No configuration file specified - using command line args and defaults")
    else:
        cfg_file = tangelo.util.expandpath(cfg_file)
        tangelo.log("TANGELO", "Using configuration file %s" % (cfg_file))

    # Get a dict representing the contents of the config file.
    try:
        ok = False
        config = read_config(cfg_file)
        ok = True
    except IOError as e:
        tangelo.log("ERROR", "%s" % (e))
    except ConfigParser.MissingSectionHeaderError:
        tangelo.log("ERROR", "Config file '%s' has no section headers" % (cfg_file))
    except ConfigParser.ParsingError as e:
        tangelo.log("ERROR", "Config file '%s' has syntax errors:" % (cfg_file))
        for lineno, text in e.errors:
            tangelo.log("ERROR", "\tline %d: %s" % (lineno, text))
    finally:
        if not ok:
            return 1

    # Determine whether to use access auth.
    access_auth = True
    if args.access_auth is None and args.no_access_auth is None:
        if config.get("access_auth") is not None:
            access_auth = config.get("access_auth")
    else:
        access_auth = (args.access_auth is not None) or (not args.no_access_auth)

    tangelo.log("TANGELO", "Access authentication %s" % ("enabled" if access_auth else "disabled"))

    # Determine whether to perform privilege drop.
    drop_privileges = True
    if args.drop_privileges is None and args.no_drop_privileges is None:
        if config.get("drop_privileges") is not None:
            drop_privileges = config.get("drop_privileges")
    else:
        drop_privileges = (args.drop_privileges is not None) or (not args.no_drop_privileges)

    # Determine whether to enable sessions.
    sessions = True
    if args.sessions is None and args.no_sessions is None:
        if config.get("sessions") is not None:
            sessions = config.get("sessions")
    else:
        sessions = (args.sessions is not None) or (not args.no_sessions)

    tangelo.log("TANGELO", "Sessions %s" % ("enabled" if sessions else "disabled"))

    # Extract the rest of the arguments, giving priority first to command line
    # arguments, then to the configuration file (if any), and finally to a
    # hard-coded default value.
    hostname = args.hostname or config.get("hostname") or "localhost"
    port = args.port or config.get("port") or 8080
    user = args.user or config.get("user") or "nobody"
    group = args.group or config.get("group") or "nobody"

    tangelo.log("TANGELO", "Hostname: %s" % (hostname))
    tangelo.log("TANGELO", "Port: %d" % (port))

    tangelo.log("TANGELO", "Privilege drop %s" % ("enabled (if necessary)" if drop_privileges else "disabled"))
    if drop_privileges:
        tangelo.log("TANGELO", "\tUser: %s" % (user))
        tangelo.log("TANGELO", "\tGroup: %s" % (group))

    # Extract the vtkpython executable option, if given.
    vtkpython = args.vtkpython or config.get("vtkpython")
    if vtkpython is not None:
        vtkpython = tangelo.util.expandpath(vtkpython)
        tangelo.log("TANGELO", "VTKWeb support enabled")
        tangelo.log("TANGELO", "\tvtkpython found at path %s" % (vtkpython))
    else:
        tangelo.log("TANGELO", "VTKWeb support disabled")

    # Girder options.  If no girder path is specified, we take this to mean we
    # should NOT mount a Girder API.
    girderconf = {}
    girderconf["host"] = args.girder_host or config.get("girder-host") or "localhost"
    girderconf["port"] = args.girder_port or config.get("girder-port") or 27017
    girderconf["path"] = args.girder_path or config.get("girder-path")

    if girderconf["path"] is not None:
        tangelo.log("TANGELO", "Girder support enabled")
        tangelo.log("TANGELO", "\tHost: %s" % (girderconf["host"]))
        tangelo.log("TANGELO", "\tPort: %s" % (girderconf["port"]))
        tangelo.log("TANGELO", "\tWeb path: %s" % (girderconf["path"]))
    else:
        tangelo.log("TANGELO", "Girder support disabled")

    # HTTPS support
    #
    # Grab the ssl key file.
    ssl_key = args.key or config.get("key")
    if ssl_key is not None:
        ssl_key = tangelo.util.expandpath(ssl_key)

    # Grab the cert file.
    ssl_cert = args.cert or config.get("cert")
    if ssl_cert is not None:
        ssl_cert = tangelo.util.expandpath(ssl_cert)

    # In order to enable HTTPS, *both* the key and cert must be specified.  If
    # only one or the other is specified, this is considered an error, because
    # we don't want to serve what the user is considering sensitive content over
    # HTTP by default.
    if ssl_key is not None and ssl_cert is not None:
        cherrypy.config.update({"server.ssl_module": "pyopenssl",
                                "server.ssl_certificate": ssl_cert,
                                "server.ssl_private_key": ssl_key})
        tangelo.log("TANGELO", "HTTPS enabled")
        tangelo.log("TANGELO", "\tSSL Cert file: %s" % (ssl_cert))
        tangelo.log("TANGELO", "\tSSL Key file: %s" % (ssl_key))
    elif not (ssl_key is None and ssl_cert is None):
        tangelo.log("ERROR", "error: SSL key or SSL cert missing")
        return 1
    else:
        tangelo.log("TANGELO", "HTTPS disabled")

    # We need a web root - use the installed example web directory as a
    # fallback.  This might be found in a few different places, so try them one
    # by one until we find one that exists.
    #
    # TODO(choudhury): shouldn't we *only* check the invocation_dir option?  We
    # shouldn't pick up a stray web directory that happens to be found in /usr
    # if we're invoking tangelo from a totally different location.
    root = args.root or config.get("root")
    if root:
        root = tangelo.util.expandpath(root)
    else:
        default_paths = map(tangelo.util.expandpath, [sys.prefix + "/share/tangelo/www", invocation_dir + "/share/tangelo/www"])
        tangelo.log("TANGELO", "Looking for default web content path")
        for path in default_paths:
            tangelo.log("TANGELO", "Trying %s" % (path))
            if os.path.exists(path):
                root = path
                break

        # TODO(choudhury): by default, should we simply serve from the current
        # directory?  This is how SimpleHTTPServer works, for example.
        if not root:
            tangelo.log("ERROR", "could not find default web root directory")
            return 1

    tangelo.log("TANGELO", "Serving content from %s" % (root))

    # Set the web root directory.
    cherrypy.config.update({"webroot": root})

    # Set up the API path.
    cherrypy.config.update({"apiroot": "/api"})
    apiroot = cherrypy.config["apiroot"]

    # Place an empty dict to hold per-module configuration into the global
    # configuration object.
    cherrypy.config.update({"module-config": {}})

    # Create an instance of the main handler object.
    module_cache = tangelo.util.ModuleCache()
    rootapp = cherrypy.Application(tangelo.server.Tangelo(module_cache=module_cache), "/")

    # Create an info API object.
    info = tangelo.info.TangeloInfo(version=tangelo_version)
    cherrypy.tree.mount(info, apiroot + "/info", config={"/": {"request.dispatch": cherrypy.dispatch.MethodDispatcher()}})

    # Create a streaming API object.
    stream = tangelo.stream.TangeloStream(module_cache=module_cache)
    cherrypy.tree.mount(stream, apiroot + "/stream", config={"/": {"request.dispatch": cherrypy.dispatch.MethodDispatcher()}})

    # Create a VTKWeb API object if requested, and mount it.
    vtkweb = None
    if vtkpython is not None:
        vtkweb = tangelo.vtkweb.TangeloVtkweb(vtkpython=vtkpython, weblauncher=invocation_dir + "/bin/vtkweb-launcher.py")
        cherrypy.tree.mount(vtkweb, apiroot + "/vtkweb")

    # Create a Girder API object if requested, and mount it at the requested
    # path.
    girder = None
    if girderconf["path"]:
        girder = tangelo.girder.TangeloGirder(girderconf["host"], girderconf["port"])
        cherrypy.tree.mount(girder, apiroot + "/" + girderconf["path"], girder.config)

    # Mount the root application object.
    cherrypy.tree.mount(rootapp, config={"/": {"tools.auth_update.on": access_auth,
                                               "tools.treat_url.on": True,
                                               "tools.sessions.on": sessions},
                                         "/favicon.ico": {"tools.staticfile.on": True,
                                                          "tools.staticfile.filename": sys.prefix + "/share/tangelo/tangelo.ico"}})

    # Set up the global configuration.
    try:
        cherrypy.config.update({"environment": "production",
                                "log.screen": True,
                                "server.socket_host": hostname,
                                "server.socket_port": port,
                                "error_page.default": tangelo.server.Tangelo.error_page})
    except IOError as e:
        tangelo.log("ERROR", "problem with config file %s: %s" % (e.filename, e.strerror))
        return 1

    # Try to drop privileges if requested, since we've bound to whatever port
    # superuser privileges were needed for already.
    if drop_privileges:
        # If we're on windows, don't supply any username/groupname, and just
        # assume we should drop priveleges.
        if platform.system() == "Windows":
            tangelo.log("TANGELO", "Performing privilege drop")
            cherrypy.process.plugins.DropPrivileges(cherrypy.engine).subscribe()
        elif os.getuid() == 0:
            tangelo.log("TANGELO", "Performing privilege drop")

            # Reaching here means we're on unix, and we are the root user, so go
            # ahead and drop privileges to the requested user/group.
            import grp
            import pwd

            # On some systems, negative uids and gids are allowed.  These can
            # render in Python (in particular, on OS X) as very large unsigned
            # values.  This function first checks to see if the input value is
            # already negative; if so, there's no issue and we return it
            # unchanged.  Otherwise, we treat the argument as a bit
            # representation of a *signed* value, check the sign bit to see if
            # it *should* be a negative number, and then perform the proper
            # arithmetic to turn it into a signed one.
            def to_signed(val):
                # If we already see a negative number, just return it.
                if val < 0:
                    return val

                # Check sign bit, and subtract the unsigned range from the value
                # if it is set.
                return val - 0x100000000 if val & 0x80000000 else val

            # Find the UID and GID for the requested user and group.
            try:
                mode = "user"
                value = user
                uid = to_signed(pwd.getpwnam(user).pw_uid)

                mode = "group"
                value = group
                gid = to_signed(grp.getgrnam(group).gr_gid)
            except KeyError:
                tangelo.log("ERROR", "no such %s '%s' to drop privileges to" % (mode, value))
                return 1

            # Set the process home directory to be the dropped-down user's.
            os.environ["HOME"] = os.path.expanduser("~%s" % (user))

            # Perform the actual UID/GID change.
            cherrypy.process.plugins.DropPrivileges(cherrypy.engine, uid=uid, gid=gid).subscribe()
        else:
            tangelo.log("TANGELO", "Not performing privilege drop (because not running as superuser)")

    # Set up websocket handling.  Use the pass-through subclassed version of the
    # plugin so we can set a priority on it that doesn't conflict with privilege
    # drop.
    tangelo.websocket.WebSocketLowPriorityPlugin(cherrypy.engine).subscribe()
    cherrypy.tools.websocket = tangelo.ws4py.server.cherrypyserver.WebSocketTool()

    # Replace the stock auth_digest and auth_basic tools with ones that have
    # slightly lower priority (so the AuthUpdate tool can run before them).
    cherrypy.tools.auth_basic = cherrypy.Tool("before_handler", cherrypy.lib.auth_basic.basic_auth, priority=2)
    cherrypy.tools.auth_digest = cherrypy.Tool("before_handler", cherrypy.lib.auth_digest.digest_auth, priority=2)

    # Install signal handlers to allow for proper cleanup/shutdown.
    for sig in [signal.SIGINT, signal.SIGTERM]:
        signal.signal(sig, shutdown)

    # Send SIGQUIT to an immediate, ungraceful shutdown instead.
    if platform.system() != "Windows":
        signal.signal(signal.SIGQUIT, die)

    # Install the "treat_url" tool, which performs redirections and analyzes the
    # request path to see what kind of resource is being requested, and the
    # "auth update" tool, which checks for updated/new/deleted .htaccess files
    # and updates the state of auth tools on various paths.
    cherrypy.tools.treat_url = cherrypy.Tool("before_handler", tangelo.tool.treat_url, priority=0)
    if access_auth:
        cherrypy.tools.auth_update = tangelo.tool.AuthUpdate(point="before_handler", priority=1, app=rootapp)

    # Start the CherryPy engine.
    cherrypy.engine.start()

    # Start the Twisted reactor in the main thread (it will block but the
    # CherryPy engine has already started in a non-blocking manner).
    reactor.run(installSignalHandlers=False)
    cherrypy.engine.block()

if __name__ == "__main__":
    sys.exit(main())