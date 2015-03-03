#!python

import argparse
import os
import cherrypy
import platform
import signal
import sys
import types
import ws4py.server

import tangelo
import tangelo.server
import tangelo.util
import tangelo.websocket

tangelo_version = "0.9.0"


def tangelo_pkgdata():
    print get_pkgdata_dir()
    return 0


def tangelo_passwd():
    import argparse
    import getpass
    import md5
    import sys

    # Parse arguments.
    p = argparse.ArgumentParser(description="Edit .htaccess files for Tangelo")
    p.add_argument("-c", "--create", action="store_true", help="Create new password file")
    p.add_argument("passwordfile", metavar="passwordfile", type=str, nargs=1, help="Password file")
    p.add_argument("realm", metavar="realm", type=str, nargs=1, help="Authentication realm")
    p.add_argument("user", metavar="user", type=str, nargs=1, help="Username")

    args = p.parse_args()

    # Capture argument values.
    create = args.create
    passwordfile = args.passwordfile[0]
    realm = args.realm[0]
    user = args.user[0]

    # Open the password file and read in the contents.
    try:
        with open(passwordfile) as f:
            pws = map(lambda x: x.strip().split(":"), f.readlines())
    except IOError:
        create = True
        pws = []

    # Find the record matching the user.
    userrec = filter(lambda x: x[1][0] == user and x[1][1] == realm, enumerate(pws))

    n = len(userrec)
    if n > 1:
        print >>sys.stderr, "warning: user '%s' for realm '%s' occurs %d times... using only first occurrence"

    # Get the first element of userrec, if there is one.
    if userrec == []:
        # If there was no matching record, make up a dummy one.
        userrec = [None, [user, realm, None]]
    else:
        userrec = list(userrec[0])

    # Get a password and confirmation from the user.
    password = getpass.getpass("Enter password for %s@%s: " % (user, realm))
    confirm = getpass.getpass("Re-enter password: ")

    if password != confirm:
        print >>sys.stderr, "Passwords do not match, aborting."
        return 1

    # Install the md5 hash in the "password" slot of the updating record.
    userrec[1][2] = md5.md5("%s:%s:%s" % (user, realm, password)).hexdigest()

    # If requested to "create" a new password file, delete the pws array, and
    # arrange for the userrec to be appended to the pws array, rather than updating
    # some indexed entry of it (with the signal index of -1).
    if create:
        pws = [userrec[1]]
    else:
        if userrec[0] is None:
            pws.append(userrec[1])
        else:
            pws[userrec[0]] = userrec[1]

    try:
        with open(passwordfile, "w") as f:
            f.writelines(map(lambda x: ":".join(x) + "\n", pws))
    except IOError:
        print >>sys.stderr, "error: could not open file '%s' for writing!" % (passwordfile)
        return 1

    return 0


class Config(object):
    options = {"access_auth": [bool],
               "drop_privileges": [bool],
               "sessions": [bool],
               "list_dir": [bool],
               "show_py": [bool],
               "hostname": types.StringTypes,
               "port": [int],
               "user": types.StringTypes,
               "group": types.StringTypes,
               "key": types.StringTypes,
               "cert": types.StringTypes,
               "root": types.StringTypes,
               "plugins": [list]}

    def __init__(self, filename):
        for option in Config.options:
            self.__dict__[option] = None

        self.errors = []

        if filename is not None:
            self.load(filename)

    def load(self, filename):
        try:
            d = tangelo.util.yaml_safe_load(filename, dict)
        except TypeError:
            self.errors.append("config file does not contain associative array at top level")
            return

        for option, setting in d.iteritems():
            uscore = option.replace("-", "_")
            if uscore not in Config.options:
                self.errors.append("unknown option %s" % (option))
            else:
                self.__dict__[uscore] = setting

    def type_check_value(self, option, valid_types):
        value = self.__dict__.get(option)
        if value is not None and not any(isinstance(value, t) for t in valid_types):
            self.errors.append("option %s must be of type %s" % (option, " or ".join([t.__name__ for t in valid_types])))

    def type_check(self):
        for option, valid_types in Config.options.iteritems():
            self.type_check_value(option, valid_types)

        return len(self.errors) == 0


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


def get_pkgdata_dir():
    return os.path.dirname(__file__)


def get_web_directory():
    return os.path.join(get_pkgdata_dir(), "pkgdata/web")


def get_bundled_plugin_directory():
    return os.path.join(get_pkgdata_dir(), "pkgdata/plugin")


def get_tangelo_ico():
    return os.path.join(get_pkgdata_dir(), "pkgdata/tangelo.ico")


def main():
    p = argparse.ArgumentParser(description="Start a Tangelo server.")
    p.add_argument("-c", "--config", type=str, default=None, metavar="FILE", help="specifies configuration file to use")
    p.add_argument("-a", "--access-auth", action="store_const", const=True, default=None, help="enable HTTP authentication (i.e. processing of .htaccess files) (default)")
    p.add_argument("-na", "--no-access-auth", action="store_const", const=True, default=None, help="disable HTTP authentication (i.e. processing of .htaccess files)")
    p.add_argument("-p", "--drop-privileges", action="store_const", const=True, default=None, help="enable privilege drop when started as superuser (default)")
    p.add_argument("-np", "--no-drop-privileges", action="store_const", const=True, default=None, help="disable privilege drop when started as superuser")
    p.add_argument("-s", "--sessions", action="store_const", const=True, default=None, help="enable session tracking (default)")
    p.add_argument("-ns", "--no-sessions", action="store_const", const=True, default=None, help="disable session tracking")
    p.add_argument("--list-dir", action="store_true", default=None, help="enable directory content serving")
    p.add_argument("--no-list-dir", action="store_true", default=None, help="disable directory content serving (default)")
    p.add_argument("--show-py", action="store_true", default=None, help="enable Python service source code serving")
    p.add_argument("--no-show-py", action="store_true", default=None, help="disable Python service source code serving (default)")
    p.add_argument("--hostname", type=str, default=None, metavar="HOSTNAME", help="overrides configured hostname on which to run Tangelo")
    p.add_argument("--port", type=int, default=None, metavar="PORT", help="overrides configured port number on which to run Tangelo")
    p.add_argument("-u", "--user", type=str, default=None, metavar="USERNAME", help="specifies the user to run as when root privileges are dropped")
    p.add_argument("-g", "--group", type=str, default=None, metavar="GROUPNAME", help="specifies the group to run as when root privileges are dropped")
    p.add_argument("-r", "--root", type=str, default=None, metavar="DIR", help="the directory from which Tangelo will serve content")
    p.add_argument("--verbose", "-v", action="store_true", help="display extra information as Tangelo starts up")
    p.add_argument("--version", action="store_true", help="display Tangelo version number")
    p.add_argument("--key", type=str, default=None, metavar="FILE", help="the path to the SSL key.  You must also specify --cert to serve content over https.")
    p.add_argument("--cert", type=str, default=None, metavar="FILE", help="the path to the SSL certificate.  You must also specify --key to serve content over https.")
    p.add_argument("--examples", action="store_true", default=None, help="Serve the Tangelo example applications")
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
        return 1

    if args.examples and args.root:
        tangelo.log_error("ERROR", "can't specify both --examples and --root (-r) together")
        return 1

    if args.examples and args.config:
        tangelo.log_error("ERROR", "can't specify both --examples and --config (-c) together")
        return 1

    if args.no_list_dir and args.list_dir:
        tangelo.log_error("ERROR", "can't specify both --list-dir and --no-list-dir together")
        sys.exit(1)

    if args.no_show_py and args.show_py:
        tangelo.log_error("ERROR", "can't specify both --show-py and --no-show-py together")
        sys.exit(1)

    # Decide if we have a configuration file or not.
    cfg_file = args.config
    if cfg_file is None:
        tangelo.log("TANGELO", "No configuration file specified - using command line args and defaults")
    else:
        cfg_file = tangelo.util.expandpath(cfg_file)
        tangelo.log("TANGELO", "Using configuration file %s" % (cfg_file))

    # Parse the config file; report errors if any.
    try:
        config = Config(cfg_file)
    except (IOError, ValueError) as e:
        tangelo.log_error("ERROR", e)
        return 1

    # Type check the config entries.
    if not config.type_check():
        for message in config.errors:
            tangelo.log_error("TANGELO", message)
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

    # Determine whether to serve directory listings by default.
    listdir = False
    if args.list_dir is None and args.no_list_dir is None:
        if config.list_dir is not None:
            listdir = config.list_dir
    else:
        listdir = (args.list_dir is not None) or (not args.no_list_dir)

    cherrypy.config["listdir"] = listdir
    tangelo.log("TANGELO", "Directory content serving %s" % ("enabled" if listdir else "disabled"))

    # Determine whether to serve web service Python source code by default.
    showpy = False
    if args.show_py is None and args.no_show_py is None:
        if config.show_py is not None:
            showpy = config.show_py
    else:
        showpy = (args.show_py is not None) or (not args.no_show_py)

    cherrypy.config["showpy"] = showpy
    tangelo.log("TANGELO", "Web service source code serving %s" % ("enabled" if showpy else "disabled"))

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
    root = args.root or config.root
    if root:
        root = tangelo.util.expandpath(root)
    elif args.examples:
        # Set the examples web root.
        root = get_web_directory()
        tangelo.log_info("TANGELO", "Looking for example web content path in %s" % (root))
        if not os.path.exists(root):
            tangelo.log_error("ERROR", "could not find examples package")
            return 1

        # Set the examples plugins.
        config.plugins = [{"name": "config"},
                          {"name": "data"},
                          {"name": "docs"},
                          {"name": "mapping"},
                          {"name": "mongo"},
                          {"name": "stream"},
                          {"name": "tangelo"},
                          {"name": "ui"},
                          {"name": "vis"}]
    else:
        root = tangelo.util.expandpath(".")

    tangelo.log("TANGELO", "Serving content from %s" % (root))

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

    # Create a plugin manager.
    plugins = tangelo.server.Plugins("tangelo.plugin", config=config.plugins, plugin_dir=get_bundled_plugin_directory())

    # Check for any errors - if there are, report them and exit.
    if not plugins.good():
        for message in plugins.errors:
            tangelo.log_error("PLUGIN", message)
        return 1

    # Save the plugin manager for use later (when unloading plugins during
    # shutdown).
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
                                                          "tools.staticfile.filename": get_tangelo_ico()}})

    # Set up the global configuration.
    cherrypy.config.update({"environment": "production",
                            "log.screen": True,
                            "server.socket_host": hostname,
                            "server.socket_port": port})

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
