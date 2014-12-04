================================
    Setup and Administration
================================

While the :ref:`quickstart` instructions will get you exploring the Tangelo
examples in just two commands, Tangelo has a rich set of configuration options
that can be used to administer Tangelo effectively.  This page will discuss
configuration and deployment strategies, including suggestions for best
practices.

Configuring and Launching Tangelo
=================================

The simplest way to launch a Tangelo server is to use this command: ::

    tangelo

Tangelo's runtime behaviors are specified via configuration file and command
line options.  Tangelo configuration files are INI-style files as read by the
standard Python `ConfigParse
<https://docs.python.org/2/library/configparser.html>`_ module.  These files
consist of one or more `sections`, each of which contains one or more option
settings.  A section begins with the section title, wrapped in square brackets.
Options are given as key-value pairs:  the line starts with the name of the
key, then a colon followed by a space, and then the value.

The example configuration found at
``/usr/share/tangelo/conf/tangelo/local/conf`` reads something like the
following:

.. code-block:: cfg

    [tangelo]
    hostname: 0.0.0.0
    port:     8080

This minimal configuration file specifies that Tangelo should listen on all
interfaces for connections on port 8080.  By contrast, ``tangelo.conf.global``
looks like this:

.. code-block:: cfg

    [tangelo]
    hostname: 0.0.0.0
    port:     80

    user:     nobody
    group:    nobody

This configuration file is meant for the case when Tangelo is to be installed as
a system-level service.  It will run on port 80 (the standard port for an HTTP
server) and, though it will need to be started with superuser privileges, it
will drop those privleges to run as user ``nobody`` in group ``nobody`` to
prevent damage to the system should the process be, e.g., hijacked by an
attacker.

To run Tangelo using a particular configuration file, ``tangelo`` can be invoked
with the ``-c`` or ``--config`` option: ::

    tangelo -c ~/myconfig.json

When the flag is omitted, Tangelo will use default values for all
configuration options (see :ref:`config-options` below).

Finally, all configuration options can also be specified on the command line.
This has the effect of overriding whatever value may be set in the specified
configuration file.  This can be useful for, e.g., using a single configuration
file for multiple Tangelo instances, but varying the port number.

.. _config-options:

Configuration Options
---------------------

The following tables, organized by section title, show what fields can be
included in the configuration file, what they mean, and their default values if
left unspecified.

The **[tangelo]** section contains general server options:

================ =================================================================   =================================
Option           Meaning                                                             Default value
================ =================================================================   =================================
hostname         The hostname interface on which to listen for connections           ``localhost``

port             The port number on which to listen for connections                  ``8080``

root             The path to the directory to be served by Tangelo as the web root   ``/usr/share/tangelo/www`` [#root]_

drop_privileges  Whether to drop privileges when started as the superuser            ``True``

sessions         Wehther to enable server-side session tracking                      ``True``

user             The user account to drop privileges to                              ``nobody`` [#usergroup]_

group            The user group to drop privileges to                                ``nobody`` [#usergroup]_

access_auth      Whether to protect directories containing a ``.htaccess`` file      ``True``

key              The path to the SSL key                                             ``None`` [#https]_ [#unset]_

cert             The path to the SSL certificate                                     ``None`` [#https]_ [#unset]_
================ =================================================================   =================================

.. rubric:: Footnotes

.. [#root] The first component of this path may vary by platform.  Technically,
    the path begins with the Python value stored in ``sys.prefix``; in a Unix
    system, this value is */usr*, yielding the default path shown here.

.. [#usergroup] Your Unix system may already have a user named "nobody" which
    has the least possible level of permissions.  The theory is that system daemons
    can be run as this user, limiting the damage a rogue process can do.  However,
    if multiple daemons are run this way, any rogue daemon can theoretically gain
    control of the others.  Therefore, the recommendation is to create a new user
    named "tangelo", that also has minimal permissions, but is only used to run
    Tangelo in privilege drop mode.

.. [#https] You must also specify both key and cert to serve content over
    https.

.. [#unset] That is to say, the option is simply unset by default, the
    equivalent of not mentioning the option at all in a configuration file.

Administering a Tangelo Installation
====================================

Administering Tangelo on a particular system requires making some decisions
about how Tangelo ought to behave, then implementing those decisions in a
configuration file.

For example, as the system administrator you might create a directory on the web
server machine at ``/srv/tangelo`` which would serve as the web root, containing
the website front page and supporting materials.

You should then prepare a plugin configuration file that, at the very least,
activates the Tangelo plugin:

.. code-block:: cfg

    [tangelo]
    enabled: true
    path: /usr/share/tangelo/plugins/tangelo

This file can be saved to ``/etc/tangelo/plugins.conf``.

It remains to configure Tangelo itself.  The hostname should reflect the desired
external identity of the Tangelo server - perhaps *excelsior.starfleet.mil*.  As
this is a "global" deployment, we want to listen on port 80 for connections.
Since we will need to start Tangelo as root (to gain access to the low-numbered
ports), we should also specify a user and group to drop privileges to:  these
can be the specially created user and group *tangelo*.

The corresponding configuration file might look like this:

.. code-block:: cfg

    [tangelo]
    # Network options.
    hostname: excelsior.starfleet.mil
    port: 80

    # Privilege drop options.
    user: tangelo
    group: tangelo

    # Runtime resources.
    root: /srv/tangelo

This file should be saved to ``/etc/tangelo.conf``, and then Tangelo can be
launched with a command like ``tangelo -c /etc/tangelo.conf`` (the ``sudo`` may
be necessary to allow for port 80 to be bound).

Running Tangelo as a System Service
===================================

Tangelo does not include any mechanisms to self-daemonize, instead running in,
e.g., a terminal, putting all logging output on ``stdout``, and offering no
facilities to track multiple instances by PID, etc.  However, the Tangelo
package includes some scripts and configurations for various system service
managers.  This section contains some instructions on working with the supported
managers.  If you would like a different system supported, send a message to
`tangelo-users@public.kitware.com` or fork the `GitHub repository
<https://github.com/Kitware/tangelo>`_ and send a pull request.

systemd
-------

`systemd` is a Linux service manager daemon for which a `unit file` corresponds
to each service.  Tangelo supplies such a unit file, along with supporting
scripts, at ``/usr/share/tangelo/daemon/systemd``.  To install Tangelo as a
service, the files in this directory need to be copied or symlinked to a location
from which `systemd` can access them.  An example follows, though your particular
system may require some changes from what is shown here; see the `systemd
documentation <http://www.freedesktop.org/wiki/Software/systemd/>`_ for more
information.

Go to the place where systemd unit files are installed: ::

    cd /usr/lib/systemd/system

Place an appropriate symlink there: ::

    sudo ln -s /usr/share/tangelo/daemon/systemd/system/tangelo@.service

Go to the systemd auxiliary scripts directory: ::

    cd ../scripts

Install a symlink to the launcher script: ::

    sudo ln -s /usr/share/tangelo/daemon/systemd/scripts/launch-tangelo.sh

Now you will be able to control Tangelo via the ``systemctl`` command.
Note that the unit file defines Tangelo as an `instantiated service`, meaning
that multiple Tangelo instances can be launched independently by specifying an
instantiation name.  For example: ::

    sudo systemctl start tangelo@localhost:8080

will launch Tangelo to run on the `localhost` interface, on port 8080.  The way
this works is that ``systemctl`` takes the instantiation name (i.e., all the
text after the ``@`` symbol - *localhost:8080*) and passes it to
``launch-tangelo.sh``.  It in turn parses the hostname (*localhost*) and port
number (*8080*) from the name, then launches Tangelo using whatever
configuration file is found at ``/etc/tangelo.conf``, but overriding the
hostname and port with those parsed from the name.  This allows for a unique
name for each Tangelo instance that corresponds to its unique web interface.

Preparing Data for Flickr Metadata Maps
=======================================

The :root:`Flickr Metadata Maps </plugin/mapping/examples/flickr>` application
plots publicly available Flickr photo data on a Google map.  The application
works by retrieving data from a Mongo database server, which by default is
expected to live at *localhost*.  The steps to getting this application working
are to **set up a MongoDB server**, **retrieve photo metadata via the Flickr
API**, and **upload the data to the MongoDB server**.

#. **Set up MongoDB.**  To set up a Mongo server you can consult the `MongoDB
   documentation <http://www.mongodb.org>`_.  It is generally as
   straightforward as installing it via a package manager, then launching the
   ``mongod`` program, or starting it via your local service manager.

  By default, the Flickr application assumes that the server is running on the
  same host as Tangelo.  To change this, you can edit the configuration file for
  the app, found at ``/usr/share/tangelo/www/examples/flickr/config.json``.

#. **Get photo data from Flickr.**  For this step you will need a `Flickr API
   key <http://www.flickr.com/services/api/misc.api_keys.html>`_.  Armed with a
   key, you can run the ``get-flickr-data.py`` script, which can be found at
   ``/usr/share/tangelo/data/get-flickr-data.py``.  You cun run it like this:

   .. code-block:: none

       get-flickr-data.py <your API key> <maximum number of photos to retrieve> >flickr_paris.json

   If you do not want to retrieve the data yourself, you can use the
   `hosted version <http://midas3.kitware.com/midas/download/bitstream/339384/flickr_paris_1000.json.gz>`_.
   This dataset was generated with this script, with a max count argument of 1000.

#. **Upload the data to Mongo.** You can use this command to place the photo
   data into your MongoDB instance:

   .. code-block:: none

        mongoimport -d tangelo -c flickr_paris --jsonArray --file flickr_paris.json

   This command uses the MongoDB instance running on **localhost**, and places
   the photo metadata into the **tangelo** database, in a collection called
   **flickr_paris**.  If you edited the configuration file in Step 1 above, be
   sure to supply your custom hostname, and database/collection names in this
   step.

Now the database should be set up to feed photo data to the Flickr app - reload
the page and you should be able to explore Paris through photos.

.. _versioning:

A Note on Version Numbers
=========================

Tangelo uses `semantic versioning <http://semver.org/>`_ for its version
numbers, meaning that each release's version number establishes a promise about
the levels of functionality and backwards compatibility present in that release.
Tangelo's version numbers come in two forms: *x.y* and *x.y.z*.  *x* is a *major
version number*, *y* is a *minor version number*, and *z* is a *patch level*.

Following the semantic versioning approach, major versions represent a stable
API for the software as a whole.  If the major version number is incremented, it
means you can expect a discontinuity in backwards compatibility.  That is to
say, a setup that works for, e.g., version 1.3 will work for versions 1.4, 1.5,
and 1.10, but should not be expected to work with version 2.0.

The minor versions indicate new features or functionality added to the previous
version.  So, version 1.1 can be expected to contain some feature not found in
version 1.0, but backwards compatibility is ensured.

The patch level is incremented when a bug fix or other correction to the
software occurs.

Major version 0 is special: essentially, there are no guarantees about
compatibility in the 0.\ *y* series.  The stability of APIs and behaviors begins
with version 1.0.

In addition to the standard semantic versioning practices, Tangelo also tags the
current version number with "dev" in the Git repository, resulting in version
numbers like "1.1dev" for the Tangelo package that is built from source.  The
release protocol deletes this tag from the version number before uploading a
package to the Python Package Index.

The :js:func:`tangelo.requireCompatibleVersion` function returns a boolean
expressing whether the version number passed to it is compatible with Tangelo's
current version.
