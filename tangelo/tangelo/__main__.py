#!python

import argparse
import os
import cherrypy
import platform
import signal
import sys
import tangelo.util
import ws4py.server
import yaml

import tangelo
import tangelo.server
import tangelo.util
import tangelo.websocket

tangelo_version = "0.8.0"


class Config(object):
    def __init__(self, filename=None):
        self.access_auth = None
        self.drop_privileges = None
        self.sessions = None
        self.hostname = None
        self.port = None
        self.user = None
        self.group = None
        self.key = None
        self.cert = None
        self.root = None

        if filename is not None:
            self.load(filename)

    def load(self, filename):
        with open(filename) as f:
            d = yaml.safe_load(f.read())

        if not isinstance(d, dict):
            raise TypeError("Config file %s does not contain a top-level associative array")

        self.access_auth = d.get("access-auth")
        self.drop_privileges = d.get("drop-privileges")
        self.sessions = d.get("sessions")
        self.hostname = d.get("hostname")
        self.port = d.get("port")
        self.user = d.get("user")
        self.group = d.get("group")
        self.key = d.get("key")
        self.cert = d.get("cert")
        self.root = d.get("root")


def polite(signum, frame):
    tangelo.log_warning("TANGELO", "Already shutting down.  To force shutdown immediately, send SIGQUIT (Ctrl-\\).")


def die(signum, frame):
    tangelo.log_error("TANGELO", "Received quit signal.  Exiting immediately.")
    os.kill(os.getpid(), signal.SIGKILL)


def shutdown(signum, frame):
    tangelo.log_info("TANGELO", "Received interrupt signal, performing graceful shutdown")

    # Disbale the shutdown handler (i.e., for repeated Ctrl-C etc.) for the
    # "polite" shutdown signals.
    for sig in [signal.SIGINT, signal.SIGTERM]:
        signal.signal(sig, polite)

    # Perform plugin shutdown operations.
    tangelo.log_info("TANGELO", "Shutting down plugins...")
    plugins = cherrypy.config.get("plugins")
    if plugins:
        plugins.unload_all()

    # Perform CherryPy shutdown and exit.
    tangelo.log_info("TANGELO", "Stopping web server")
    cherrypy.engine.stop()
    cherrypy.engine.exit()

    tangelo.log_success("TANGELO", "Be seeing you.")


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
    p.add_argument("--verbose", "-v", action="store_true", help="display extra information as Tangelo starts up")
    p.add_argument("--version", action="store_true", help="display Tangelo version number")
    p.add_argument("--key", type=str, default=None, metavar="FILE", help="the path to the SSL key.  You must also specify --cert to serve content over https.")
    p.add_argument("--cert", type=str, default=None, metavar="FILE", help="the path to the SSL certificate.  You must also specify --key to serve content over https.")
    p.add_argument("--plugin-config", type=str, default=None, metavar="PATH", help="path to plugin configuration file")
    args = p.parse_args()

    # If version flag is present, print the version number and exit.
    if args.version:
        print tangelo_version
        return 0

    # Make sure user didn't specify conflicting flags.
    if args.access_auth and args.no_access_auth:
        tangelo.log_error("ERROR", "can't specify both --access-auth (-a) and --no-access-auth (-na) together")
        return 1

    if args.drop_privileges and args.no_drop_privileges:
        tangelo.log_error("ERROR", "can't specify both --drop-privileges (-p) and --no-drop-privileges (-np) together")
        return 1

    if args.no_sessions and args.sessions:
        tangelo.log_error("ERROR", "can't specify both --sessions (-s) and --no-sessions (-ns) together")
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
        config = Config(cfg_file)
        ok = True
    except (IOError, TypeError) as e:
        tangelo.log_error("TANGELO", "error: %s" % (e))
    except yaml.YAMLError as e:
        tangelo.log_error("TANGELO", "error while parsing config file: %s" % (e))
    finally:
        if not ok:
            return 1

    # Determine whether to use access auth.
    access_auth = True
    if args.access_auth is None and args.no_access_auth is None:
        if config.access_auth is not None:
            access_auth = config.access_auth
    else:
        access_auth = (args.access_auth is not None) or (not args.no_access_auth)

    tangelo.log("TANGELO", "Access authentication %s" % ("enabled" if access_auth else "disabled"))

    # Determine whether to perform privilege drop.
    drop_privileges = True
    if args.drop_privileges is None and args.no_drop_privileges is None:
        if config.drop_privileges is not None:
            drop_privileges = config.drop_privileges
    else:
        drop_privileges = (args.drop_privileges is not None) or (not args.no_drop_privileges)

    # Determine whether to enable sessions.
    sessions = True
    if args.sessions is None and args.no_sessions is None:
        if config.sessions is not None:
            sessions = config.sessions
    else:
        sessions = (args.sessions is not None) or (not args.no_sessions)

    tangelo.log("TANGELO", "Sessions %s" % ("enabled" if sessions else "disabled"))

    # Extract the rest of the arguments, giving priority first to command line
    # arguments, then to the configuration file (if any), and finally to a
    # hard-coded default value.
    hostname = args.hostname or config.hostname or "localhost"
    port = args.port or config.port or 8080
    user = args.user or config.user or "nobody"
    group = args.group or config.group or "nobody"

    tangelo.log("TANGELO", "Hostname: %s" % (hostname))
    tangelo.log("TANGELO", "Port: %d" % (port))

    tangelo.log("TANGELO", "Privilege drop %s" % ("enabled (if necessary)" if drop_privileges else "disabled"))
    if drop_privileges:
        tangelo.log("TANGELO", "\tUser: %s" % (user))
        tangelo.log("TANGELO", "\tGroup: %s" % (group))

    # HTTPS support
    #
    # Grab the ssl key file.
    ssl_key = args.key or config.key
    if ssl_key is not None:
        ssl_key = tangelo.util.expandpath(ssl_key)

    # Grab the cert file.
    ssl_cert = args.cert or config.cert
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
        tangelo.log_error("TANGELO", "error: SSL key or SSL cert missing")
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
    root = args.root or config.root
    if root:
        root = tangelo.util.expandpath(root)
    else:
        default_paths = map(tangelo.util.expandpath, [sys.prefix + "/share/tangelo/web",
                                                      invocation_dir + "/share/tangelo/web",
                                                      "/usr/local/share/tangelo/web"])
        tangelo.log_info("TANGELO", "Looking for default web content path")
        for path in default_paths:
            tangelo.log_info("TANGELO", "Trying %s" % (path))
            if os.path.exists(path):
                root = path
                break

        # TODO(choudhury): by default, should we simply serve from the current
        # directory?  This is how SimpleHTTPServer works, for example.
        if not root:
            tangelo.log_error("TANGELO", "could not find default web root directory")
            return 1

    tangelo.log("TANGELO", "Serving content from %s" % (root))

    # Compute a default plugin configuration if it was not supplied.
    if args.plugin_config is None:
        plugin_cfg_file = None
        default_paths = map(tangelo.util.expandpath, [sys.prefix + "/share/tangelo/plugin/plugin.conf",
                                                      invocation_dir + "/share/tangelo/plugin/plugin.conf",
                                                      "/usr/local/share/tangelo/plugin/plugin.conf"])
        tangelo.log_info("TANGELO", "Looking for default plugin configuration file")
        for path in default_paths:
            tangelo.log_info("TANGELO", "Trying %s" % (path))
            if os.path.exists(path):
                plugin_cfg_file = path
                break
    else:
        plugin_cfg_file = tangelo.util.expandpath(args.plugin_config)

    # Warn if plugin file doesn't exist.
    if plugin_cfg_file is None:
        tangelo.log_warning("TANGELO", "Could not find a default plugin configuration file")
    elif not os.path.exists(plugin_cfg_file):
        tangelo.log_warning("TANGELO", "Plugin configuration file %s does not exist - create it to load plugins at runtime" % (plugin_cfg_file))
    else:
        tangelo.log("TANGELO", "Using plugin configuration file '%s'" % (plugin_cfg_file))

    # Set the web root directory.
    cherrypy.config.update({"webroot": root})

    # Place an empty dict to hold per-module configuration into the global
    # configuration object, and one for persistent per-module storage (the
    # latter can be manipulated by the service).
    cherrypy.config.update({"module-config": {}})
    cherrypy.config.update({"module-store": {}})

    # Analogs of the module storage dicts, but for plugins.
    cherrypy.config.update({"plugin-config": {}})
    cherrypy.config.update({"plugin-store": {}})

    # Create a plugin manager.  It is marked global so that the plugins can be
    # unloaded when Tangelo exits.
    plugins = tangelo.server.Plugins("tangelo.plugin", plugin_cfg_file)
    cherrypy.config.update({"plugins": plugins})

    # Create an instance of the main handler object.
    module_cache = tangelo.util.ModuleCache()
    tangelo_server = tangelo.server.Tangelo(module_cache=module_cache, plugins=plugins)
    rootapp = cherrypy.Application(tangelo_server, "/")

    # Place an AuthUpdate handler in the Tangelo object if access authorization
    # is on.
    tangelo_server.auth_update = tangelo.server.AuthUpdate(app=rootapp)

    # Mount the root application object.
    cherrypy.tree.mount(rootapp, config={"/": {"tools.sessions.on": sessions},
                                         "/favicon.ico": {"tools.staticfile.on": True,
                                                          "tools.staticfile.filename": sys.prefix + "/share/tangelo/tangelo.ico"}})

    # Set up the global configuration.
    try:
        cherrypy.config.update({"environment": "production",
                                "log.screen": True,
                                "server.socket_host": hostname,
                                "server.socket_port": port})
    except IOError as e:
        tangelo.log_error("TANGELO", "problem with config file %s: %s" % (e.filename, e.strerror))
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
                tangelo.log_error("TANGELO", "no such %s '%s' to drop privileges to" % (mode, value))
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
    cherrypy.tools.websocket = ws4py.server.cherrypyserver.WebSocketTool()

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

    # Start the CherryPy engine.
    cherrypy.engine.start()
    tangelo.log_success("TANGELO", "Server is running")
    cherrypy.engine.block()

if __name__ == "__main__":
    sys.exit(main())
