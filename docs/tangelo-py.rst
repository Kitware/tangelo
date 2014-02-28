==============================
    Python Web Service API
==============================

The web service API is a collection of Python functions meant to help write web
service scripts in as "Pythonic" a way as possible.  The functionality is
divided into severul areas:  core services for generally useful utilities; HTTP
interaction, for manipulating request headers, retrieving request bodies, and
formatting errors; and web service utilities to supercharge Python services.

Core Services
=============

.. py:function:: tangelo.log(msg[, context])

    Writes a message ``msg`` to the log file.  If ``context`` is supplied, it
    will be prepended to the message within the log file.  This function may be
    useful for debugging or otherwise tracking a service's activities as it
    runs.

.. py:function:: tangelo.abspath(webpath)

    Takes a "web path" and computes a disk path to the referenced file, *if* it
    references a location within Tangelo's legal web space.

    The path, passed into argument `webpath`, must be an absolute web path;
    i.e., it must begin with a slash.  If the second character of the path is a
    tilde, it will be converted to a user home directory path, while non-tilde
    paths will resolve to a location within Tangelo's web root directory.

    Path components such as ``.`` and ``..`` are resolved to yield a possible
    absolute disk path; if this path lies outside of the legal web space, then
    the function returns ``None``; otherwise, it returns this path.

    This function is useful for preventing errant paths from allowing a Tangelo
    service to manipulate files that it shouldn't, while yielding access to
    files that are allowed.

    For example, `/~troi/libs` would yield something like
    `/home/troi/tangelo_html/lib`, and `/section31/common/` would yield
    something like `/srv/tangelo/section31/common` because both paths refer to
    subdirectories of an allowed directory - one in a user's home directory, and
    the other under the web root.  However, `/~picard/../../libs` would yield
    ``None``, since it does not refer to any file accessible via Tangelo.

HTTP Interaction
================

.. py:function:: tangelo.content_type([type])

    Returns the content type for the current request, as a string.  If ``type``
    is specified, also sets the content type to the specified string.

.. py:function:: tangelo.request_path()

    Returns the path of the current request.  This is generally the sequence of
    path components following the domain and port number in a URL.

.. py:function:: tangelo.request_body()

    Returns a filelike object that streams out the body of the current request.
    This can be useful, e.g., for retrieving data submitted in the body for a
    POST request.

.. py:class:: tangelo.HTTPStatusCode(code[, description])

    Constructs an HTTP status object signalling the status code given by ``code``
    and a custom description of the status given by ``description``.  If
    ``description`` is not specified, then a standard description will appear
    based on the code (e.g., "Not Found" for code 404, etc.).

    An ``HTTPStatusCode`` object can be returned from a Python service to cause
    the server to raise that code instead of sending back a response.  This can
    be useful to signal situations like bad arguments, failure to find the
    requested object, etc.

Web Services Utilities
======================

.. py:function:: tangelo.paths(paths)

    Augments the Python system path with the list of web directories specified
    in ``paths``.  Each path must be **within the web root directory** or
    **within a user's web home directory** (i.e., the paths must be legal with
    respect to ``tangelo.legal_path()``).

    This function can be used to let web services access commonly used functions
    that are implemented in their own Python modules somewhere in the web
    filesystem.

    After a service calling this function returns, the system path will be
    restored to its original state.  This requires calling ``tangelo.paths()``
    in every function wishing to change the path, but prevents shadowing of
    expected locations by modules with the same name in other directories, and
    the uncontrolled growth of the ``sys.path`` variable.

.. py:decorator:: tangelo.restful

    Marks a function in a Python service file as being part of that service's
    RESTful API.  This prevents accidental exposure of unmarked support
    functions as part of the API, and also enables the use of arbitrary words as
    REST verbs (so long as those words are also valid Python function names).
    An example usage might look like the following, which uses a both a standard
    verb ("GET") and a custom one ("NORMALIZE").

    .. code-block:: python

        import tangelo

        @tangelo.restful
        def get(foo, bar, baz=None):
            pass

        @tangelo.restful
        def normalize():
            pass

    Note that Tangelo automatically converts the verb used by the web client to
    all lowercase letters before searching the Python module for a matching
    function to call.

.. py:decorator:: tangelo.types([ptype1,...,ptypeN],kwarg1=kwtype1,...,kwargN=kwtypeN)

    Decorates a service by converting it from a function of several string arguments
    to a function taking typed arguments.  Each argument to ``tangelo.types()`` is a
    function that converts strings to some other type - the standard Python
    functions ``int()``, ``float()``, and ``json.loads()`` are good examples.  The
    positional and keyword arguments represent the types of the positional and
    keyword arguments, respectively, of the function.  For example, the following
    code snippet

    .. code-block:: python

        import tangelo

        def stringfunc(a, b):
            return a + b

        @types(int, int)
        def intfunc(a, b):
            return a + b

        print stringfunc("3", "4")
        print intfunc("3", "4")

    will print::

        34
        7

    ``stringfunc()`` performs string concatentation, while ``intfunc()`` performs
    addition on strings that have been converted to integers.

    Though the names of the built-in conversion functions make this decorator look
    like it accepts "types" as arguments, any function that maps strings to any type
    can be used.  For instance, a string representing the current time could be
    consumed by a function that parses the string and returns a Python ``datetime``
    object, or, as mentioned above, ``json.loads()`` could be used to convert
    arbitrary JSON data into Python objects.

    If an exception is raised by any of the conversion functions, its error message
    will be passed back to the client via a :py:class:`tangelo.HTTPStatusCode`
    object.

.. py:decorator:: tangelo.return_type(type)

    Similarly to how :py:func:`tangelo.types` works, this decorator can be used to
    provide a function to convert the return value of a service function to some
    other type or form.  By default, return values are converted to JSON via the
    standard ``json.dumps()`` function.  However, this may not be sufficient in
    certain cases.  For example, the ``bson.dumps()`` is a function provided by
    PyMongo that can handle certain types of objects that ``json.dumps()`` cannot,
    such as ``datetime`` objects.  In such a case, the service module can provide
    whatever functions it needs (e.g., by ``import``\ ing an appropriate module or
    package) then naming the conversion function in this decorator.
