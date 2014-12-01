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
        README.md
        control.py
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

README and Documentation
------------------------

You may have noticed that the example *foobar* plugin is structured to look like
a GitHub repository, including a ``README.md`` file.  Indeed, if a plugin is
developed on GitHub, then the standard GitHub README file will be served by
Tangelo at ``/plugin/foobar`` by default.  This allows the developer to include
some basic documentation or information in the README to be displayed to any
user who browses to the root of the plugin's web presence.  This behavior is
overridden by any ``web/index.html`` or ``web/index.htm`` file that may be
present.

In the absence of such an index file, Tangelo first searches for a sequence of
files: ``README.md``, ``README.rst``, ``README.txt``, and finally ``README``.
Whichever of these files is found first will be returned to the client as
text.  If none of these are found, Tangelo serves a message informing the client
that the plugin does exist, but there is no README.

Of course, the plugin may simply serve documentation at ``web/index.html``,
circumventing the inclusion of any README content.

Setup and Teardown
==================

.. _plugin-config:

Configuration 
=============

Loading and Unloading
=====================
