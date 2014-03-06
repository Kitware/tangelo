======================
    Advanced Usage
======================

.. _streaming:

Streaming
=========

It may be necessary to return an immense (or even :root:`infinite
</examples/primes>`) amount of data from a web service to
the client.  However, this may take up so much time and memory that dealing with
it becomes intractable.  In such situations, Tangelo's *Streaming API* may be
able to help.

Generators in Python
--------------------

Essentially, Tangelo's streaming capability works by exposing Python's
abstraction of `generators
<http://docs.python.org/2/reference/expressions.html#yield-expressions>`_
through Tangelo's service API.  If a service function uses the ``yield`` keyword
instead of ``return``, thus marking it as a generator function, then Tangelo
behaves differently when the resulting service is invoked.  Here is an example
of such a service, in a hypothetical file named ``prime-factors.py``:

.. code-block:: python

    import math
    import tangelo

    def prime(n):
        for i in xrange(2, int(math.floor(math.sqrt(num)+1))):
            if n % i == 0:
                return False
        return True

    @tangelo.types(n=int)
    def run(n=2):
        for i in filter(prime, range(2, int(math.floor(math.sqrt(num)+1)))):
            if n % i == 0
                yield i

The ``run()`` method returns a *generator object* - an object that returns a
prime divisor of its argument once for each call to its ``next()`` method.  When
the code reaches its "end" (i.e., there are no more values to ``yield``), the
``next()`` method raises a ``StopIteration`` exception.

In Python this object, and others that behave the same way, are known as
*iterables*.  Generators are valuable in particular because they generate values
as they are requested, unlike e.g. a list, which always retains all of its
values and therefore has a larger memory footprint.  In essence, a generator
trades space for time, then amortizes the time over multiple calls to
``next()``.

Tangelo leverages this idea to create *streaming services*.  When a service
returns a generator object from its ``run()`` or RESTful methods, Tangelo
responds to a request to that service by logging the generator object in a
table, associating a hexadecimal key to it, and sending the key as the response.
For example, an ajax request to the ``prime-factors`` service above might yield
the following response:

.. code-block:: javascript

    {"key": "3dffee9e03cef2322a2961266ebff104"}

From this point on, values can be retrieved from the newly created generator
object by engaging the *streaming API*.

The Streaming REST API
----------------------

The streaming API is found at :root:`/stream`.  The API is RESTful
and uses the following verbs:

* ``GET /stream`` returns a list of all active stream keys.

* ``GET /stream/<stream-key>`` calls ``next()`` on the associated generator and
  returns a JSON object with the following form:

    .. code-block:: javascript

        {
            "finished": false,
            "data": <value>
        }

  The ``finished`` field indicates whether ``StopIteration`` was thrown, while
  the ``data`` field contains the value ``yield``\ ed from the generator object.
  If ``finished`` is ``true``, there will be no ``data`` field, and the stream
  key for that stream will become invalid.

* ``DELETE /stream/<stream-key>`` makes the stream key invalid, removes the
  generator object from the stream table, and returns a response showing which
  key was removed:

    .. code-block:: javascript

        {"key": "3dffee9e03cef2322a2961266ebff104"}

  This is meant to inform the client of which stream was deleted in the case
  where multiple deletions are in flight at once.

JavaScript Support for Streaming
--------------------------------

The ``tangelo.stream`` namespace of functions in *tangelo.js* offers a clean,
callback-based JavaScript API to the streaming REST service.  See
:ref:`streaming-js` for more information.

.. _vtkweb:

VTK Web
=======

Tangelo is able to run VTK Web programs through the VTK Web REST API.  The
interface is somewhat experimental at the moment and only supports running the
program and interacting with it via the mouse.  In a later version, the ability
to call functions and otherwise interact with VTK Web in a programmatic way will
be added.

In order to enable this funcationality, Tangelo must be launched with the
``vtkpython`` option in the configuration file (see :ref:`config-options`) set
to the full path to a ``vtkpython`` executable in a build of VTK (or,
alternatively, with the ``--vtkpython`` option set on the command line).

The VTK Web REST API
--------------------

The VTK Web API is found at :root:`/vtkweb`.  The API is RESTful
and uses the following verbs:

* ``POST /vtkweb/full/path/to/vtkweb/script.py`` launches the named script
  (which must be given as an absolute path) and returns a JSON object similar to
  the following:

    .. code-block:: javascript

        {
            "status": "complete",
            "url": "ws://localhost:8080/d74a945ca7e3fe39629aa623149126bf/ws",
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

* ``GET /vtkweb`` returns a list of keys for all active VTK Web processes.

* ``GET /vtkweb/<key>`` returns information about a particular VTK Web process.
  For example:

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

* ``DELETE /vtkweb/<key>`` terminates the associated VTK process and returns a
  response containing the key:

    .. code-block:: javascript

        {
            "status": "complete",
            "key": "d74a945ca7e3fe39629aa623149126bf"
        }

  As with the streaming ``DELETE`` action, the key is returned to help
  differentiate which deletion has completed, in case multiple ``DELETE``
  requests are in flight at the same time.

JavaScript Support for VTK Web
------------------------------

As with the streaming JavaScript functions, the ``tangelo.vtkweb`` contains
JavaScript functions providing a clean, callback-based interface to the
low-level REST API.  See :ref:`vtkweb-js` for full details.
