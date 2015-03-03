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

(This command causes Tangelo to begin serving content out of the current
directory on the default port, 8080.)

Tangelo's runtime behaviors are specified via configuration file and command
line options.  Tangelo configuration files are YAML files representing a
key-value store ("associative array" in YAML jargon) at the top level.  Each
options is specified as a key-value pair:  the line starts with the name of the
key, then a colon followed by a space, and then the value.

The example configuration found at
``/usr/share/tangelo/conf/tangelo.local.conf`` reads something like the
following:

.. code-block:: yaml

    hostname: 0.0.0.0
    port:     8080

This minimal configuration file specifies that Tangelo should listen on all
interfaces for connections on port 8080.  By contrast, ``tangelo.conf.global``
looks like this:

.. code-block:: yaml

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

    tangelo -c ~/myconfig.yaml

When the flag is omitted, Tangelo will use default values for all
configuration options (see :ref:`config-options` below).

Finally, all configuration options can also be specified on the command line.
This has the effect of overriding whatever value may be set in the specified
configuration file.  This can be useful for, e.g., using a single configuration
file for multiple Tangelo instances, but varying the port number.

.. _config-options:

Configuration Options
---------------------

The following table shows what fields can be included in the configuration file,
what they mean, and their default values if left unspecified.

================ =================================================================   =================================
Option           Meaning                                                             Default value
================ =================================================================   =================================
hostname         The hostname interface on which to listen for connections           ``localhost``

port             The port number on which to listen for connections                  ``8080``

root             The path to the directory to be served by Tangelo as the web root   ``.`` [#root]_

drop-privileges  Whether to drop privileges when started as the superuser            ``True``

sessions         Whether to enable server-side session tracking                      ``True``

user             The user account to drop privileges to                              ``nobody`` [#usergroup]_

group            The user group to drop privileges to                                ``nobody`` [#usergroup]_

access-auth      Whether to protect directories containing a ``.htaccess`` file      ``True``

key              The path to the SSL key                                             ``None`` [#https]_ [#unset]_

cert             The path to the SSL certificate                                     ``None`` [#https]_ [#unset]_

plugins          A list of plugins to load (see :ref:`plugin-config`)                ``None`` [#plugins]_ [#unset]_
================ =================================================================   =================================

.. rubric:: Footnotes

.. [#root] This is to say, Tangelo serves from the directory in which it was
    invoked by default.

.. [#usergroup] Your Unix system may already have a user named "nobody" which
    has the least possible level of permissions.  The theory is that system daemons
    can be run as this user, limiting the damage a rogue process can do.  However,
    if multiple daemons are run this way, any rogue daemon can theoretically gain
    control of the others.  Therefore, the recommendation is to create a new user
    named "tangelo", that also has minimal permissions, but is only used to run
    Tangelo in privilege drop mode.

.. [#https] You must also specify both *key* and *cert* to serve content over
    https.

.. [#unset] That is to say, the option is simply unset by default, the
    equivalent of not mentioning the option at all in a configuration file.

.. [#plugins] This option can *only* appear in the configuration file; there is
    no command line equivalent.

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

.. code-block:: yaml

    enabled: true
    path: /usr/share/tangelo/plugins/tangelo

This file can be saved to ``/etc/tangelo/plugin.conf``.

It remains to configure Tangelo itself.  The hostname should reflect the desired
external identity of the Tangelo server - perhaps *excelsior.starfleet.mil*.  As
this is a "global" deployment, we want to listen on port 80 for connections.
Since we will need to start Tangelo as root (to gain access to the low-numbered
ports), we should also specify a user and group to drop privileges to:  these
can be the specially created user and group *tangelo*.

The corresponding configuration file might look like this:

.. code-block:: yaml

    # Network options.
    hostname: excelsior.starfleet.mil
    port: 80

    # Privilege drop options.
    user: tangelo
    group: tangelo

    # Runtime resources.
    root: /srv/tangelo

This file should be saved to ``/etc/tangelo.conf``, and then Tangelo can be
launched with a command like ``tangelo -c /etc/tangelo.conf`` (running the
command with ``sudo`` may be necessary to allow for port 80 to be bound).

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
