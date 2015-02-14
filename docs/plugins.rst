.. _plugins:

=======================
    Tangelo Plugins
=======================

Tangelo's capabilities can be extended by creating *plugins* to serve custom
content and services from a canonical URL, extend Tangelo's Python runtime
environment, and perform specialized setup and teardown actions to support new
behaviors.  Tangelo ships with several bundled plugins that implement useful
features and provide examples of how the plugin system can add value to your
Tangelo setup.

Structure and Content
=====================

A plugin is simply a directory containing a mix of content, documentation, and
control directives.  Together, these elements determine what services and
features the plugin provides to a Tangelo server instance, and how those
services and features are prepped and cleaned up.  A configuration file supplied
to Tangelo at startup time controls which plugins are loaded.

An example plugin's file contents might be as follows:

.. code-block:: none

    foobar/
        control.py
        config.yaml
        requirements.txt
        info.txt
        python/
            __init__.py
            helper.py
        web/
            foobar.js
            foobar.py
            example/
                index.html
                index.js

We can examine the contents piece by piece.

Web Content
-----------

The directory ``foobar/web`` behaves much like any other static and dynamic
content served by Tangelo.  Content in this directory is served from a base URL
of ``/plugin/foobar/`` (where, ``foobar`` is the name of this plugin; however,
see :ref:`plugin-config`).  For example, ``/plugin/foobar/foobar.js`` refers to the
file of the same name in the ``web`` directory; this URL could be used by a web
application to include this file in a ``<script>`` tag, etc. (see
:ref:`web-content` for more information).

Dynamic web services also behave as elsewhere:  the URL
``/plugin/foobar/foobar`` will cause Tangelo to run the code found in
``foobar.py`` and return it to the client, etc. (see :ref:`web-services` for
more information).

Python Content
--------------

A plugin may also wish to export some Python code for use in web services.  In
the foobar plugin example, such content appears in
``foobar/python/__init__.py``.  This file, for example, might contain the
following code:

.. code-block:: python

    import helper

    def even(n):
        return n % 2 == 0

When the foobar plugin is loaded by Tangelo, the contents of
``python/__init__.py`` are placed in a virtual package named
``tangelo.plugin.foobar``.  This enables web services to use the ``even()``
functions as in the following example:

.. code-block:: python

    import tangelo
    import tangelo.plugin.foobar

    def run(n):
        tangelo.content_type("text/plain")
        return "even" if tangelo.plugin.foobar.even(n) else "odd"

To export "submodules" that will appear in the ``tangelo.plugin.foobar``
namespace, note that ``__init__.py`` uses the ``import`` statement to cause the
``helper`` module to appear within its scope; this module can now be addressed
with ``tangelo.plugin.foobar.helper``, and any functions and data exported by
``helper`` will become available for use in web services as well.

The bundled *bokeh* plugin contains an example of exporting a decorator function
using this technique.

Setup and Teardown
==================

The file ``foobar/control.py`` defines *setup* and *teardown* actions for each
plugin.  For example, the contents of that file might be as follows:

.. code-block:: python

    import tangelo

    def setup(config, store):
        tangelo.log("FOOBAR", "Setting up foobar plugin!")

    def teardown(config, store):
        tangelo.log("FOOBAR", "Tearing down foobar plugin!")

Whenever Tangelo loads (unloads) the foobar plugin, it will import
``control.py`` as a module and execute any ``setup()`` (``teardown()``) function
it finds, passing the configuration and persistent storage (see
:ref:`plugin-config`) to it as arguments.  If during setup the function raises
any exception, the exception will be printed to the log, and Tangelo will
abandon loading the plugin and move to the next one.

The ``setup()`` function can also cause arbitrary CherryPy applications to be
mounted in the plugin's URL namespace.  ``setup()`` can optionally return a list
of 3-tuples describing the applications to mount.  Each 3-tuple should contain a
CherryPy application object, an optional configuration object associated with
the application, and a string describing where to mount the application.  This
string will automatically be prepended with the base URL of the plugin being set
up.  For instance:

.. code-block:: python

    import tangelo.plugin.foobar

    def setup(config, store):
        app = tangelo.plugin.foobar.make_cherrypy_app()
        appconf = tangelo.plugin.foobar.make_config()

        return [(app, appconf, "/superapp")]

When the ``foobar`` plugin is loaded, the URL ``/plugin/foobar/superapp`` will
serve the CherryPy application implemented in ``app``.  Any such applications
are also unmounted when the plugin is unloaded.

.. _plugin-config:

Plugin Configuration
====================

Plugin configuration comes in two parts:  specifying which plugins to load, and
specifying particular behavior for each plugin.

Enabling Plugins
----------------

The Tangelo configuration file supports an option ``plugin`` that specifies a
plugin configuration.  The option's value should be a YAML expression consisting
of a list of objects, one for each plugin under consideration.  The objects
themselves are relatively simple:

.. code-block:: yaml

    - name: foobar
      path: /path/to/foobar/plugin

    - name: quux
      path: path/to/quux

    - name: docs

Each contains a required ``name`` property and an optional ``path`` property
describing where to find the plugin materials (i.e., the example directory shown
above).

Note that you can enable a bundled plugin (see :ref:`bundled`) by omitting the
``path`` property.  In this case, Tangelo searches for a plugin by the given
name in the plugins that come bundled with Tangelo.  In the example above, the
*docs* plugin will be enabled.  This is useful for enabling a "standard" plugin
without having to know where Tangelo keeps it.

The ``plugins`` option can simply be omitted when you do not wish to load any
plugins.

When Tangelo is started with a ``plugins`` option in its configuration file,
each plugin listed will be loaded before Tangelo begins serving content to the
web.  Because it is assumed that any plugins specified are necessary for the
Tangelo application being launched, any error in loading any of the plugins will
result in aborting the startup process (logging errors as they occur).

Inversely, when Tangelo is shut down, each plugin will be unloaded in turn
(enabling, e.g., cleanup actions such as flushing buffers to disk, committing
pending database transactions, closing connections, etc.).  In this case, if a
plugin cannot be unloaded for any reason, Tangelo's shutdown will continue, and
you should clean up after the faulty plugin manually.

Plugin Setup
------------

Some plugins may need to be set up before they can be properly used.  Plugin
setup consists of two steps:  installing Python dependencies, if any, and
consulting any informational messages supplied by the plugin.

In the example *foobar* plugin, note that the root directory includes a
``requirements.txt`` file.  This is simply a `pip requirements file
<https://pip.pypa.io/en/latest/user_guide.html#requirements-files>`_ declaring
what Python packages the plugin needs to run.  You can install these with a
command similar to ``pip install -r foobar/requirements.txt``.

Secondly, some plugins may require some other action to be taken before they
work.  The plugin authors can describe any such instructions in the ``info.txt``
file.  After installing the requirements, you should read this file to see if
anything else is required.  For instance, a package may need to bootstrap after
it's installed by fetching further resources or updates from the web; in this
case, ``info.txt`` would explain just how to accomplish this bootstrapping.

These steps constitute a standard procedure when retrieving a new plugin for use
with your local Tangelo installation.  For instance, if the *foobar* plugin
resides in a GitHub repository, you would first find a suitable location on your
local computer to clone that repository.  Then you would invoke ``pip`` to
install the required dependencies, then take any action specified by
``info.txt``, and finally create an entry in the Tangelo plugin configuration
file.  When Tangelo is started (or when the plugin registry is refreshed), the
new plugin will be running.

Configuring Plugin Behavior
---------------------------

The file ``foobar/config.yaml`` describes a YAML associative array representing
the plugin's configuration data.  This is the same format as web service
configurations (see :ref:`configuration`), and can be read with the function
``tangelo.plugin_config()``.

Similarly, plugins also have a editable persistent store, accessed with the
``tangelo.plugin_store()`` function.

Both the configuration and the persistent store and passed as arguments to
``setup()`` and ``teardown()`` in the control module.

Loading and Unloading
=====================

When plugins are loaded or unloaded, Tangelo takes a sequence of particular
steps to accomplish the effect.

Loading a Plugin
----------------

Loading a plugin consists of the following actions:

1. The configuration is loaded from ``config.yaml``.

2. An empty persistent store is created.

3. Any python content is set up by creating a virtual package called
   ``tangelo.plugin.<pluginname>``, and exporting the contents of
   ``python/__init__.py`` to it.

4. The ``control.py`` module is loaded, and ``control.setup()`` is invoked,
   passing the configuration and fresh persistent store to it.

5. If ``setup()`` returns a result, the list of CherryPy apps expressed in the
   ``"apps"`` property of it are mounted.

Steps 3, 4, and 5 are not taken if the corresponding content is not present.  If
any of those steps raises an exception, the error will be logged and the Tangelo
startup process will abort.

Unloading a Plugin
------------------

Unloading a plugins consists of the follow actions (which serve to undo the
corresponding setup actions):

1. Any python content present in ``tangelo.plugin.<pluginname>`` is torn down by
   deleting the virtual package from the runtime.

2. Any CherryPy applications are unmounted.

3. If the control module contains a ``teardown()`` function, it is invoked,
   passing the configuration and persistent store to it.

If an exception occurs during step 3, the ``teardown()`` function will not
finish executing, but Tangelo shutdown will continue with the unloading of
the rest of the plugins and eventual exiting of the Tangelo process.
