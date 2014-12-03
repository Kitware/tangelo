.. _bundled:

=======================
    Bundled Plugins
=======================

Tangelo ships with several bundled plugins that implement useful and powerful
functionality, as well as providing examples of various tasks that plugins can
perform.  This page divides the set of bundled plugins into categories,
demonstrating some of the styles of problems Tangelo can help solve.


Core Plugins
============

Although these "core plugins" are built using the same plugin system
architecture available to any Tangelo user, these deliver services vital to any
working Tangelo instance, and can therefore be considered integral parts of the
Tangelo platform.

Tangelo
-------

The Tangelo plugin simply serves the Tangelo clientside library files
``tangelo.js`` and ``tangelo.min.js``.  It also includes a "version" web service
that simply returns, as plain text, the running server's version number.

This is supplied as a plugin to avoid having to include the JavaScript files
manually into every deployment of Tangelo.  Instead, the files can be easily
served directly from the plugin, thus retaining stable URLs across deployments.

**Manifest**

=================================== ===========================
File                                Description
=================================== ===========================
``/plugin/tangelo/tangelo.js``      Unminified Tangelo library
``/plugin/tangelo/tangelo.min.js``  Minified Tangelo library
``/plugin/tangelo/version``         Version reporting service
=================================== ===========================

Docs
----

The Docs plugin serves the Tangelo documentation (the very documentation you are
reading right now!).  Again, this is to simplify deployments.  The index is
served at ``/plugin/docs`` and from there the index page links to all pages of
the documentation.

Stream
------

It may be necessary to return an immense (or even :root:`infinite
</examples/primes>`) amount of data from a web service to the client.  However,
this may take up so much time and memory that dealing with it becomes
intractable.  In such situations, the Stream plugin may be able to help.

Generators in Python
^^^^^^^^^^^^^^^^^^^^

Essentially, the plugin works by exposing Python's abstraction of `generators
<http://docs.python.org/2/reference/expressions.html#yield-expressions>`_.  If a
web service module includes a ``stream()`` function that uses the ``yield``
keyword instead of ``return``, thus marking it as a generator function, then the
Stream plugin can use this module to launch a *streaming service*.  Here is an
example of such a service, in a hypothetical file named ``prime-factors.py``:

.. code-block:: python

    import math
    import tangelo

    def prime(n):
        for i in xrange(2, int(math.floor(math.sqrt(num)+1))):
            if n % i == 0:
                return False
        return True

    @tangelo.types(n=int)
    def stream(n=2):
        for i in filter(prime, range(2, int(math.floor(math.sqrt(num)+1)))):
            if n % i == 0
                yield i

The ``stream()`` function returns a *generator object* - an object that returns
a prime divisor of its argument once for each call to its ``next()`` method.
When the code reaches its "end" (i.e., there are no more values to ``yield``),
the ``next()`` method raises a ``StopIteration`` exception.

In Python this object, and others that behave the same way, are known as
*iterables*.  Generators are valuable in particular because they generate values
as they are requested, unlike e.g. a list, which always retains all of its
values and therefore has a larger memory footprint.  In essence, a generator
trades space for time, then amortizes the time over multiple calls to
``next()``.

The Stream plugin leverages this idea to create *streaming services*.  When a
service module returns a generator object from its ``stream()`` function, the
plugin logs the generator object in a table, associates a key to it, and sends
this key as the response.  For example, an ajax request to the streaming API,
identifying the ``prime-factors`` service above, might yield the following
response:

.. code-block:: javascript

    {"key": "3dffee9e03cef2322a2961266ebff104"}

From this point on, values can be retrieved from the newly created generator
object by further engaging the streaming API.

The Stream REST API
^^^^^^^^^^^^^^^^^^^

The streaming API can be found at ``/plugin/stream/stream``.  The API is RESTful
and uses the following verbs:

* ``GET /plugin/stream/stream`` returns a list of all active stream keys.

* ``GET /plugin/stream/stream/<stream-key>`` returns some information about the
  named stream.

* ``POST /plugin/stream/stream/start/<path>/<to>/<streaming>/<service>`` runs
  the ``stream()`` function found in the service, generates a hexadecimal key,
  and logs it in a table of streaming services, finally returning the key.

* ``POST /api/stream/next/<stream-key>``  calls ``next()`` on the associated
  generator and returns a JSON object with the following form:

    .. code-block:: javascript

        {
            "finished": false,
            "data": <value>
        }

  The ``finished`` field indicates whether ``StopIteration`` was thrown, while
  the ``data`` field contains the value ``yield``\ ed from the generator object.
  If ``finished`` is ``true``, there will be no ``data`` field, and the stream
  key for that stream will become invalid.

* ``DELETE /api/stream/<stream-key>`` makes the stream key invalid, removes the
  generator object from the stream table, and returns a response showing which
  key was removed:

    .. code-block:: javascript

        {"key": "3dffee9e03cef2322a2961266ebff104"}

  This is meant to inform the client of which stream was deleted in the case
  where multiple deletions are in flight at once.

JavaScript Support for Streaming
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

``/plugin/stream/stream.js`` defines a clientside ``stream`` plugin that offers
a clean, callback-based JavaScript API to the streaming REST service:

.. js:function:: tangelo.plugin.stream.streams(callback)

    :param function(keys) callback: Callback invoked with the list of active
        stream keys

    Asynchronously retrieves a JSON-encoded list of all stream keys, then
    invokes `callback`, passing the keys in as a JavaScript list of strings.

.. js:function:: tangelo.plugin.stream.start(webpath, callback)

    :param string webpath: A relative or absolute web path, naming a
        stream-initiating web service
    :param function(key) callback: A function to call when the key for the new
        stream becomes available

    Asynchronously invokes the web service at `webpath` - which should initiate a
    stream by returning a Python iterable object from its `run()` method - then
    invokes `callback`, passing it the stream key associated with the new
    stream.

    This callback might, for example, log the key with the application so that
    it can be used later, possibly via calls to :js:func:`tangelo.plugin.stream.query`
    or :js:func:`tangelo.plugin.stream.run`:

    .. code-block:: javascript

        tangelo.plugin.stream.start("myservice", function (key) {
            app.key = key;
        });

.. js:function:: tangelo.plugin.stream.query(key, callback)

    :param string key: The key for the desired stream
    :param function(data, error) callback: The callback to invoke when results come
        back from the stream

    Runs the stream keyed by `key` for one step, then invokes `callback` with
    the result.  If there is an error, `callback` is instead invoked passing
    ``undefined`` as the first argument, and the error as the second.

.. js:function:: tangelo.plugin.stream.run(key, callback[, delay=100])

    :param string key: The key for the stream to run
    :param function(data) callback: The callback to pass stream data when it
        becomes available
    :param number delay: The delay in milliseconds between the return from a
        callback invocation, and the next stream query

    Runs the stream keyed by `key` continuously until it runs out, or there is
    an error, invoking `callback` with the results each time.  The `delay`
    parameter expresses in milliseconds the interval between when a callback
    returns, and when the stream is queried again.

    The behavior of `callback` can influence the future behavior of this
    function.  If `callback` returns a value, and the value is a

    * **function**, it will replace `callback` for the remainder of the stream
      queries;

    * **boolean**, it will stop running the stream if ``false``;

    * **number**, it will become the new delay, beginning with the very next
      stream query.

    * **object**, it will have the **function** effect above if there is a key
      ``callback``; the **boolean** effect above if there is a key ``continue``;
      the **number** effect above if there is a key ``delay`` (in other words,
      this allows for multiple effects to be declared at once).

    Other return types will simply be ignored.

.. js:function:: tangelo.plugin.stream.delete(key[, callback])

    :param string key: The key of the stream to delete
    :param function(error) callback: A callback that is passed an error object
        if an error occurs during deletion.

    Deletes the stream keyed by `key`.  The optional `callback` is a function
    that is invoked with an error object is something went wrong during the
    delete operation, or no arguments if the delete was successful.

VTKWeb
------

The VTKWeb plugin is able to run VTK Web programs and display the result in real
time on a webpage.  The interface is somewhat experimental at the moment and
only supports running the program and interacting with it via the mouse.  In a
later version, the ability to call functions and otherwise interact with VTK Web
in a programmatic way will be added.

In order to enable this funcationality, the plugin must be configured with a
``vtkpython`` option set to the full path to a ``vtkpython`` executable in a
build of VTK.

The VTK Web REST API
^^^^^^^^^^^^^^^^^^^^

The VTK Web API is found at `/plugin/vtkweb/vtkweb`.  The API is RESTful and
uses the following verbs:

* ``POST /plugin/vtkweb/vtkweb/full/path/to/vtkweb/script.py`` launches the
  named script (which must be given as an absolute path) and returns a JSON
  object similar to the following:

    .. code-block:: javascript

        {
            "status": "complete",
            "url": "ws://localhost:8080/ws/d74a945ca7e3fe39629aa623149126bf/ws",
            "key": "d74a945ca7e3fe39629aa623149126bf"
        }

  The ``url`` field contains a websocket endpoint that can be used to
  communicate with the VTK web process.  There is a *vtkweb.js* file (included
  in the Tangelo installation) that can use this information to hook up an HTML
  viewport to interact with the program, though for use with Tangelo, it is much
  simpler to use the JavaScript VTK Web library functions to abstract these
  details away.  The ``key`` field is, similarly to the streaming API, a
  hexadecimal string that identifies the process within Tangelo.

  In any case, receiving a response with a ``status`` field reading "complete"
  means that the process has started successfully.

* ``GET /plugin/vtkweb/vtkweb`` returns a list of keys for all active VTK Web
  processes.

* ``GET /plugin/vtkweb/vtkweb/<key>`` returns information about a particular VTK
  Web process.  For example:

    .. code-block:: javascript

        {
            "status": "complete",
            "process": "running",
            "port": 52446,
            "stderr": [],
            "stdout": [
                "2014-02-26 10:00:34-0500 [-] Starting factory <vtk.web.wamp.ReapingWampServerFactory instance at 0x272b2d8>\n",
                "2014-02-26 10:00:34-0500 [-] ReapingWampServerFactory starting on 52446\n",
                "2014-02-26 10:00:34-0500 [-] Log opened.\n",
                "2014-02-26 10:00:34-0500 [VTKWebApp,0,127.0.0.1] Client has reconnected, cancelling reaper\n",
                "2014-02-26 10:00:34-0500 [VTKWebApp,0,127.0.0.1] on_connect: connection count = 1\n"
            ]
        }

  The ``status`` field indicates that the request for information was
  successful, while the remaining fields give information about the running
  process.  In particular, the ``stderr`` and ``stdout`` streams are queried for
  any lines of text they contain, and these are delivered as well.  These can be
  useful for debugging purposes.

  If a process has ended, the ``process`` field will read ``terminated`` and
  there will be an additional field ``returncode`` containing the exit code of
  the process.

* ``DELETE /plugin/vtkweb/vtkweb/<key>`` terminates the associated VTK process
  and returns a response containing the key:

    .. code-block:: javascript

        {
            "status": "complete",
            "key": "d74a945ca7e3fe39629aa623149126bf"
        }

  As with the streaming ``DELETE`` action, the key is returned to help
  differentiate which deletion has completed, in case multiple ``DELETE``
  requests are in flight at the same time.

JavaScript Support for VTK Web
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

As with the Stream plugin's JavaScript functions, ``/plugin/vtkweb/vtkweb.js``
defines a clientside plugin providing a clean, callback-based interface to the
low-level REST API:

.. js:function:: tangelo.plugin.vtkweb.processes(callback)

    :param function(keys) callback: The callback to invoke when the list of keys
        becomes available

    Asynchronously retrieves a list of VTK Web process keys, and invokes
    `callback` with the list.

.. js:function:: tangelo.plugin.vtkweb.info(key, callback)

    :param string key: The key for the requested VTK Web process
    :param function(object) callback: The callback to invoke when the info
        report becomes available

    Retrieves a status report about the VTK Web process keyed by `key`, then
    invokes `callback` with it when it becomes available.

    The report is a JavaScript object containing a ``status`` field indicating
    whether the request succeeded ("complete") or not ("failed").  If the status
    is "failed", the ``reason`` field will explain why.

    A successful report will contain a ``process`` field that reads either
    "running" or "terminated".  For a terminated process, the ``returncode``
    field will contain the exit code of the process.

    For running processes, there are additional fields: ``port``, reporting the
    port number the process is running on, and ``stdout`` and ``stderr``, which
    contain a list of lines coming from those two output streams.

    This function may be useful for debugging an errant VTK Web script.

.. js:function:: tangelo.plugin.vtkweb.launch(cfg)

    :param string cfg.url: A relative or absolute web path referring to a VTK
        Web script
    :param string cfg.argstring: A string containing command line arguments to
        pass to the launcher script
    :param string cfg.viewport: A CSS selector for the ``div`` element to serve
        as the graphics viewport for the running process
    :param function(key,error) cfg.callback: A callback that reports the key of
        the new process, or the error that occured

    Attempts to launch a new VTK Web process by running a Python script found at
    `cfg.url`, passing `cfg.argstring` as commandline arguments to the launcher
    script.  If successful, the streaming image output will be sent to the first
    DOM element matching the CSS selector given in `cfg.viewport`, which should
    generally be a ``div`` element.

    After the launch attempt succeeds or fails, `callback` is invoked, passing
    the process key as the first argument, and the error object describing any
    errors that occurred as the second (or ``undefined`` if there was no error).

.. js:function:: tangelo.plugin.vtkweb.terminate(key[, callback])

    :param string key: The key of the process to terminate
    :param function(key,viewport,error) callback: A callback that will be
        invoked upon completion of the termination attempt

    Attempts to terminate the VTK Web process keyed by `key`.  If there is a
    `callback`, it will be invoked with the key of the terminated process, the
    DOM element that was the viewport for that process, and an error (if any).
    The key is passed to the callback in case this function is called several
    times at once, and you wish to distinguish between the termination of
    different processes.  The DOM element is passed in case you wish to change
    something about the appearance of the element upon termination.

Girder
------

`Girder <http://girder.readthedocs.org/en/latest/>`_ is an open-source,
high-performance data management platform.  The Girder plugin mounts a working
instance of Girder in the plugin namespace so that its web client and REST API
become available for use with Tangelo web applications.

When the plugin is loaded, ``/plugin/girder/girder`` will serve out the web
frontend to Girder, while ``/plugin/girder/girder/api/v1`` will point to the
REST API documentation, as well as serving as the base URL for all API calls to
Girder.

For more information about how to use Girder, see its `documentation
<http://girder.readthedocs.org/en/latest/>`_.

Utilities
=========

These plugins do not represent core, substantive functionality, but rather
utility functions that significantly ease the process of creating web
applications.

Config
------

Many web applications need to change their behavior depending on external
resources or other factors.  For instance, if an application makes use of a
Mongo database, a particular deployment of that application may wish to specify
just which database to use.  To this end, the Config plugin works to provide a
simple way to configure the runtime behavior of applications, by using a file
containing a JSON object as a key-value store representing the configuration.

The plugin provides a web service at ``/plugin/config/config`` that simply
parses a JSON file and returns a JSON object representing the contents of the
file.  The API is as follows:

* ``GET /plugin/config/config/<absolute>/<webpath>/<to>/<json>/<file>[?required]``

If the path specified does not point to a static file, or does not contain a
valid JSON object, the call will result in an HTTP 4xx error, with the body
expressing the particular reason for the error in a JSON response.  Otherwise,
the service will parse the file and return the configuration object in the
"result" field of the response.

If the file does not exist, then the behavior of the service depends on the
presence of absence of the ``required`` parameter:  when the call is made *with*
the parameter, this results in a 404 error; otherwise, the service returns an
empty object.  This is meant to express the use case where an application *can*
use a configuration file if specified, falling back on defaults if there is
none.

The plugin also supplies a JavaScript plugin via ``/plugin/config/config.js``;
like other JavaScript plugin components, it provides a callback-based function
that engages the service on the user's behalf:

.. js:function:: tangelo.plugin.config.config(url[, required], callback)

    :param url string: An absolute or relative URL to the configuration file
    :param required boolean: A flag indicating whether the configuration file is
        required or not (default: ``false``)
    :param callback(config) function: Callback invoked with configuration data
        when it becomes available

    Engages the config service using the file specified by `url`, invoking
    `callback` with the configuration when it becomes available.  The optional
    `required` flag, if set to ``true``, causes `callback` to be invoked with
    ``undefined`` when the configuration file doesn't exist; when set to
    ``false`` or not supplied, a non-existent configuration file results in
    `callback` being invoked with ``{}``.

SVG2PDF
-------

User Interface
--------------

Data Management and Processing
==============================

Data
----

Mongo
-----

Impala
------

Visualization
=============

Vis
---

Mapping
-------

Bokeh
-----
