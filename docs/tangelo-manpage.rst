===================
    ``tangelo``
===================

| tangelo [-h] [-c FILE] [-nc] [-a] [-na] [-p] [-np]
|         [--hostname HOSTNAME] [--port PORT] [-u USERNAME]
|         [-g GROUPNAME] [-r DIR] [--vtkpython FILE] [--verbose]
|         [--version] [--key FILE] [--cert FILE]

Start a Tangelo server.

=================================  ============================================================================================================================
Optional argument                  Effect
=================================  ============================================================================================================================
-h, --help                         show this help message and exit
-c FILE, --config FILE             specifies configuration file to use
-nc, --no-config                   skips looking for and using a configuration file
-a, --access-auth                  enable HTTP authentication (i.e. processing of .htaccess files) (default)
-na, --no-access-auth              disable HTTP authentication (i.e. processing of .htaccess files)
-p, --drop-privileges              enable privilege drop when started as superuser (default)
-np, --no-drop-privileges          disable privilege drop when started as superuser
-s, --sessions                     enable server-side session tracking (default)
-ns, --no-drop-privileges          disable server-side session tracking
--hostname HOSTNAME                overrides configured hostname on which to run Tangelo
--port PORT                        overrides configured port number on which to run Tangelo
-u USERNAME, --user USERNAME       specifies the user to run as when root privileges are dropped
-g GROUPNAME, --group GROUPNAME    specifies the group to run as when root privileges are dropped
-r DIR, --root DIR                 the directory from which Tangelo will serve content
--examples                         serve the Tangelo example applications
--verbose, -v                      display extra information as Tangelo starts up
--version                          display Tangelo version number
--key FILE                         the path to the SSL key. You must also specify --cert to serve content over https.
--cert FILE                        the path to the SSL certificate. You must also specify --key to serve content over https.
=================================  ============================================================================================================================

Example Usage
=============

To start a Tangelo server with the default configuration, serving from the
current directory: ::

    tangelo

This starts Tangelo on port 8080.

To serve the example applications that come bundled with Tangelo: ::

    tangelo --examples

To control particular options, such as the port number (overriding the value
specified in the config) file: ::

    tangelo --port 9090
