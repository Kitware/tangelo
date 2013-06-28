===================================
    Tangelo Web Application API
===================================

Core Module
===========

.. js:function:: tangelo.namespace(spec)

    Returns the specified namespace, creating it if it doesn't exist.

    ``spec`` is a string consisting of one or more namespace names, separated by
    periods.  Each namespace is implemented as a Javascript object (their names
    must therefore be valid Javascript variable names).  These namespaces are
    added to the global Tangelo namespace, named ``tangelo``.  For example,

    .. code-block:: javascript

        var mod = tangelo.namespace("util.maps");

        mod.getStarMap = function (organization) {
            .
            .
            .
        };

    will result in the creation of a namespace object ``tangelo.util.maps``
    containing a function ``getStarMap()`` that can be addressed in client code
    as ``tangelo.util.maps.getStarMap()``.

    This function is used to create new modules to implement custom behavior,
    etc.

Date Module
===========

.. js:function:: tangelo.date.monthNames()

    Returns an array of abbreviated month names (useful for creating
    month-related labels, etc.).

.. js:function:: tangelo.date.monthNames()

    Returns an array of abbreviated day names (useful for creating day-related
    labels, etc.).

.. js:function:: tangelo.toShortString(date)

    :param Date date: A date object to format into a string

    Returns a string representing ``date`` in this format: ``Oct 30, 1981
    (05:31:00)``.

.. js:function:: Date.prototype.getMonthName()

    Returns the abbreviated month name associated with the Date object.

.. js:function:: Date.prototype.getDayName()

    Returns the abbreviated day name associated with the Date object.

.. js:function:: tangelo.date.displayDate(date)

    :param Date date: A date object to format into a string

    Returns a string representing ``date`` in this format: ``Oct 30, 1981``

Util Module
===========

.. js:function:: drawer_size()

    Returns the height of the drawer handle icon (for use in laying out drawer
    elements).

    .. todo::
        This function should simply be a private variable within the module.

.. js:function:: drawer_toggle(container, icon)

    :param string container: CSS selector for the element containing the control panel drawer
    :param string icon: CSS selector for the element containing the drawer handle icon

    Returns a function that can be used as the open/close callback for a control
    panel.  The function causes the height of the control panel element to
    toggle between full height (open) and zero height (closed).

.. js:function:: svgColorLegend(cfg)

    :param string cfg.legend: CSS selector for SVG group element that will contain the legend
    :param function cfg.cmap_func: A colormapping function to create color patches for the legend entries
    :param int cfg.xoffset: How far, in pixels, to set the legend from the left edge of the parent SVG element.
    :param int cfg.yoffset: How far, in pixels, to set the legend from the top edge of the parent SVG element.
    :param string[] cfg.categories: A list of strings naming the categories represented in the legend.
    :param int cfg.height_padding: How much space, in pixels, to place between legend entries.
    :param int cfg.width_padding: How much space, in pixels, to place between a color patch and its associated label
    :param int cfg.text_spacing: How far, in pixels, to raise text labels (used to vertically center text within the vertical space occupied by a color patch).
    :param object cfg.legend_margins: An object with (optional) fields ``top``, ``bottom``, ``left``, and ``right``, specifying how much space, in pixels, to leave between the edge of the legend and the entries.
    :param bool cfg.clear: Whether to clear out the previous contents of the element selected by ``cfg.legend``.

    Constructs an SVG color legend in the ``g`` element specified by
    ``cfg.legend``, mapping colors from the elements of ``cfg.categories``
    through the function ``cfg.cmap_func``.

.. js:function:: getMongoRange(host, database, collection, field, callback)

    :param string host: MongoDB hostname
    :param string database: MongoDB database on ``host``
    :param string collection: MongoDB collection in ``database``
    :param string field: Target field within ``collection``
    :param function callback: Function to call on range results

    Finds the two extreme values in field ``field`` of ``collection``
    in ``database`` on Mongo server ``host``, then calls ``callback`` passing
    these two values as arguments.

    This function could be used, for example, to find the earliest and latest
    events in a Mongo collection, then use that information to set up a date
    selector element in the webpage.

.. js:function:: allDefined([arg1, ..., argN])

    Returns ``true`` if all arguments are defined, and ``false`` otherwise.

.. js:function:: landingPage(cfg)

    :param string cfg.specFile: JSON file describing what applications will be listed on the page.
    :param string cfg.leftColumn: CSS selector for left text column
    :param string cfg.rightColumn: CSS selector for right text column
    :param string cfg.leftExternalColumn: CSS selector for left text column for external applications
    :param string cfg.rightExternalColumn: CSS selector for right text column for external applications

    Constructs a landing page describing one or more other applications on a
    server.  ``cfg.specFile`` points to a JSON file containing a single object
    with two fields, "apps" and "external".  The "apps" field is a list of
    objects, each of which has three fields: "name", giving the title (and link
    text) for an application; "path", giving the link target for the app; and
    "description", containing descriptive HTML text that will describe the
    application within the list.  The "external" field also contains a list of
    objects, with the following fields: "name", as before; "link", containing a
    link to the external webpage for the project; "institution", giving the name
    of the organization that hosts the external project; "institution_link",
    giving a link target for the institution; and "description", as before.

    This function lists out the projects in the JSON file columnwise into two
    columns (specified by ``cfg.leftColumn``, ``cfg.rightColumn``,
    ``cfg.leftExternalColumn``, and ``cfg.rightExternalColumn``), placing links
    and descriptive text appropriately.

.. js:class:: defaults(inputSpec, callback)

    Constructs a key/value store object, initializing it with the information
    found in ``inputSpec``.

    If ``inputSpec`` is a Javascript object, its contents are used directly as
    the initialization data for the ``defaults`` object.  Otherwise, if
    ``inputSpec`` is a string, it is treated as the path to a JSON file that
    encodes a single Javascript object - this file is loaded via ajax and its
    contents then used as the initialization data.

    If ajax is used to load the initialization data, ``callback`` - if specified
    - will be invoked on the newly created ``defaults`` object when the ajax
    call finishes.  This can be used to specify, for example, the continuation
    of the containing function so as to ensure that the object is created and
    ready when the continuation is invoked (in other words, using the callback
    is the asynchronous version of returning the new object directly from the
    call to the ``defaults`` function).

    The ``defaults`` object has two methods: ``get(key)`` returns the value
    associated to ``key`` (or ``undefined`` if ``key`` is not present);
    ``set(key, value)`` associates ``value`` to ``key``.

    This object can be used to set up default configuration options for a web
    application.  The following example shows one useful pattern:

    .. code-block:: javascript

        tangelo.util.defaults("defaults.json", function (config) {
            var opt = {
                color: "red",
                fontsize: 12
            };

            for (o in opt) {
                config.set(o, config.get(o) || opt[o]);
            }

            .
            .
            .
        });

    This code snippet reads in values from a file and fills in hardcoded
    default values for anything missing in the file.  This pattern can be
    deployed somewhere, and the site maintainer can supply a ``defaults.json``
    file to vary the default values.  If the file is omitted, then the hardcoded
    defaults will kick in.
