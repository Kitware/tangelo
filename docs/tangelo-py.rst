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

.. py:function:: tangelo.request_body()

    Returns a filelike object that streams out the body of the current request.
    This can be useful, e.g., for retrieving data submitted in the body for a
    POST request.

.. py:function:: tangelo.legal_path(path)

    Returns a pair indicating whether ``path``, a string naming a web path
    (without the leading slash), refers to a file or directory within Tangelo's
    web space.  The first element of the pair is a boolean indicating whether
    the path is legal; the second element is a string giving further information
    about the path.

    If the path begins with a slash, it is not considered legal; the description
    will read "absolute" in this case.

    If the path begins with a tilde, the path is legal if it resolves to a
    location within the named user's ``tangelo_html`` directory; the description
    will read "home directory" in this case.

    For paths not starting with a tilde, the path is legal if it resolves to a
    location within the web root directory; the description reads "web root" in
    that case.

    This function is used mainly to reject file paths containing ``..`` or
    similar, that may start in a legal location and move outside of Tangelo's
    web space.  This ensures that services do not unwittingly manipulate files
    they should not.

    For example, ``~troi/libs`` would be pass, as would ``section31/common/``
    because both paths refer to subdirectories of an allowed directory - one in
    a user's home directory, and the other under the web root.  However,
    ``/~picard/../../libs`` would be illegal, since it does not refer to any
    file accessible via Tangelo.

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

.. py:class:: tangelo.HTTPStatusCode(code[, description])

    Constructs an HTTP status object signalling the status code given by ``code``
    and a custom description of the status given by ``description``.  If
    ``description`` is not specified, then a standard description will appear
    based on the code (e.g., "Not Found" for code 404, etc.).

    An ``HTTPStatusCode`` object can be returned from a Python service to cause
    the server to raise that code instead of sending back a response.  This can
    be useful to signal situations like bad arguments, failure to find the
    requested object, etc.
