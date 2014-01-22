==============================
    Python Web Service API
==============================

.. py:function:: tangelo.content_type([type])

    Returns the content type for the current request, as a string.  If ``type``
    is specified, also sets the content type to the specified string.

.. py:function:: tangelo.log(msg[, context])

    Writes a message ``msg`` to the log file.  If ``context`` is supplied, it
    will be prepended to the message within the log file.  This function may be
    useful for debugging or otherwise tracking a service's activities as it
    runs.

.. py:function:: tangelo.request_path()

    Returns the path of the current request.  This is generally the sequence of
    path components following the domain and port number in a URL.

.. py:function:: tangelo.paths(paths)

    Augments the Python system path with the list of web directories specified
    in ``paths``.  Each path must be **within the web root directory** or
    **within a user's web home directory**.  For example, ``/~troi/libs`` would
    be allowed, as would ``/section31/common/`` because both directories are
    subdirectories of a top-level web directory - one in a user's home
    directory, and the other under the web root.  However,
    ``/~picard/../../libs`` would be illegal, since it does not refer to any
    file accessible via Tangelo.

    This function can be used to let web services access commonly used functions
    that are implemented in their own Python modules somewhere in the web
    filesystem.

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

    The decorator also has the effect of preventing accidental exposure of
    support functions in a RESTful service.

    Note that Tangelo automatically converts the verb used by the web client to
    all lowercase letters before searching the Python module for a matching
    function to call.

.. py:class:: tangelo.HTTPStatusCode(code[, description])

    Construct an HTTP status object signalling the status code given by ``code``
    and a custom description of the status given by ``description``.  If
    ``description`` is not specified, then a standard description will appear
    based on the code (e.g., "Not Found" for code 404, etc.).

    An ``HTTPStatusCode`` object can be returned from a Python service to cause
    the server to raise that code instead of sending back a response.  This can
    be useful to signal situations like bad arguments, failure to find the
    requested object, etc.
