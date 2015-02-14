==========================================
    Fiddling with the Bundled Examples
==========================================

The previous tutorials have shown how to develop various types of Tangelo
applications, but you might also want to simply fiddle around with the example
applications that come bundled with Tangelo.  Since the bundled examples are
treated in a somewhat special manner by Tangelo, this tutorial explains how you
can make a copy of the example applications, set them up with a Tangelo
configuration file, and then experiment and see the results yourself.

The examples can be viewed at http://localhost:8080 by launching Tangelo in
example mode::

    tangelo --examples

The index page contains links to different examples, each of which is served as
the web content of one plugin or another.  For example,
http://localhost:8080/plugin/vis/examples/barchart/ serves an example of the
barchart that is part of the *vis* plugin.

The Example Web Applications
============================

The example web applications are bundled in the Tangelo Python package with the
following directory structure::

    tangelo.ico
    web/
        ...
    plugin/
        ...

The file ``tangelo.ico`` is served by Tangelo statically as the default favicon,
while the ``web`` directory contains the example site's front page (including
the Tangelo Sunrise, and the menu of links to the individual examples).  The
examples themselves are contained within the ``plugin`` directory.  As an
example, the directory for the *Bokeh* plugin looks like this::

    plugin/
        bokeh/
            requirements.txt
            python/
                __init__.py
            web/
                bokeh.js
                examples/
                    iris/
                        index.html
                        iris.py

This plugin contains a Python component and a clientside component, as well as
the Iris example application, which demonstrates how the pieces fit together
(for information about how plugins work, see :ref:`plugins`).  The web
application content in the ``iris`` directory would be a good place to play
around to discover for yourself how this plugin works.

Therefore, we will want to make a private copy of the ``web`` and ``plugin``
directories in order to experiment with the contents of the example web
applications.

Making a Copy
=============

To actually play with the examples, we'd like to set up our own sandbox, copy
these materials into it, configure Tangelo to run with the appropriate plugins,
and finally serve our own version of the example applications.

Step 1:  Create a Sandbox
-------------------------

The examples are bundled as *package data* with the Tangelo Python package,
meaning they will be found within the ``tangelo/pkgdata`` subdirectory of the
``site-packages`` directory of the Python installation that contains Tangelo.
On a typical Linux Python installation, this directory might be
``/usr/lib/python2.7/site-packages/tangelo/pkgdata``.  Because different Python
setups may behave differently with respect to where such files are kept, Tangelo
includes a program ``tangelo-pkgdata`` that simply reports the full path to the
``pkgdata`` directory.  Using this program, the following sequence of shell
commands will create an area where we can safely modify and otherwise experiment
with the examples::

    $ cd ~
    $ mkdir tangelo-examples
    $ cd tangelo-examples
    $ cp -r `tangelo-pkgdata` .

(Enclosing a command in backticks causes the shell to run the enclosed program
and substitute its output in the original command.  You can also run
``tangelo-pkgdata`` manually, inspect the output, and copy it into your own
manual shell command as well.)

Step 2:  Configure the Plugins
------------------------------

We will want to have Tangelo serve the ``web`` directory, while loading the
appropriate plugins from the ``plugin`` directory.  For the latter, we will need
a `configuration file <../_static/fiddling/config.yaml.txt>`_ to declare the plugins:

.. literalinclude:: ../static/fiddling/config.yaml
    :linenos:

This very simple configuration simply names the plugins we need, together with
relative paths stating where the plugins can be found.  Create a file
``config.yaml`` (in the ``tangelo-examples`` directory) and copy the
configuration into it.

Step 3:  Launch Tangelo
-----------------------

Now that we have web materials, plugins, and a configuration, we just need to
start Tangelo::

    $ tangelo --root web --config config.yaml

Tangelo should begin serving the example site at http://localhost:8080 (if you
get an error about port 8080 not being free, try again with the ``--port``
option to select a different port).

Step 4:  Fiddle!
----------------

Now you can go into the various ``web`` subdirectories of the plugin paths, make
changes, and observe them live.  If you find things don't update as expected,
you can try restarting the server (certain features of plugins can only be
instantiated when Tangelo first starts up).

Try changing the data values in the *mapping* plugin examples, or changing how
some of the web services retrieve, process, or format their output data.
With a safe, hands-on approach, you can learn a lot about how Tangelo operates.
