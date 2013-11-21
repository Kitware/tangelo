===================================
    Tangelo Javascript API
===================================

jQuery plugins
==============

.. js:function:: jQuery.landingPage(cfg)

    :param string cfg.specFile: JSON file describing what applications will be listed on the page.
    :param string cfg.leftColumn: CSS selector for left text column
    :param string cfg.rightColumn: CSS selector for right text column
    :param string cfg.leftExternalColumn: CSS selector for left text column for external applications
    :param string cfg.rightExternalColumn: CSS selector for right text column for external applications

    Constructs a landing page describing one or more other applications on a
    server.  `cfg.specFile` points to a JSON file containing a single object
    with two fields, `apps` and `external`.  The `apps` field is a list of
    objects, each of which has three fields: `name`, giving the title (and link
    text) for an application; `path`, giving the link target for the app; and
    `description`, containing descriptive HTML text that will describe the
    application within the list.  The `external` field also contains a list of
    objects, with the following fields: `name`, as before; `link`, containing a
    link to the external webpage for the project; `institution`, giving the name
    of the organization that hosts the external project; `institution_link`,
    giving a link target for the institution; and `description`, as before.

    This function lists out the projects in the JSON file columnwise into two
    columns (specified by `cfg.leftColumn`, `cfg.rightColumn`,
    `cfg.leftExternalColumn`, and `cfg.rightExternalColumn`), placing links
    and descriptive text appropriately.

.. js:function:: jQuery.controlPanel(cfg)

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

.. js:function:: jQuery.svgColorLegend(cfg)

    :param string cfg.legend: CSS selector for SVG group element that will contain the legend
    :param function cfg.cmap_func: A colormapping function to create color patches for the legend entries
    :param int cfg.xoffset: How far, in pixels, to set the legend from the left edge of the parent SVG element.
    :param int cfg.yoffset: How far, in pixels, to set the legend from the top edge of the parent SVG element.
    :param string[] cfg.categories: A list of strings naming the categories represented in the legend.
    :param int cfg.height_padding: How much space, in pixels, to place between legend entries.
    :param int cfg.width_padding: How much space, in pixels, to place between a color patch and its associated label
    :param int cfg.text_spacing: How far, in pixels, to raise text labels (used to vertically center text within the vertical space occupied by a color patch).
    :param object cfg.legend_margins: An object with (optional) fields `top`, `bottom`, `left`, and `right`, specifying how much space, in pixels, to leave between the edge of the legend and the entries.
    :param bool cfg.clear: Whether to clear out the previous contents of the element selected by `cfg.legend`.

    Constructs an SVG color legend in the ``<g>`` element specified by
    `cfg.legend`, mapping colors from the elements of `cfg.categories`
    through the function `cfg.cmap_func`.

.. js:function:: jQuery.navbar(cfg)


tangelo
=======

.. js:function:: tangelo.version()

    Returns the version as string of the form ``"x.y.z"``.

.. js:attribute:: tangelo.identity

    The identity function: ``function (d) { return d; }``.

.. js:function:: tangelo.isNumber(x)

    Returns ``true`` if `x` is a number.

.. js:function:: tangelo.isBoolean(x)

    Returns ``true`` if `x` is a boolean.

.. js:function:: tangelo.isArray(x)

    Returns ``true`` if `x` is an array.

.. js:function:: tangelo.isObject(x)

    Returns ``true`` if `x` is an object.

.. js:function:: tangelo.isString(x)

    Returns ``true`` if `x` is a string.

.. js:function:: tangelo.accessor(spec, default)

    :param spec.value: If this attribute is present, creates a function that returns the specified constant value.
    :param string spec.field: If this attribute is present, creates a function that returns the specified constant value.
        The `field` may be dot-separated to reference nested attributes.
        For example, ``"foo.bar"`` will return the ``bar`` sub-attribute of the ``foo`` attribute.
        Passing the string ``"."`` will return the identity function.
    :param default: The default value returned if `spec.field` is not present.

    Returns a function which takes an object and returns a value according to the `spec`.

.. js:function:: tangelo.hasNaN(values)
    
    Returns ``true`` if any of the elements in the array `values` are ``NaN``.

.. js:function:: tangelo.appendFunction(f1, f2)

    Returns a new function which first calls `f1` then calls `f2`. All arguments are passed to each function.

.. js:function:: tangelo.requireCompatibleVersion(reqvstr)

    Returns ``true`` if :js:func:`tangelo.version()` returns a version >= the version specified in `reqvstr`.

.. js:function:: tangelo.getMongoRange(host, database, collection, field, callback)

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

.. js:function:: tangelo.allDefined([arg1, ..., argN])

    Returns ``true`` if all arguments are defined, and ``false`` otherwise.

.. js:class:: tangelo.defaults(inputSpec, callback)

    Constructs a key/value store object, initializing it with the information
    found in `inputSpec`.

    If `inputSpec` is a Javascript object, its contents are used directly as
    the initialization data for the `defaults` object.  Otherwise, if
    `inputSpec` is a string, it is treated as the path to a JSON file that
    encodes a single Javascript object - this file is loaded via ajax and its
    contents then used as the initialization data.

    If ajax is used to load the initialization data, `callback` - if specified
    - will be invoked on the newly created `defaults` object when the ajax
    call finishes.  This can be used to specify, for example, the continuation
    of the containing function so as to ensure that the object is created and
    ready when the continuation is invoked (in other words, using the callback
    is the asynchronous version of returning the new object directly from the
    call to the `defaults` function).

    The `defaults` object has two methods: ``get(key)`` returns the value
    associated to `key` (or ``undefined`` if `key` is not present);
    ``set(key, value)`` associates `value` to `key`.

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

.. js:function:: tangelo.uniqueID()

    Returns a unique string ID for use as, e.g., ids for dynamically generated html
    elements, etc.

.. js:class:: tangelo.GoogleMapSVG(elem, mapoptions, cfg, cont)

.. js:function:: tangelo.resolve(spec, done)

tangelo.data
============

.. js:function:: tangelo.data.tree(spec)

    :param object spec.data: The array of nodes.
    :param Accessor spec.id: An accessor for the ID of each node in the tree.
    :param Accessor spec.idChild: An accessor for the ID of the elements of the children array.
    :param Accessor spec.children: An accessor to retrieve the array of children for a node.

    Converts an array of nodes with ids and child lists into a nested tree structure.
    The nested tree format with a standard `children` attribute is the required format for other Tangelo
    functions such as :js:class:`tangelo.vis.dendrogram`.

    As an example, evaluating:

    .. code-block:: javascript

        var tree = tangelo.data.tree({
            data: [
                {name: "a", childNodes: [{child: "b", child: "c"}]},
                {name: "b", childNodes: [{child: "d"}]},
                {name: "c"},
                {name: "d"}
            ],
            id: {field: "name"},
            idChild: {field: "child"},
            children: {field: "childNodes"}
        });

    will return the following nested tree (note that the original `childNodes` attributes will also remain intact):

    .. code-block:: javascript

        {
            name: "a",
            children: [
                {
                    name: "b",
                    children: [
                        {
                            name: "d"
                        }
                    ]
                },
                {
                    name: "c"
                }
            ]
        }

tangelo.ui
==========

.. js:function:: tangelo.ui.html(spec)

    :param Element spec.el: The parent DOM element.
    :param string spec.html: The HTML content string.

    Appends the specified arbitrary HTML content under the specified element. 

.. js:function:: tangelo.ui.rangeslider(spec)

    :param Element spec.el: The parent DOM element.
    :param object spec.range: An object of the form ``{min: minValue, max: maxValue}`` containing
        the full range of the slider. The values `spec.range.min` and `spec.range.max` must be numeric.
    :param object spec.value: An object of the form ``{min: minValue, max: maxValue}`` containing
        the initial selected range of the slider. The values `spec.range.min` and `spec.range.max` must be numeric.
    :param boolean spec.date: If ``true``, display the values as if they were milliseconds
        since January 1, 1980 (i.e. interpret as the date ``new Date(value)``).
    :param function spec.on.change: When the slider is dragged, ``spec.on.change(value)`` is called
        with the current value of the form ``{min: minValue, max: maxValue}``.

    Creates a double-handled range slider control appended to the specified parent element.

.. js:function:: tangelo.ui.select(spec)

    :param Element spec.el: The parent DOM element.
    :param array spec.data: An array, one for each option in the drop-down.
    :param Accessor spec.id: The accessor for a unique identifier for each object.
    :param Accessor spec.label: The accessor for a label to be shown in the drop-down (default: `spec.id`).
    :param function spec.on.change: When the drop-down selection changes, ``spec.on.change(value)`` is called
        with the data element that was selected.
    :param spec.value: The identifier of the object to initially select.

    Creates a drop-down selection menu (HTML ``<select>`` element) with the specified options.

tangelo.vis
===========

.. js:class:: tangelo.vis.dendrogram(spec)

    :param Element spec.el: The parent DOM element.
    :param object spec.data: A nested tree object where child nodes are stored in the `children` attribute.
    :param Accessor spec.label: The accessor for displaying tree node labels.
    :param Accessor spec.distance: The accessor for the numeric value of each node to its parent (default: 1).
    :param Accessor spec.id: The accessor for the node ID.
    :param int spec.nodeLimit: The maximum number of nodes to display in the dendrogram.
        If there are more nodes in the current display, the view will hide nodes with the highest
        distance from the root.
    :param object spec.root: The root of the subtree in the current display (default: `spec.data`, the full tree).
    :param string spec.mode: The current interaction mode of the tree. The ``"hide"`` mode will alternately
        collapse or expand clicked subtrees. The ``"focus"`` mode will set the currently displayed root
        to the clicked node. The ``"label"`` mode will toggle the label visibility for the clicked node.

    Constructs an interactive dendrogram.

    .. js:function:: update(spec)

        Updates the dendrogram attributes based on the attributes set in `spec`. The possible content of `spec`
        matches the constructor options.

    .. js:function:: reset()

        Resets the view by expanding all collapsed nodes and resetting the root to the full tree.

    .. js:function:: download(format)

        Downloads the view in the specified `format`. Currently only the ``"pdf"`` format is supported.

.. js:class:: tangelo.vis.geodots(spec)

.. js:class:: tangelo.vis.geonodelink(spec)

.. js:class:: tangelo.vis.mapdots(spec)

.. js:class:: tangelo.vis.nodelink(spec)

.. js:class:: tangelo.vis.timebar(spec)

.. js:class:: tangelo.vis.timeline(spec)
