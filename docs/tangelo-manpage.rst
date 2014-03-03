===================
    ``tangelo``
===================

tangelo [-h] [-c FILE] [-nc] [-d] [-nd] [-a] [-na] [-p] [-np]
        [--hostname HOSTNAME] [--port PORT] [-u USERNAME]
        [-g GROUPNAME] [--logdir DIR] [-r DIR] [--vtkpython FILE]
        [--pid PID] [--pids] [--attr ATTR] [--clean] [--verbose]
        <start|stop|restart|status>

Control execution of a Tangelo server.

=========================== ====================================================
Positional argument         Effect
=========================== ====================================================
<start|stop|restart|status> perform this action for the current Tangelo instance
=========================== ====================================================

=================================  ============================================================================================================================
Optional argument                  Effect
=================================  ============================================================================================================================
-h, --help                         show this help message and exit
-c FILE, --config FILE             specifies configuration file to use
-nc, --no-config                   skips looking for and using a configuration file
-d, --daemonize                    run Tangelo as a daemon (default)
-nd, --no-daemonize                run Tangelo in-console (not as a daemon)
-a, --access-auth                  enable HTTP authentication (i.e. processing of .htaccess files) (default)
-na, --no-access-auth              disable HTTP authentication (i.e. processing of .htaccess files)
-p, --drop-privileges              enable privilege drop when started as superuser (default)
-np, --no-drop-privileges          disable privilege drop when started as superuser
--hostname HOSTNAME                overrides configured hostname on which to run Tangelo
--port PORT                        overrides configured port number on which to run Tangelo
-u USERNAME, --user USERNAME       specifies the user to run as when root privileges are dropped
-g GROUPNAME, --group GROUPNAME    specifies the group to run as when root privileges are dropped
--logdir DIR                       where to place the log file (default: location from which Tangelo was started)
-r DIR, --root DIR                 the directory from which Tangelo will serve content
--vtkpython FILE                   the vtkpython executable, for use with the vtkweb service (default: "vtkpython")
--pid PID                          use with 'status' action to get information about a running Tangelo instance
--pids                             use with 'status' action to get a list of running Tangelo process IDs
--attr ATTR                        use with 'status' action to get a single status attribute (available attrs: pid, file, status, interface, config, log, root)
--clean                            use with 'status' action to remove stale status files for dead processes
--verbose, -v                      display extra information as Tangelo starts up
--version                          display Tangelo version number
=================================  ============================================================================================================================

Example Usage
=============

To start a Tangelo server with the default configuration: ::

    tangelo start

This starts Tangelo on port 8080, and uses the log file
``~/.config/tangelo/tangelo.log``.

To control particular options, such as the port number (overriding the value
specified in the config) file: ::

    tangelo start --port 9090

To restart a server that is already running: ::

    tangelo restart

If there are multiple Tangelo servers running at the same time: ::

    tangelo restart --pid 12345

To shut Tangelo down: ::

    tangelo stop
