==================================
    Tangelo JavaScript Library
==================================

The Tangelo clientside library (*tangelo.js*) contains functions to help work
with Tangelo, including basic support for creating web applications.  These
functions represent basic tasks that are widely useful in working with web
applications; for advanced functionality and associated JavaScript/Python
functions, see :ref:`bundled`.

.. js:function:: tangelo.version()

    :rtype: **string** -- the version string

    Returns a string representing Tangelo's current version number.  See
    :ref:`versioning` for more information on Tangelo version numbers.

.. js:function:: tangelo.getPlugin(pluginName)

    :param pluginName string: The name of the plugin to retrieve

    :rtype: **object** -- the contents of the requested plugin

    Returns an object containing the plugin contents for `pluginName`.  If
    `pluginName` does not yet exist as a plugin, the function first creates it
    as an empty object.

    This is a standard way to create and work with plugins.  For instance, if
    ``foobar.js`` introduces the *foobar* clientside plugin, it may contain code
    like this:

    .. code-block:: javascript

        var plugin = tangelo.getPlugin("foobar");

        plugin.awesomeFunction = function () { ... };

        plugin.greatConstant = ...

    The contents of this example plugin would hereafter be accessible via
    ``tangelo.plugin.foobar``.

.. js:function:: tangelo.pluginUrl(plugin[, *pathComponents])

    :param string api: The name of the Tangelo plugin to construct a URL for.

    :param string \*pathComponents: Any extra path components to be appended to
        the constructed URL.

    :rtype: **string** -- the URL corresponding to the requested plugin and path

    Constructs and returns a URL for the named `plugin`, with optional trailing
    path components listed in the remaining arguments to the function.

    For example, a call to ``tangelo.pluginUrl("stream", "next", "a1b2c3d4e5")``
    will return the string ``"/plugin/stream/next/a1b2c3d4e5"``.  This function is
    useful for calls to, e.g., ``$.ajax()`` when engaging a Tangelo plugin.

.. js:function:: tangelo.queryArguments()

    :rtype: **object** -- the query arguments as key-value pairs

    Returns an object whose key-value pairs are the query arguments passed to
    the current web page.

    This function may be useful to customize page content based on query
    arguments, or for restoring state based on configuration options, etc.

.. js:function:: tangelo.absoluteUrl(webpath)

    :param string webpath: an absolute or relative web path
    :rtype: **string** -- an absolute URL corresponding to the input webpath

    Computes an absolute web path for `webpath` based on the current location.
    If `webpath` is already an absolute path, it is returned unchanged;
    if relative, the return value has the appropriate prefix computed and prepended.

    For example, if called from a page residing at ``/foo/bar/index.html``,
    ``tangelo.absoluteUrl("../baz/qux/blah.html")`` would yield
    ``/foo/baz/qux/blah.html``, and ``tangelo.absoluteUrl("/one/two/three")``
    would yield ``/one/two/three``.

.. js:function:: tangelo.accessor([spec])

    :param spec object: The accessor specification
    :rtype: **function** -- the accessor function

    Returns an *accessor function* that behaves according to the accessor
    specification `spec`.  Accessor functions generally take as input a
    JavaScript object, and return some value that may or may not be related to
    that object.  For instance, ``tangelo.accessor({field: "mass"})`` returns a
    function equivalent to:

    .. code-block:: javascript

        function (d) {
            return d.mass;
        }

    while ``tangelo.accessor({value: 47})`` return a constant function that
    returns 47, regardless of its input.

    As a special case, if `spec` is missing, or equal to the empty object
    ``{}``, then the return value is the ``undefined accessor``, which simply
    raises a fatal error when called.

    For more information of the semantics of the `spec` argument, see
    :ref:`accessor`.
