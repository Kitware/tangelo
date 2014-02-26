======================
    Advanced Usage
======================

.. _streaming:

Streaming
=========

It may be necessary to return an immense (or even `infinite
<http://localhost:8080/examples/primes/>`_) amount of data from a web service to
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

The streaming API is found at http://localhost:8080/stream.  The API is RESTful
and uses the following verbs:

* ``GET /stream/`` returns a list of all active stream keys.

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

VTK Web
=======

.. todo::
    Fill in VTK Web section

Integrating with Other Webservers
=================================

.. todo::
    Fill in integrating with Apache section
