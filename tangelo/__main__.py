import argparse
import itertools
import os
import cherrypy
import platform

import signal
from twisted.internet import reactor
import sys
import time

import tangelo
import tangelo.server
import tangelo.tool
import tangelo.util
import tangelo.websocket

def polite(signum, frame):
    print >>sys.stderr, "Already shutting down.  To force shutdown immediately, send SIGQUIT (Ctrl-\\)."

def die(signum, frame):
    print >>sys.stderr, "Forced shutdown.  Exiting immediately."
    os.kill(os.getpid(), signal.SIGKILL)

def shutdown(signum, frame):
    # Disbale the shutdown handler (i.e., for repeated Ctrl-C etc.) for the
    # "polite" shutdown signals.
    for sig in [signal.SIGINT, signal.SIGTERM]:
        signal.signal(sig, polite)

    # Perform (1) vtkweb process cleanup, (2) twisted reactor cleanup and quit,
    # (3) CherryPy shutdown, and (4) CherryPy exit.
    tangelo.server.cpserver.root.cleanup()
    reactor.stop()
    cherrypy.engine.stop()
    cherrypy.engine.exit()

def start():
    sys.stderr.write("starting tangelo...")

    # The presence of a pid file means that either this instance of Tangelo is
    # already running, or the PID is stale.
    if os.path.exists(pidfile):
        # Get the pid.
        try:
            pid = tangelo.util.read_pid(pidfile)
        except ValueError:
            sys.stderr.write("failed (pidfile exists and contains bad pid)\n")
            return 1

        # Check if the pid is live - if so, then Tangelo is already running; if
        # not, then remove the pidfile.
        if tangelo.util.live_pid(pid):
            sys.stderr.write("failed (already running)\n")
            return 1
        else:
            try:
                os.remove(pidfile)
            except OSError:
                sys.stderr.write("failed (could not remove stale pidfile)")
                return 1

    # Make sure the working directory is the place where the control script
    # lives.
    #os.chdir(path)

    # Set up the global configuration.  This includes the hostname and port
    # number as specified in the CMake phase.
    #
    # Whether to log directly to the screen has to do with whether we are
    # daemonizing - if we are, we want to suppress the output, and if we are
    # not, we want to see everything.
    cherrypy.config.update({"environment": "production",
                            "log.error_file": logfile,
                            "log.screen": not daemonize,
                            "server.socket_host": hostname,
                            "server.socket_port": port,
                            "error_page.default": tangelo.server.Tangelo.error_page})

    # If we are daemonizing, do it here, before anything gets started.  We have
    # to set this up in a certain way:
    #
    # 1. We fork ourselves immediately, so the child process, which will
    # actually start CherryPy, doesn't scribble on the screen.
    #
    # 2. We get the parent process to poll the logfile for specific messages
    # indicating success or failure, and use these to print an informative
    # message on screen.
    #
    # The special behavior of the parent before it exits is the reason we don't
    # just use the CherryPy Daemonizer plugin.
    if daemonize:
        fork = os.fork()

        # The parent process - start a polling loop to watch for signals in the
        # log file before exiting.
        if fork != 0:
            # Loop until we can open the logfile (this is in case the child
            # process hasn't created it just yet).
            opened = False
            while not opened:
                try:
                    f = open(logfile)
                    opened = True
                except IOError:
                    pass

            # Seek to the end of the file.
            f.seek(0, os.SEEK_END)

            # In a loop, look for new lines being added to the log file, and
            # examine them for signs of success or failure.
            done = False
            location = None
            while not done:
                cur_pos = f.tell()
                line = f.readline()
                if not line:
                    f.seek(cur_pos)
                else:
                    if "Bus STARTED" in line:
                        retval = 0
                        print >>sys.stderr, "success (serving on %s)" % (location)
                        done = True
                    elif "Error" in line:
                        retval = 1
                        print >>sys.stderr, "failed (check tangelo.log for reason)"
                        done = True
                    elif "Serving on" in line:
                        location = line.split("Serving on")[1].strip()

            # The parent process can now exit, indicating success or failure of
            # the child.
            sys.exit(retval)

    # From this point forward, we are the child process, and can now set up the
    # server and get it going.
    #
    # Create an instance of the main handler object.
    tangelo.server.cpserver = cherrypy.Application(tangelo.server.Tangelo(vtkweb_port_list), "/")
    cherrypy.tree.mount(tangelo.server.cpserver, config={"/": { "tools.auth_update.on": do_auth,
                                                                "tools.treat_url.on": True }})

    # Try to drop privileges if requested, since we've bound to whatever port
    # superuser privileges were needed for already.
    if drop_priv:
        # If we're on windows, don't supply any username/groupname, and just
        # assume we should drop priveleges.
        if os_name == "Windows":
            cherrypy.process.plugins.DropPrivileges(cherrypy.engine).subscribe()
        elif os.getuid() == 0:
            # Reaching here means we're on unix, and we are the root user, so go
            # ahead and drop privileges to the requested user/group.
            import grp
            import pwd

            # Find the UID and GID for the requested user and group.
            try:
                mode = "user"
                value = user
                uid = pwd.getpwnam(user).pw_uid

                mode = "group"
                value = group
                gid = grp.getgrnam(group).gr_gid
            except KeyError:
                msg = "no such %s '%s' to drop privileges to" % (mode, value)
                tangelo.log(msg, "ERROR")
                print >>sys.stderr, "failed (%s)" % (msg)
                sys.exit(1)

            # Set the process home directory to be the dropped-down user's.
            os.environ["HOME"] = os.path.expanduser("~%s" % (user))

            # Transfer ownership of the log file to the non-root user.
            os.chown(logfile, uid, gid)

            # Perform the actual UID/GID change.
            cherrypy.process.plugins.DropPrivileges(cherrypy.engine, uid=uid, gid=gid).subscribe()

    # If daemonizing, we need to maintain a pid file.
    if daemonize:
        cherrypy.process.plugins.PIDFile(cherrypy.engine, pidfile).subscribe()

    # Set up websocket handling.  Use the pass-through subclassed version of the
    # plugin so we can set a priority on it that doesn't conflict with privilege
    # drop.
    tangelo.websocket.WebSocketLowPriorityPlugin(cherrypy.engine).subscribe()
    cherrypy.tools.websocket = tangelo.websocket.WebSocketTool()

    # Replace the stock auth_digest and auth_basic tools with ones that have
    # slightly lower priority (so the AuthUpdate tool can run before them).
    cherrypy.tools.auth_basic = cherrypy.Tool("before_handler", cherrypy.lib.auth_basic.basic_auth, priority=2)
    cherrypy.tools.auth_digest = cherrypy.Tool("before_handler", cherrypy.lib.auth_digest.digest_auth, priority=2)

    # Install signal handlers to allow for proper cleanup/shutdown.
    for sig in [signal.SIGINT, signal.SIGTERM]:
        signal.signal(sig, shutdown)

    # Send SIGQUIT to an immediate, ungraceful shutdown instead.
    signal.signal(signal.SIGQUIT, die)

    # Install the "treat_url" tool, which performs redirections and analyzes the
    # request path to see what kind of resource is being requested, and the
    # "auth update" tool, which checks for updated/new/deleted .htaccess files
    # and updates the state of auth tools on various paths.
    cherrypy.tools.treat_url = cherrypy.Tool("before_handler", tangelo.tool.treat_url, priority=0)
    if do_auth:
        cherrypy.tools.auth_update = tangelo.tool.AuthUpdate(point="before_handler", priority=1)

    # Start the CherryPy engine.
    cherrypy.engine.start()

    # Start the Twisted reactor in the main thread (it will block but the
    # CherryPy engine has already started in a non-blocking manner).
    reactor.run(installSignalHandlers=False)
    cherrypy.engine.block()

def stop():
    if pidfile is None:
        raise TypeError("'pidfile' argument is required")

    retval = 0
    sys.stderr.write("stopping tangelo...")

    if os.path.exists(pidfile):
        # Read the pid.
        try:
            pid = tangelo.util.read_pid(pidfile)
        except ValueError:
            sys.stderr.write("failed (tangelo.pid does not contain a valid process id)\n")
            return 1

        # Attempt to terminate the process, if it's still alive.
        try:
            if tangelo.util.live_pid(pid):
                os.kill(pid, signal.SIGTERM)
                while tangelo.util.live_pid(pid):
                    time.sleep(0.1)
        except OSError:
            sys.stderr.write("failed (could not terminate process %d)\n" % (pid))
            retval = 1

    if retval == 0:
        sys.stderr.write("success\n")

    return retval

def restart():
    stopval = stop()
    if stopval == 0:
        return start()
    else:
        return stopval
if __name__ == "__main__":
    # Twiddle the command line so the name of the program is "tangelo" rather
    # than "__main__".
    sys.argv[0] = sys.argv[0].replace("__main__.py", "tangelo")

    p = argparse.ArgumentParser(description="Control execution of a Tangelo server.")
    p.add_argument("-d", "--no-daemon", action="store_true", help="run Tangelo in-console (not as a daemon).")
    p.add_argument("-a", "--no-auth", action="store_true", help="disable HTTP authentication (i.e. processing of .htaccess files).")
    p.add_argument("-p", "--no-drop-privileges", action="store_true", help="disable privilege drop when started as superuser.")
    p.add_argument("--hostname", type=str, default=None, metavar="HOSTNAME", help="overrides configured hostname on which to run Tangelo")
    p.add_argument("--port", type=int, default=None, metavar="PORT", help="overrides configured port number on which to run Tangelo")
    p.add_argument("--vtkweb-ports", type=str, default=None, metavar="PORT RANGE", help="specifies the port range to use for VTK Web processes")
    p.add_argument("-u", "--user", type=str, default=None, metavar="USERNAME", help="specifies the user to run as when root privileges are dropped")
    p.add_argument("-g", "--group", type=str, default=None, metavar="GROUPNAME", help="specifies the group to run as when root privileges are dropped")
    p.add_argument("--logdir", type=str, default=None, metavar="DIR", help="where to place the log file (rather than in the directory where this program is")
    p.add_argument("--piddir", type=str, default=None, metavar="DIR", help="where to place the PID file (rather than in the directory where this program is")
    p.add_argument("action", metavar="<start|stop|restart>", help="perform this action for the current Tangelo instance.")
    args = p.parse_args()

    no_daemon = args.no_daemon
    do_auth = not args.no_auth
    drop_priv = not args.no_drop_privileges
    action = args.action
    hostname = args.hostname or "localhost"
    port = args.port or 8080
    user = args.user or "nobody"
    group = args.group or "nobody"
    logdir = args.logdir
    piddir = args.piddir

    vtkweb_port_list = []
    if args.vtkweb_ports is not None:
        try:
            # This parses expressions of the form "8081-8090,12000,13500-13600".
            # It will allow spaces around the punctuation, but reject too many
            # hyphens, and "blank" entries (i.e. two commas next to each other
            # etc.).
            vtkweb_port_list = list(itertools.chain.from_iterable(map(lambda y: range(y[0], y[1]) if len(y) == 2 else [y[0]], map(lambda x: map(int, x.split("-", 1)), args.vtkweb_ports.split(",")))))
        except ValueError:
            print >>sys.stderr, "error: could not parse VTK Web port range specification '%s'" % (args.vtkweb_ports)
            sys.exit(1)

        if vtkweb_port_list == []:
            print >>sys.stderr, "error: VTK Web port specification '%s' produces no ports" % (args.vtkweb_ports)
            sys.exit(1)

        if port in vtkweb_port_list:
            print >>sys.stderr, "error: Tangelo server port %d cannot be part of VTK Web port specification ('%s')" % (port, args.vtkweb_ports)
            sys.exit(1)

    # Detect operating system (and OSX version, if applicable).
    os_name = platform.system()
    if os_name == "Darwin":
        version = map(int, platform.mac_ver()[0].split("."))

    # Determine the current directory based on the invocation of this script.
    current_dir = os.path.dirname(os.path.abspath(__file__))
    cherrypy.config.update({"webroot": current_dir + "/web"})

    # Place an empty dict to hold per-module configuration into the global
    # configuration object.
    cherrypy.config.update({"module-config": {}})

    # Decide whether to daemonize, based on whether the user wishes not to, and
    # whether the platform supports it.
    daemonize = not no_daemon and not(os_name == "Windows" or (os_name == "Darwin" and version[1] == 6))

    # Get the path of the tangelo script.
    path = os.path.dirname(os.path.abspath(sys.argv[0]))

    # Determine the paths to place the PID file and log file in.  This defaults
    # to the same directory that contains the tangelo control script.
    if piddir is None:
        pidpath = path
    else:
        pidpath = os.path.abspath(piddir)
    pidfile = pidpath + "/tangelo.pid"

    if logdir is None:
        logpath = path
    else:
        logpath = os.path.abspath(logdir)
    logfile = logpath + "/tangelo.log"

    # Dispatch on action argument.
    code = 1
    if action == "start":
        #code = start(pidfile=pidfile, logfile=logfile, daemonize=daemonize, hostname=hostname, port=port, vtkweb_ports=vtkweb_port_list)
        code = start()
    elif action == "stop":
        if not daemonize:
            sys.stderr.write("error: stop action not supported on this platform\n")
            sys.exit(1)
        code = stop()
    elif action == "restart":
        if not daemonize:
            sys.stderr.write("error: restart action not supported on this platform\n")
            sys.exit(1)
        code = restart()
    else:
        p.print_usage()
        code = 1

    sys.exit(code)
