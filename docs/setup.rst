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

    tangelo start

The simple command hides a fair amount of activity behind the scenes, and it
will be instructive to track that activity.

Tangelo's runtime behaviors are specified via *configuration file*.  Tangelo
configuration files are simply `JSON+comments
<http://blog.getify.com/json-comments/>`_ files containing a single JavaScript
object of key-value pairs describing the configuration.  When no configuration
file is specified on the command line (via the ``-c`` or ``--config`` flags),
Tangelo will search for one in a sequence of predetermined locations, as
follows:

#. ``/etc/tangelo.conf``

#. ``~/.config/tangelo/tangelo.conf``

#. ``/usr/share/tangelo/conf/tangelo.conf.local``

For example, in the quickstart situation, Tangelo will end up using #3, one of
the configuration files that ships with Tangelo.  ``tangelo.conf.local`` looks
something like this:

.. code-block:: javascript

    {
        "hostname": "0.0.0.0",
        "port":     8080,

        "logdir":   "~/.config/tangelo"
    }

This minimal configuration file specifies that Tangelo should listen on all
interfaces for connections on port 8080, and use the logfile
``~/.config/tangelo/tangelo.log``.  By contrast, ``tangelo.conf.global`` looks
like this:

.. code-block:: javascript

    {
        "hostname": "0.0.0.0",
        "port":     80,

        "user":     "nobody",
        "group":    "nobody",

        "logdir":   "/var/log"
    }

This configuration file is meant for the case when Tangelo is to be installed as
a system-level service.  It will run on port 80 (the standard port for an HTTP
server), store a logfile in ``/var/log``, and, though it will need to be started
with superuser privileges, it will drop those privleges to run as user
``nobody`` in group ``nobody`` to prevent damage to the system should the
process be, e.g., hijacked by an attacker.

To run Tangelo using a particular configuration file, ``tangelo`` can be invoked
with the ``-c`` or ``--config`` option: ::

    tangelo -c ~/myconfig.json

Otherwise, a particular user may have a configuration she wishes to use for all
Tangelo sessions; she can place this file at ``~/.config/tangelo.conf`` and
forgo the use of ``-c`` and ``--config``.  Finally, a system administrator can
create a sitewide configuration by installing a file to ``/etc/tangelo.conf``.

.. _config-options:

Configuration Options
---------------------

The following table shows what fields that can be included in the configuration
file, what they mean, and their default values if left unspecified:

=============== =========================================================================================   =============
Option          Meaning                                                                                     Default value
=============== =========================================================================================   =============
hostname        The hostname interface on which to listen for connections (*string*)                        "localhost"

port            The port number on which to listen for connections (*integer*)                              "8080"

root            The path to the directory to be served by Tangelo as the web root (*string*)                "/usr/share/tangelo/web" [#root]_

logdir          The directory that will contain the Tangelo log file (``tangelo.log``) (*string*)           "." [#logdir]_

vtkpython       The path to the ``vtkptyhon`` program (for use in :ref:`vtkweb` capabilities) (*string*)    null

drop_privileges Whether to drop privileges when started as the superuser (*boolean*)                        true

user            The user account to drop privileges to (*string*)                                           "nobody" [#usergroup]_

group           The user group to drop privileges to (*string*)                                             "nobody" [#usergroup]_

daemonize       Whether to run as a daemon (*boolean*)                                                      true [#daemonize]_

access_auth     Whether to protect directories containing a ``.htaccess`` file (*boolean*)                  true
=============== =========================================================================================   =============

.. rubric:: Footnotes

.. [#root] The first component of this path may vary by platform.  Technically,
    the path begins with the Python value stored in ``sys.prefix``; in a Unix
    system, this value is */usr*, yielding the default path shown here.

.. [#logdir] This is to say, by default the log file will appear in the
    directory from which Tangelo was launched.

.. [#daemonize] On platforms that don't support daemonization (i.e., Windows),
    this defaults to false.

.. [#usergroup] Your Unix system may already have a user named "nobody" which
    has the least possible level of permissions.  The theory is that system daemons
    can be run as this user, limiting the damage a rogue process can do.  However,
    if multiple daemons are run this way, any rogue daemon can theoretically gain
    control of the others.  Therefore, the recommendation is to create a new user
    named "tangelo", that also has minimal permissions, but is only used to run
    Tangelo in privilege drop mode.

Administering a Tangelo Installation
====================================

Administering Tangelo on a particular system requires making some decisions
about how Tangelo ought to behave, then implementing those decisions in a
configuration file.

For example, as the system administrator you might create a directory on the web
server machine at ``/srv/tangelo`` which would serve as the web root.  The
website front page and supporting materials could be placed here, with the
*tangelo.js* and *tangelo.min.js* files copied from
``/usr/share/tangelo/web/js/`` to ``/srv/tangelo/js`` so they can be easily
accessed from user web applications.

The log file could be placed in ``/var/log``, and the hostname should reflect
the desired external identity of the Tangelo server - perhaps
*excelsior.starfleet.mil*.  As this is a "global" deployment, we want to listen
on port 80 for connections.  Since we will need to start Tangelo as root (to
gain access to the low-numbered ports), we should also specify a user and group
to drop privileges to:  these can be the specially created user and group
*tangelo*.

The corresponding configuration file might look like this:

.. code-block:: javascript

    {
        // Network options.
        "hostname": "excelsior.starfleet.mil",
        "port": 80,

        // Privilege drop options.
        "user": "tangelo",
        "group": "tangelo",

        // Runtime resources.
        "root": "/srv/tangelo",
        "logdir": "/var/log"
    }

This file should be placed in ``/etc/tangelo``, and then Tangelo can be launched
with a simple ``tangelo start`` on the command line.

Preparing Data for the Example Applications
===========================================

Tangelo comes with several :root:`example applications
</examples>`, some of which require a bit of data setup
before they will work.

Named Entities
--------------

In order to run the named entities example at http://localhost:8000/examples/ner/,
you need to install NLTK and download some datasets.  The part of NLTK used by
the examples also requires `NumPy <http://www.numpy.org/>`_.
On Mac and Linux, simply run::

    pip install nltk numpy

In a Windows Git Bash shell::

    /c/Python27/Scripts/pip install pyyaml nltk numpy

To get the NLTK datasets needed, run the NLTK downloader from the command line
as follows::

    python -m nltk.downloader nltk.downloader maxent_ne_chunker maxent_treebank_pos_tagger punkt words

Flickr Metadata Maps
--------------------

The :root:`Flickr Metadata Maps </examples/flickr>` application
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
  the app, found at ``/usr/share/tangelo/web/examples/flickr/config.json``.

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

Enron Email Network
-------------------

The :root:`Enron Email Network </examples/enron>` application
visualizes the `enron email dataset <https://www.cs.cmu.edu/~enron/>`_ as a
network of communication.  The original data has been processed into graph form,
in a file hosted `here <http://midas3.kitware.com/midas/download/bitstream/339385/enron_email.json.gz>`_.
Download this file, ``gunzip`` it, and then issue this command to upload the
records to Mongo:

   .. code-block:: none

       mongoimport -d tangelo -c enron_email --file enron_email.json

(Note: although ``enron_email.json`` contains one JSON-encoded object per line,
keep in mind that the file as a whole does **not** constitute a single JSON
object - the file is instead in a particular format recognized by Mongo.)

As with the Flickr data prep above, you can modify this command line to install
this data on another server or in a different database/collection.  If you do
so, remember to also modify
``/usr/share/tangelo/web/examples/enron/config.json`` to reflect these changes.

Reload the Enron app and take a look at the email communication network.

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
