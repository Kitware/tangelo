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

.. py:function:: tangelo.log([context, ]msg[, lvl=loglevel])

    Writes a message `msg` to the log file.  The optional `context` is a
    descriptive tag that will be prepended to the message within the log file
    (defaulting to "TANGELO" if omitted).  Common context tags used internally
    in Tangelo include "TANGELO" (to describe startup/shutdown activities), and
    "ENGINE" (which describes actions being taken by CherryPy).  This function
    may be useful for debugging or otherwise tracking a service's activities as
    it runs.  The optional logging level ``lvl`` is one of the python logging
    constants.  By default, ``logging.INFO`` is used.

    Generally you should use one of the variants of this function listed below,
    but if you want to write a logging message in the terminal's default color,
    you can use this function, specifying the log level you need.

.. py:function:: tangelo.log_debug([context, ]msg)

    Variant of :py:func:`tangelo.log` that writes out messages in blue, at level
    ``logging.DEBUG``.  These messages can be used to diagnose, e.g., plugins or
    services in development.  By default, these messages are hidden - you can
    increase the verbosity to see them.

.. py:function:: tangelo.log_info([context, ]msg)

    Variant of :py:func:`tangelo.log` that writes out messages in purple at
    level ``logging.INFO``.  Informational messages describe what the system is
    doing at the moment.  For example, when a plugin is about to perform
    initialization, a call like ``tangelo.log_info("FOOBAR", "About to
    initialize...")`` may be appropriate.

.. py:function:: tangelo.log_warning([context, ]msg)

    Variant of :py:func:`tangelo.log` that writes out messages in yellow at
    level ``logging.WARNING``.  Warnings are messages indicating that something
    did not work out as expected, but the requested action will still be
    accomplished (perhaps differently than was expected by the user).  For
    example, if a plugin needs to fall back on a default method for doing
    something because the requested method was not available, this might be
    reported by a warning message.

.. py:function:: tangelo.log_error([context, ]msg)

    Variant of :py:func:`tangelo.log` that writes out messages in red at level
    ``logging.ERROR``.  Errors describe instances when Tangelo or a plugin fails
    to perform a requested task, without compromising Tangelo's ability to
    continue running.  For example, if a plugin requires a file that is missing,
    it might report an error condition using this function.

.. py:function:: tangelo.log_critical([context, ]msg)

    Variant of :py:func:`tangelo.log` that writes out messages in bright, bold
    red at level ``logging.CRITICAL``.  Critical errors describe conditions that
    immediately prevent the further functioning of the system, generally leading
    to Tangelo halting.  Generally, you will not need to call this function.

HTTP Interaction
================

.. py:function:: tangelo.content_type([type])

    Returns the content type for the current request, as a string.  If `type`
    is specified, also sets the content type to the specified string.

.. py:function:: tangelo.http_status(code[, message])

    Sets the HTTP status code for the current request's response.  `code` should
    be an integer; optional `message` can give a concise description of the
    code.  Omitting it results in a standard message; for instance,
    ``tangelo.http_status(404)`` will send back a status of ``404 Not Found``.

    This function can be called before returning, e.g., a ``dict`` describing in
    detail what went wrong.  Then, the response will indicate the general error
    while the body contains error details, which may be informational for the
    client, or useful for debugging.

.. py:function:: tangelo.header(header_name[, new_value])

    Returns the value associated to `header_name` in the HTTP headers, or
    ``None`` if the header is not present.

    If `new_value` is supplied, the header value will additionally be replaced
    by that value.

.. py:function:: tangelo.request_header(header_name)

    Returns the value associated to `header_name` in the request headers, or
    ``None`` if the header is not present.

.. py:function:: tangelo.request_path()

    Returns the path of the current request.  This is generally the sequence of
    path components following the domain and port number in a URL.

.. py:function:: tangelo.request_body()

    Returns a filelike object that streams out the body of the current request.
    This can be useful, e.g., for retrieving data submitted in the body for a
    POST request.

.. py:function:: tangelo.session(key[, value])

    Returns the value currently associated to the session key `key`, or `None`
    if there is no such key.  If `value` is given, it will become newly associated
    to `key`.

.. py:function:: tangelo.redirect(path[, status_code])

    Used to signal the browser that a web service wants to perform an HTTP
    redirect to a different `path`. The optional `status_code` should be a value
    in the ``3xx`` range indicating the type of redirect desired; it defaults to
    ``303``.

    In the following example service,

    .. code:: python

        import tangelo

        def run():
            return tangelo.redirect("other/path/content.html")

    Tangelo will direct the client to the URL shown, resulting in that file
    being served instead of the service itself.

.. py:function:: tangelo.internal_redirect(path)

    Used to signal the server to serve content from a different path in place of
    the current service; similar to :py:func:`tangelo.redirect()` but without
    informing the client of the redirection.

    The example above will look very similar using this function instead:

    .. code:: python

        import tangelo

        def run():
            return tangelo.internal_redirect("other/path/content.html")

    When this internal redirection occurs, the browser's displayed URL, for
    example, will not change to reflect the requested path.

.. py:function:: tangelo.file(path[, content_type="application/octet-stream"])

    Used to signal the server to serve content from the file at `path` as if it
    were being served statically. By using appropriate absolute or relative
    paths, this function can be used to serve content from a Tangelo service
    that is not otherwise available from Tangelo's web root. It can be used as
    follows:

    .. code:: python

        import tangelo

        def run():
            return tangelo.file("/some/crazy/path/to/content.txt", content_type="text/plain")

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

.. py:function:: tangelo.config()

    Returns a copy of the service configuration dictionary (see
    :ref:`configuration`).

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

.. py:decorator:: tangelo.types(arg1=type1,...,argN=typeN)

    Decorates a service by converting it from a function of several string
    arguments to a function taking typed arguments.  Each argument to
    ``tangelo.types()`` is a function that converts strings to some other type -
    the standard Python functions ``int()``, ``float()``, and ``json.loads()``
    are good examples.  The functions are passed in as keyword arguments, with
    the keyword naming an argument in the decorated function.  For example, the
    following code snippet

    .. code-block:: python

        import tangelo

        def stringfunc(a, b):
            return a + b

        @tangelo.types(a=int, b=int)
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
