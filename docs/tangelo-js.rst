===================================
    Tangelo JavaScript API
===================================

The Tangelo clientside library (*tangelo.js*) contains many functions to help
create rich web applications for performing visualization and other tasks.  The
library is conceptually split up into several sections, reviewed here.

Core Services
=============

The core functions represent basic support for creating web applications.

.. js:function:: tangelo.version()

    Returns a string representing Tangelo's current version number.  See
    :ref:`versioning` for more information on Tangelo version numbers.

    :rtype: string

.. js:function:: tangelo.fatalError([module, ] msg)

    Throws a JavaScript error containing a message, and optionally the name of
    the reporting module.  For example, the call
    ``tangelo.fatalError("mymodule", "You can't divide by zero!");`` produces a
    JavaScript ``Error`` exception with the message *[mymodule] You can't divide
    by zero!*

    :param string module: reporting module name
    :param string msg: message to report in exception

.. js:function:: tangelo.unavailable(cfg)

    Returns a function that raises a fatal error telling the user about missing
    JavaScript requirements needed to run some functionality.

    Generally, when it is detected that the requirements for some function are
    incomplete, the function can be implemented with ``tangelo.unavailable()``
    in order to produce a useful error message at runtime.

    *Example:*

    .. code-block:: javascript

        if (!foobar) {
            coolLib.awesomeFeature = tangelo.unavailable({
                plugin: "coolLib.awesomeFeature",
                required: "foobar"
            });
        }

    Note that the `cfg.required` may also be a list of strings, if there are
    multiple requirements.

    :param string cfg.plugin: The functionality with missing requirements

    :param cfg.required: The requirement(s)
    :type cfg.required: string or list of string

.. js:function:: tangelo.requireCompatibleVersion(requiredVersion)

    Determines if `requiredVersion` represents a Tangelo version that is
    compatible with the current version.  The notion of compatibility comes from
    Tangelo's semantic versioning (see :ref:`versioning` for more information)
    and works as follows:

    **Development versions** are compatible if all components match.  That is to
    say, the major and minor versions, the patchlevel (if any), and the tag text
    must all match.

    **Unstable versions** (those with major version 0) are compatible if the
    major version numbers are both 0 and the minor version numbers match.

    **Release versions** (those with major version greater than zero) are
    compatible if the major version numbers match, and the required version's
    minor version number is at most to Tangelo's minor version number.  In
    case the minor version numbers are equal, the required patchlevel must be at
    most equal to Tangelo's patchlevel as well.

    These rules ensure that the required API is the same as the API exported by
    Tangelo.

    :param string requiredVersion: The version required by the calling application
    :rtype: boolean

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

.. js:function:: tangelo.uniqueID(n)

    Generates a identifier made up of `n` randomly chosen lower and upper case
    letters, guaranteed to be unique during the run of a single web application.

    This function can be useful when designing plugins that create DOM elements
    that need to be referenced in a reliable way later.  The unique identifiers that
    come from this function can be used in the ``id`` attribute of such
    elements.

    Be careful about calling this function with a small `n` - for example, a
    sequence of 52 calls to ``tangelo.uniqueID(1)`` would take longer and longer
    to randomly generate each single-letter string, while the 53rd call would
    enter an infinite loop.  This is an extremely unlikely scenario but it bears
    to keep it in mind.

    :param integer n: The length of the desired identifier
    :rtype: string

.. js:function:: tangelo.queryArguments()

    Returns an object whose key-value pairs are the query arguments passed to
    the current web page.

    This function may be useful to customize page content based on query
    arguments, or for restoring state based on configuration options, etc.

    :rtype: object

.. js:function:: tangelo.isNumber(value)

    Returns ``true`` is `value` is a number and ``false`` otherwise.

    :param value: The value to test
    :rtype: boolean

.. js:function:: tangelo.isBoolean(value)

    Returns ``true`` is `value` is a boolean and ``false`` otherwise.

    :param value: The value to test
    :rtype: boolean

.. js:function:: tangelo.isArray(value)

    Returns ``true`` is `value` is an array and ``false`` otherwise.

    :param value: The value to test
    :rtype: boolean

.. js:function:: tangelo.isObject(value)

    Returns ``true`` is `value` is an object and ``false`` otherwise.

    :param value: The value to test
    :rtype: boolean

.. js:function:: tangelo.isString(value)

    Returns ``true`` is `value` is a string and ``false`` otherwise.

    :param value: The value to test
    :rtype: boolean

.. js:function:: tangelo.isFunction(value)

    Returns ``true`` is `value` is a function and ``false`` otherwise.

    :param value: The value to test
    :rtype: boolean

.. js:function:: tangelo.absoluteUrl(webpath)

    Computes an absolute web path for `webpath` based on the current location.
    If `webpath` is already an absolute path, it is returned unchanged;
    if relative, the return value has the appropriate prefix computed and prepended.

    :param string webpath: an absolute or relative web path
    :rtype: string

.. js:function:: tangelo.accessor([spec])

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

.. _streaming-js:

Streaming API
=============

The Streaming API allows for the handling of web services that yield parts of
their output a piece at a time.  This is useful for handling very large data
streams, but could also be used for purposes such as informing a web application
of different phases of its execution, etc.  The streaming functions are found in
the ``tangelo.stream`` namespace.

See :ref:`streaming` for a full discussion on how streaming works.

.. js:function:: tangelo.stream.streams(callback)

    Asynchronously retrieves a JSON-encoded list of all stream keys, then
    invokes `callback`, passing the keys in as a JavaScript list of strings.

    :param function(keys) callback: A callback taking one argument of type list
        of strings.

.. js:function:: tangelo.stream.start(webpath, callback)

    Asynchronously invokes the web service at `webpath` - which should initiate a
    stream by returning a Python iterable object from its `run()` method - then
    invokes `callback`, passing it the stream key associated with the new
    stream.

    This callback might, for example, log the key with the application so that
    it can be used later, possibly via calls to :js:func:`tangelo.stream.query`
    or :js:func:`tangelo.stream.run`:

    .. code-block:: javascript

        tangelo.stream.start("myservice", function (key) {
            app.key = key;
        });

    :param string webpath: A relative or absolute web path, naming a
        stream-initiating web service
    :param function(key) callback: A function to call when the key for the new
        stream becomes available

.. js:function:: tangelo.stream.query(key, callback)

    Runs the stream keyed by `key` for one step, then invokes `callback` with
    the result.  If there is an error, `callback` is instead invoked passing
    ``undefined`` as the first argument, and the error as the second.

    :param string key: The key for the desired stream
    :param function(data) callback: The callback to invoke when results come
        back from the stream

.. js:function:: tangelo.stream.run(key, callback[, delay=100])

    Runs the stream keyed by `key` continuously until it runs out, or there is
    an error, invoking `callback` with the results each time.  The `delay`
    parameter expresses in milliseconds the interval between when a callback
    returns, and when the stream is queried again.

    The behavior of `callback` can influence the future behavior of this
    function.  If `callback` returns a value, and the value is a

    * **function**, it will replace `callback` for the remainder of the stream
      queries;

    * **boolean**, it will stop running the stream if ``false``;

    * **number**, it will become the new delay, beginning with the very next
      stream query.

    Other return types will simply be ignored.

    :param string key: The key for the stream to run
    :param function(data) callback: The callback to pass stream data when it
        becomes available
    :param number delay: The delay in milliseconds between the return from a
        callback invocation, and the next stream query

.. js:function:: tangelo.stream.delete(key[, callback])

    Deletes the stream keyed by `key`.  The optional `callback` is a function
    that is invoked with an error object is something went wrong during the
    delete operation, or no arguments if the delete was successful.

    :param string key: The key of the stream to delete
    :param function(error) callback: A callback that is passed an error object
        if an error occurs during deletion.

.. _vtkweb-js:

VTK Web API
===========

Tangelo offers native support for VTK Web processes.  These functions help to
launch, manage, query, and terminate such processes.

.. js:function:: tangelo.vtkweb.processes(callback)

    Asynchronously retrieves a list of VTK Web process keys, and invokes
    `callback` with the list.

    :param function(keys) callback: The callback to invoke when the list of keys
        becomes available

.. js:function:: tangelo.vtkweb.info(key, callback)

    Retrieves a status report about the VTK Web process keyed by `key`, then
    invokes `callback` with it when it becomes available.

    The report is a JavaScript object containing a ``status`` field indicating
    whether the request succeeded ("complete") or not ("failed").  If the status
    is "failed", the ``reason`` field will explain why.

    A successful report will contain a ``process`` field that reads either
    "running" or "terminated".  For a terminated process, the ``returncode``
    field will contain the exit code of the process.

    For running processes, there are additional fields: ``port``, reporting the
    port number the process is running on, and ``stdout`` and ``stderr``, which
    contain a list of lines coming from those two output streams.

    This function may be useful for debugging an errant VTK Web script.

.. js:function:: tangelo.vtkweb.launch(cfg)

    Attempts to launch a new VTK Web process by running a Python script found at
    `cfg.url`, passing `cfg.argstring` as commandline arguments to the launcher
    script.  If successful, the streaming image output will be sent to the first
    DOM element matching the CSS selector given in `cfg.viewport`, which should
    generally be a ``div`` element.

    After the launch attempt succeeds or fails, `callback` is invoked, passing
    the process key as the first argument, and the error object describing any
    errors that occurred as the second (or ``undefined`` if there was no error).

    :param string cfg.url: A relative or absolute web path referring to a VTK
        Web script
    :param string cfg.argstring: A string containing command line arguments to
        pass to the launcher script
    :param string cfg.viewport: A CSS selector for the ``div`` element to serve
        as the graphics viewport for the running process
    :param function(key,error) cfg.callback: A callback that reports the key of
        the new process, or the error that occured

.. js:function:: tangelo.vtkweb.terminate(key[, callback])

    Attempts to terminate the VTK Web process keyed by `key`.  If there is a
    `callback`, it will be invoked with the key of the terminated process, the
    DOM element that was the viewport for that process, and an error (if any).
    The key is passed to the callback in case this function is called several
    times at once, and you wish to distinguish between the termination of
    different processes.  The DOM element is passed in case you wish to change
    something about the appearance of the element upon termination.

    :param string key: The key of the process to terminate
    :param function(key,viewport,error) callback: A callback that will be
        invoked upon completion of the termination attempt

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
