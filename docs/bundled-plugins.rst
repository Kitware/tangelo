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

Girder
------

Utilities
=========

Config
------

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
