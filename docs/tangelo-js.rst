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

Utilities
=========

The utility functions provide services that may be useful or convenient in many
kinds of web applications.

.. js:function:: tangelo.config(webpath, callback)

    Loads the JSON file found at `webpath` asynchronously, then invokes
    `callback`, passing the JSON data, a status flag, and any error string that
    may have occurred, when the content is ready.

    This function can be used to perform static configuration of a deployed web
    application.  For example, the JSON file might list databases where
    application data is stored.

    :param string webpath: A webpath referring to a JSON configuration file -
        relative paths will be resolved with respect to the current web location

    :param function(data,status,error) callback: A callback used to access the
        configuration data once it is loaded.  `status` reads either `OK` if
        everything is well, or `could not open file` if, e.g., the file is missing.
        This may occur if, for example, the configuration file is optional.  If
        there is an ajax error, it will be passed in the `error` parameter.

Data Transformation
===================

These functions, in the ``tangelo.data`` namespace, provide transformations of
common data formats into a common format usable by Tangelo plugins.

.. js:function:: tangelo.data.tree(spec)

    Converts an array of nodes with ids and child lists into a nested tree structure.
    The nested tree format with a standard `children` attribute is the required format for other Tangelo
    functions such as :js:func:`$.dendrogram`.

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

    :param object spec.data: The array of nodes.
    :param Accessor spec.id: An accessor for the ID of each node in the tree.
    :param Accessor spec.idChild: An accessor for the ID of the elements of the children array.
    :param Accessor spec.children: An accessor to retrieve the array of children for a node.

.. js:function:: tangelo.data.distanceCluster(spec)

    :param object spec.data: The array of nodes.
    :param number spec.clusterDistance: The radius of each cluster.
    :param Accessor spec.x: An accessor to the :math:`x`-coordinate of a node.
    :param Accessor spec.y: An accessor to the :math:`y`-coordinate of a node.
    :param function spec.metric: A function that returns the distance between two nodes provided
        as arguments.

    Groups an array of nodes together into clusters based on distance according to some metric.  By
    default, the 2D Euclidean distance, 
    :math:`d(a, b) = \sqrt{(a\mathord{.}x - b\mathord{.}x)^2 + (a\mathord{.}y - b\mathord{.}y)^2}`, 
    will be used.  One can override the accessors to the :math:`x` and :math:`y`-coordinates of the nodes
    via the `spec` object.  The algorithm supports arbitrary topologies with the presence of a 
    custom metric.  If a custom metric is provided, the `x`/`y` accessors are ignored.

    For each node, the algorithm searches for a cluster with a distance `spec.clusterDistance`.  If such a 
    cluster exists, the node is added otherwise a new cluster is created centered at the node.  As implemented,
    it runs in :math:`\mathcal{O}(nN)` time for :math:`n` nodes and :math:`N` clusters.  If the cluster distance
    provided is negative, then the algorithm will be skipped and all nodes will be placed in their own cluster group.
    
    The data array itself is mutated so that each node will contain a `cluster` property set to an array containing
    all nodes in the local cluster.  For example, with clustering distance 5 the following data array

    >>> data
    [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 10, y: 0 }
    ]

    will become

    >>> data
    [
        { x: 0, y: 0, cluster: c1 },
        { x: 1, y: 0, cluster: c1 },
        { x: 10, y: 0, cluster: c2 }
    ]

    with

    >>> c1
    [ data[0], data[1] ]
    >>> c2
    [ data[2] ]

    In addition, the function returns an object with properties `singlets` and `clusters` containing an array of nodes
    in their own cluster and an array of all cluster with more than one node, respectively.  As in the previous example,

    >>> tangelo.data.distanceCluster( { data: data, clusterDistance: 5 } )
    {
        singlets: [ data[2] ],
        clusters: [ [ data[0], data[1] ] ]
    }

.. js:function:: tangelo.data.smooth(spec)

    :param object spec.data: An array of data objects.
    :param Accessor spec.x: An accessor to the independent variable.
    :param Accessor spec.y: An accessor to the dependent variable.
    :param function spec.set: A function to set the dependent variable of a data object.
    :param string spec.kernel: A string denoting a predefined kernel or a function computing a custom kernel.
    :param number spec.radius: The radius of the convolution.
    :param bool spec.absolute: Whether the radius is given in absolute coordinates or relative to the data extent.
    :param bool spec.sorted: Whether the data is presorted by independent variable, if not the data will be sorted internally.
    :param bool spec.normalize: Whether or not to normalize the kernel to 1.

    Performs 1-D smoothing on a dataset by convolution with a kernel function.  The mathematical operation performed is as
    follows:

    .. math:: y_i \leftarrow \sum_{\left|x_i - x_j\right|<R} K\left(x_i,x_j\right)y_j

    for :math:`R=` **spec.radius** and :math:`K=` **spec.kernel**.  Predefined kernels can be specified as strings,
    these include:

        * *box*: simple moving average (default),

        * *gaussian*: gaussian with standard deviation **spec.radius**/3.
    
    The function returns an array of numbers representing the smoothed dependent variables.  In addition 
    if **spec.set** was given, the input data object is modified as well.  The set method is called after
    smoothing as follows:

    .. code-block:: javascript

        set.call(data, y(data[i]), data[i], i),

    and the kernel is called as:

    .. code-block:: javascript

        kernel.call(data, x(data[i]), x(data[j]), i, j).

    The default options called by

    .. code-block:: javascript
        
        smooth({ data: data })
    
    will perform a simple moving average of the data over a window that
    is of radius :math:`0.05` times the data extent.  A more advanced example

    .. code-block:: javascript

        smooth({
            data: data,
            kernel: 'gaussian',
            radius: 3,
            absolute: true,
            sorted: false
        })

    will sort the input data and perform a gaussian smooth with standard deviation equal to :math:`1`.

.. js:function:: tangelo.data.bin(spec)

    :param object spec.data: An array of data objects.
    :param Accessor spec.value: An accessor to the value of a data object.
    :param integer spec.nBins: The number of bins to create (default 25).
    :param number spec.min: The minimum bin value (default data minimum).
    :param number spec.max: The maximum bin value (default data maximum).
    :param object spec.bins: User defined bins to aggregate the data into.

    Aggregates an array of data objects into a set of bins that can be used to draw a histogram.
    The bin objects returned by this method look as follows:

    .. code-block:: javascript

        {
            "min": 0,
            "max": 1,
            "count": 5
        }

    A data object is counted as inside the bin if its value is in the half open interval
    ``[ min, max )``; however for the right most bin, values equal to the maximum
    are also included.  The default behavior of this method is two construct a new array of
    equally spaced bins between data's minimum value and the data's maximum value.  If
    ``spec.bins`` is given, then the data is aggregated into these bins rather
    than a new set being generated.  In this case, the bin objects are mutated rather
    a new array being created.  In addition, the counters are **not** reset to 0, so the user must
    do so manually if the bins are reused over multiple calls.

    Examples:

    .. code-block:: javascript

        >>> tangelo.data.bin({
                data: [{"value": 0}, {"value": 1}, {"value": 2}],
                nBins: 2
            })
        [
            {"min": 0, "max": 1, "count": 1},
            {"min": 1, "max": 2, "count": 2}
        ]

        >>> tangelo.data.bin({
                data: [{"value": 1}, {"value": 3}],
                nBins: 2,
                min: 0,
                max: 4
            })
        [
            {"min": 0, "max": 2, "count": 1},
            {"min": 2, "max": 4, "count": 1}
        ]

        >>> tangelo.data.bin({
                data: [{"value": 1}, {"value": 3}],
                bins: [{"min": 0, "max": 2, "count": 1}, {"min": 2, "max": 10, "count": 0}]
            })
        [
            {"min": 0, "max": 2, "count": 2},
            {"min": 2, "max": 10, "count": 1}
        ]

jQuery plugins
==============

Tangelo defines several `jQuery plugins <http://learn.jquery.com/plugins/>`_ to
provide convenient behaviors or to implement common visualization methods.  See
:ref:`jquery-widgets` for more information.

.. js:function:: $.svgColorLegend(cfg)

    Constructs an SVG color legend in the ``g`` element specified by
    `cfg.legend`, mapping colors from the elements of `cfg.categories`
    through the function `cfg.cmap_func`.

    :param string cfg.legend: CSS selector for SVG group element that will
        contain the legend
    :param function cfg.cmap_func: A colormapping function to create color
        patches for the legend entries
    :param integer cfg.xoffset: How far, in pixels, to set the legend from the
        left edge of the parent SVG element.
    :param integer cfg.yoffset: How far, in pixels, to set the legend from the
        top edge of the parent SVG element.
    :param string[] cfg.categories: A list of strings naming the categories
        represented in the legend.
    :param integer cfg.height_padding: How much space, in pixels, to place
        between legend entries.
    :param integer cfg.width_padding: How much space, in pixels, to place
        between a color patch and its associated label
    :param integer cfg.text_spacing: How far, in pixels, to raise text labels
        (used to vertically center text within the vertical space occupied by a
        color patch).
    :param object cfg.legend_margins: An object with (optional) fields `top`,
        `bottom`, `left`, and `right`, specifying how much space, in pixels, to
        leave between the edge of the legend and the entries.
    :param bool cfg.clear: Whether to clear out the previous contents of the
        element selected by `cfg.legend`.

.. js:function:: $.dendrogram(spec)

    :param object spec.data: A nested tree object where child nodes are stored in the `children` attribute.
    :param accessor spec.label: The accessor for displaying tree node labels.
    :param accessor spec.id: The accessor for the node ID.
    :param accessor spec.nodeColor: The accessor for the color of the nodes.
    :param accessor spec.labelSize: The accessor for the font size of the labels.
    :param accessor spec.lineWidth: The accessor for the stroke width of the node links.
    :param accessor spec.lineColor: The accessor for the stroke color of the node links.
    :param accessor spec.nodeSize: The accessor for the radius of the nodes.
    :param accessor spec.labelPosition: The accessor for the label position relative to
        the node.  Valid return values are `'above'` and `'below'`.
    :param accessor spec.expanded: The accessor to a boolean value that determines whether
        the given node is expanded or not.
    :param string spec.lineStyle: The node link style: `'curved'` or `'axisAligned'`.
    :param string spec.orientation: The graph orientation: `'vertical'` or `'horizontal'`.
    :param number spec.duration: The transition animation duration.
    :param object spec.on: An object of event handlers.  The handler receives the data
        element as an argument and the dom node as `this`.  If the function returns
        `true`, the default action is perfomed after the handler, otherwise it is
        prevented.  Currently, only the `'click'` event handler is exposed.

    Constructs an interactive dendrogram.

    .. js:function:: resize()

        Temporarily turns transitions off and resizes the dendrogram.  Should be
        called whenever the containing dom element changes size.

.. js:function:: $.geodots(spec)

    Constructs a map from a `GeoJSON <http://geojson.org/>`_ specification, and
    plots colored SVG dots on it according to `spec.data`.

    `spec.worldGeometry` is a web path referencing a GeoJSON file.  `spec.data`
    is an array of JavaScript objects which may encode geodata attributes such
    as longitude and latitude, and visualization parameters such as size and
    color, while `spec.latitude`, `spec.longitude`, and `spec.size` are accessor
    specifications describing how to derive the respective values from the data
    objects.  `spec.color` is an accessor deriving categorical values to put
    through a color mapping function.

    .. image:: images/geodots-small.png
        :align: center

    For a demonstration of this plugin, see the :root:`geodots example
    </examples/geodots>`.

    :param string spec.worldGeometry: A web path to a GeoJSON file
    :param accessor spec.latitude: An accessor for the latitude component
    :param accessor spec.longitude: An accessor for the longitude component
    :param accessor spec.size: An accessor for the size of each plotted circle
    :param accessor spec.color: An accessor for the colormap category for each
        plotted circle

.. js:function:: $.geonodelink(spec)

    Constructs a map from a `GeoJSON <http://geojson.org/>`_ specification, and
    plots a node-link diagram on it according to `spec.data`.  This plugin
    produces similar images as :js:func:`$.geodots` does.

    `spec.worldGeometry` is a web path referencing a GeoJSON file.

    `spec.data` is an object containing two fields: ``nodes`` and ``links``.
    The ``nodes`` field contains an array of JavaScript objects of the exact
    same structure as the `spec.data` array passed to :js:func:`$.geodots`,
    encoding each node's location and visual properties.

    The ``links`` field contains a list of objects, each encoding a single link
    by specifying its source and target node as an index into the ``nodes``
    array.  `spec.linkSource` and `spec.linkTarget` are accessors describing how
    to derive the source and target values from each of these objects.

    The plugin draws a map with nodes plotted at their specified locations, with
    the specified links drawn as black lines between the appropriate nodes.

    .. image:: images/geonodelink-small.png
        :align: center

    For a demonstration of this plugin, see the :root:`geonodelink example
    </examples/geonodelink>`.

    :param object spec.data: The encoded node-link diagram to plot
    :param string spec.worldGeometry: A web path to a GeoJSON file
    :param accessor spec.nodeLatitude: An accessor for the latitude component of
        the nodes
    :param accessor spec.nodeLongitude: An accessor for the longitude component
        of the nodes
    :param accessor spec.nodeSize: An accessor for the size of each plotted circle
    :param accessor spec.nodeColor: An accessor for the colormap category for each
        plotted circle
    :param accessor spec.linkSource: An accessor to derive the source node of
        each link
    :param accessor spec.linkTarget: An accessor to derive the target node of
        each link

.. js:function:: $.mapdots(spec)

    This plugin performs the same job as :js:func:`$.geodots`, but plots the dots
    on an interactive Google Map rather than a GeoJSON map.  To this end, there
    is no need for a "worldGeometry" argument, but the data format and other
    arguments remain the same.

    .. image:: images/mapdots-small.png
        :align: center

    For a demonstration of this plugin, see the :root:`mapdots example
    </examples/mapdots>`.

    :param object[] spec.data: The list of dots to plot
    :param accessor spec.latitude: An accessor for the latitude component
    :param accessor spec.longitude: An accessor for the longitude component
    :param accessor spec.size: An accessor for the size of each plotted circle
    :param accessor spec.color: An accessor for the colormap category for each
        plotted circle

.. js:function:: $.geojsMap(spec)

    This plugin provides a low level interface to the
    `geojs <https://github.com/OpenGeoscience/geojs>`_ mapping library.
    For a simple example of using this plugin, see the :root:`geojsMap example
    </examples/geojsMap>`.

    :param integer spec.zoom: The initial zoom level of the map.

    The widget also contains the following public methods for drawing on the
    map.

    .. js:function:: latlng2display(points)

        Converts a point or points in latitude/longitude coordinates into screen pixel
        coordinates.  This function takes in either a `geo.latlng` object or
        an array of such objects.  It always returns an array of objects with
        properties:

            * `x` the horizontal pixel coordinate

            * `y` the vertical pixel coordinate

        :param geo.latlng point: The world coordinate(s) to be converted

    .. js:function:: display2latlng(points)

        This is the inverse of `latlng2display` returning an array of
        `geo.latlng` objects.

        :param object point: The world coordinate(s) to be converted

    .. js:function:: svg()

        Returns an svg DOM element contained in the geojs map.  This
        element directly receives mouse events from the browser, so
        you can attach event handlers to svg elements as if the map
        were not present.  You can call stopPropagation to customize
        user intaraction and to prevent mouse events from reaching the map.

    .. js:function:: map()

        Returns the geojs `map` object for advanced customization.

    Users of this plugin should attach a handler to the `draw` event that
    recomputes the pixel coordinates and redraws the svg elements.  The
    plugin will trigger this event whenever the map is panned, zoomed, or
    resized.


.. js:function:: $.geojsdots(spec)

    This plugin is similar to :js:func:`$.mapdots`, but plots the dots
    using the geojsMap plugin.

    For a demonstration of this plugin, see the :root:`geojsdots example
    </examples/geojsdots>`.

    :param object[] spec.data: The list of dots to plot
    :param accessor spec.latitude: An accessor for the latitude component
    :param accessor spec.longitude: An accessor for the longitude component
    :param accessor spec.size: An accessor for the size of each plotted circle
    :param accessor spec.color: An accessor for the colormap category for each
        plotted circle

.. js:function:: $.nodelink(spec)

    Constructs an interactive node-link diagram.  `spec.data` is an object with
    ``nodes`` and ``links`` fields, each of which is a list of objects.  The
    ``nodes`` list objects specify the nodes' visual properties, while the
    ``links`` list simply specifies the nodes at the end of each link, as
    indices into the ``nodes`` list.

    The accessors `spec.linkSource` and `spec.linkTarget` specify how to extract
    the source and target information from each link object, while
    `spec.nodeSize` and `spec.nodeColor` specify how to extract these visual
    properties from the node objects, much as in the :js:func:`$.geonodelink`
    plugin.  `spec.nodeCharge` specifies the simulated electrostatic
    charge on the nodes, for purposes of running the interactive node placement
    algorithm (see the `D3 documentation
    <https://github.com/mbostock/d3/wiki/Force-Layout#wiki-charge>`_ for more
    information).  Finally, `spec.nodeLabel` is an accessor describing what, if
    any, text label should be attached to each node.

    :param object spec.data: The node-link diagram data
    :param accessor spec.nodeSize: An accessor for the size of each node
    :param accessor spec.nodeColor: An accessor for the colormap category for
        each node
    :param accessor spec.nodeLabel: An accessor for each node's text label
    :param accessor spec.nodeCharge: An access for each node's simulated
        electrostatic charge
    :param accessor spec.linkSource: An accessor to derive the source node of
        each link
    :param accessor spec.linkTarget: An accessor to derive the target node of
        each link

.. js:function:: $.correlationPlot(spec)

    Constructs a grid of scatter plots that are designed to show the relationship
    between different variables or properties in a dataset.

    :param object[] spec.variables: An array of functions representing variables or properties
        of the dataset.  Each of these functions takes a data element as
        an argument and returns a number between 0 and 1.  In addition, the functions
        should have a `label` attribute whose value is the string used for the
        axis labels.
    :param object[] spec.data: An array of data elements that will be plotted.
    :param accessor spec.color: An accessor for the color of each marker.
    :param bool spec.full: Whether to show a full plot layout or not.  See the
        images below for an example.  This value cannot currently be changed after the
        creation of the plot.

    .. figure:: images/correlationPlotFull.png
        :align: center
        :alt: Full correlation plot layout

        An example of a full correlation plot layout.  All variables are shown on the
        horizontal and vertical axes.

    .. figure:: images/correlationPlotHalf.png
        :align: center
        :alt: Half correlation plot layout

        An example of a half correlation plot layout.  Only the upper left corner of the
        full layout are displayed.

.. js:function:: $.timeline(spec)

    Constructs a line plot with time on the x-axis and an arbitrary numerical value on the
    y-axis.

    :param object[] spec.data: An array of data objects from which the timeline will be derived.
    :param accessor spec.x: An accessor for the time of the data.
    :param accessor spec.y: An accessor for the value of the data.
    :param number spec.transition: The duration of the transition animation in milliseconds, or
        false to turn off transitions.

    .. js:function:: xScale()
    .. js:function:: yScale()

        These return a d3 linear scale representing the transformation from plot coordinates to
        screen pixel coordinates.  They make it possible to add custom annotations to
        the plot by appending an svg element to the `d3.select('.plot')` selection at the coordinates
        returned by the scales.

    .. image:: images/timeline.png
        :align: center
        :alt: An example timeline plot
.. .. js:class:: tangelo.GoogleMapSVG(elem, mapoptions, cfg, cont)

.. todo::
    Fill in GoogleMapSVG section
