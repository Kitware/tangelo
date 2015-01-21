.. _bundled:

=======================
    Bundled Plugins
=======================

Tangelo ships with several bundled plugins that implement useful and powerful
functionality, as well as providing examples of various tasks that plugins can
perform.  This page divides the set of bundled plugins into categories,
demonstrating some of the styles of problems Tangelo can help solve.


Core Plugins
============

Although these "core plugins" are built using the same plugin system
architecture available to any Tangelo user, these deliver services vital to any
working Tangelo instance, and can therefore be considered integral parts of the
Tangelo platform.

Tangelo
-------

The Tangelo plugin simply serves the Tangelo clientside library files
``tangelo.js`` and ``tangelo.min.js``.  It also includes a "version" web service
that simply returns, as plain text, the running server's version number.

This is supplied as a plugin to avoid having to include the JavaScript files
manually into every deployment of Tangelo.  Instead, the files can be easily
served directly from the plugin, thus retaining stable URLs across deployments.

**Manifest**

=================================== ===========================
File                                Description
=================================== ===========================
``/plugin/tangelo/tangelo.js``      Unminified Tangelo library
``/plugin/tangelo/tangelo.min.js``  Minified Tangelo library
``/plugin/tangelo/version``         Version reporting service
=================================== ===========================

Docs
----

The Docs plugin serves the Tangelo documentation (the very documentation you are
reading right now!).  Again, this is to simplify deployments.  The index is
served at ``/plugin/docs`` and from there the index page links to all pages of
the documentation.

Stream
------

It may be necessary to return an immense (or even :root:`infinite
</examples/primes>`) amount of data from a web service to the client.  However,
this may take up so much time and memory that dealing with it becomes
intractable.  In such situations, the Stream plugin may be able to help.

Generators in Python
^^^^^^^^^^^^^^^^^^^^

Essentially, the plugin works by exposing Python's abstraction of `generators
<http://docs.python.org/2/reference/expressions.html#yield-expressions>`_.  If a
web service module includes a ``stream()`` function that uses the ``yield``
keyword instead of ``return``, thus marking it as a generator function, then the
Stream plugin can use this module to launch a *streaming service*.  Here is an
example of such a service, in a hypothetical file named ``prime-factors.py``:

.. code-block:: python

    import math
    import tangelo

    def prime(n):
        for i in xrange(2, int(math.floor(math.sqrt(num)+1))):
            if n % i == 0:
                return False
        return True

    @tangelo.types(n=int)
    def stream(n=2):
        for i in filter(prime, range(2, int(math.floor(math.sqrt(num)+1)))):
            if n % i == 0
                yield i

The ``stream()`` function returns a *generator object* - an object that returns
a prime divisor of its argument once for each call to its ``next()`` method.
When the code reaches its "end" (i.e., there are no more values to ``yield``),
the ``next()`` method raises a ``StopIteration`` exception.

In Python this object, and others that behave the same way, are known as
*iterables*.  Generators are valuable in particular because they generate values
as they are requested, unlike e.g. a list, which always retains all of its
values and therefore has a larger memory footprint.  In essence, a generator
trades space for time, then amortizes the time over multiple calls to
``next()``.

The Stream plugin leverages this idea to create *streaming services*.  When a
service module returns a generator object from its ``stream()`` function, the
plugin logs the generator object in a table, associates a key to it, and sends
this key as the response.  For example, an ajax request to the streaming API,
identifying the ``prime-factors`` service above, might yield the following
response:

.. code-block:: javascript

    {"key": "3dffee9e03cef2322a2961266ebff104"}

From this point on, values can be retrieved from the newly created generator
object by further engaging the streaming API.

The Stream REST API
^^^^^^^^^^^^^^^^^^^

The streaming API can be found at ``/plugin/stream/stream``.  The API is RESTful
and uses the following verbs:

* ``GET /plugin/stream/stream`` returns a list of all active stream keys.

* ``GET /plugin/stream/stream/<stream-key>`` returns some information about the
  named stream.

* ``POST /plugin/stream/stream/start/<path>/<to>/<streaming>/<service>`` runs
  the ``stream()`` function found in the service, generates a hexadecimal key,
  and logs it in a table of streaming services, finally returning the key.

* ``POST /api/stream/next/<stream-key>``  calls ``next()`` on the associated
  generator and returns a JSON object with the following form:

    .. code-block:: javascript

        {
            "finished": false,
            "data": <value>
        }

  The ``finished`` field indicates whether ``StopIteration`` was thrown, while
  the ``data`` field contains the value ``yield``\ ed from the generator object.
  If ``finished`` is ``true``, there will be no ``data`` field, and the stream
  key for that stream will become invalid.

* ``DELETE /api/stream/<stream-key>`` makes the stream key invalid, removes the
  generator object from the stream table, and returns a response showing which
  key was removed:

    .. code-block:: javascript

        {"key": "3dffee9e03cef2322a2961266ebff104"}

  This is meant to inform the client of which stream was deleted in the case
  where multiple deletions are in flight at once.

JavaScript Support for Streaming
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

``/plugin/stream/stream.js`` defines a clientside ``stream`` plugin that offers
a clean, callback-based JavaScript API to the streaming REST service:

.. js:function:: tangelo.plugin.stream.streams(callback)

    :param function(keys) callback: Callback invoked with the list of active
        stream keys

    Asynchronously retrieves a JSON-encoded list of all stream keys, then
    invokes `callback`, passing the keys in as a JavaScript list of strings.

.. js:function:: tangelo.plugin.stream.start(webpath, callback)

    :param string webpath: A relative or absolute web path, naming a
        stream-initiating web service
    :param function(key) callback: A function to call when the key for the new
        stream becomes available

    Asynchronously invokes the web service at `webpath` - which should initiate a
    stream by returning a Python iterable object from its `run()` method - then
    invokes `callback`, passing it the stream key associated with the new
    stream.

    This callback might, for example, log the key with the application so that
    it can be used later, possibly via calls to :js:func:`tangelo.plugin.stream.query`
    or :js:func:`tangelo.plugin.stream.run`:

    .. code-block:: javascript

        tangelo.plugin.stream.start("myservice", function (key) {
            app.key = key;
        });

.. js:function:: tangelo.plugin.stream.query(key, callback)

    :param string key: The key for the desired stream
    :param function(data, error) callback: The callback to invoke when results come
        back from the stream

    Runs the stream keyed by `key` for one step, then invokes `callback` with
    the result.  If there is an error, `callback` is instead invoked passing
    ``undefined`` as the first argument, and the error as the second.

.. js:function:: tangelo.plugin.stream.run(key, callback[, delay=100])

    :param string key: The key for the stream to run
    :param function(data) callback: The callback to pass stream data when it
        becomes available
    :param number delay: The delay in milliseconds between the return from a
        callback invocation, and the next stream query

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

    * **object**, it will have the **function** effect above if there is a key
      ``callback``; the **boolean** effect above if there is a key ``continue``;
      the **number** effect above if there is a key ``delay`` (in other words,
      this allows for multiple effects to be declared at once).

    Other return types will simply be ignored.

.. js:function:: tangelo.plugin.stream.delete(key[, callback])

    :param string key: The key of the stream to delete
    :param function(error) callback: A callback that is passed an error object
        if an error occurs during deletion.

    Deletes the stream keyed by `key`.  The optional `callback` is a function
    that is invoked with an error object is something went wrong during the
    delete operation, or no arguments if the delete was successful.

VTKWeb
------

The VTKWeb plugin is able to run VTK Web programs and display the result in real
time on a webpage.  The interface is somewhat experimental at the moment and
only supports running the program and interacting with it via the mouse.  In a
later version, the ability to call functions and otherwise interact with VTK Web
in a programmatic way will be added.

In order to enable this funcationality, the plugin must be configured with a
``vtkpython`` option set to the full path to a ``vtkpython`` executable in a
build of VTK.

The VTK Web REST API
^^^^^^^^^^^^^^^^^^^^

The VTK Web API is found at `/plugin/vtkweb/vtkweb`.  The API is RESTful and
uses the following verbs:

* ``POST /plugin/vtkweb/vtkweb/full/path/to/vtkweb/script.py`` launches the
  named script (which must be given as an absolute path) and returns a JSON
  object similar to the following:

    .. code-block:: javascript

        {
            "status": "complete",
            "url": "ws://localhost:8080/ws/d74a945ca7e3fe39629aa623149126bf/ws",
            "key": "d74a945ca7e3fe39629aa623149126bf"
        }

  The ``url`` field contains a websocket endpoint that can be used to
  communicate with the VTK web process.  There is a *vtkweb.js* file (included
  in the Tangelo installation) that can use this information to hook up an HTML
  viewport to interact with the program, though for use with Tangelo, it is much
  simpler to use the JavaScript VTK Web library functions to abstract these
  details away.  The ``key`` field is, similarly to the streaming API, a
  hexadecimal string that identifies the process within Tangelo.

  In any case, receiving a response with a ``status`` field reading "complete"
  means that the process has started successfully.

* ``GET /plugin/vtkweb/vtkweb`` returns a list of keys for all active VTK Web
  processes.

* ``GET /plugin/vtkweb/vtkweb/<key>`` returns information about a particular VTK
  Web process.  For example:

    .. code-block:: javascript

        {
            "status": "complete",
            "process": "running",
            "port": 52446,
            "stderr": [],
            "stdout": [
                "2014-02-26 10:00:34-0500 [-] Starting factory <vtk.web.wamp.ReapingWampServerFactory instance at 0x272b2d8>\n",
                "2014-02-26 10:00:34-0500 [-] ReapingWampServerFactory starting on 52446\n",
                "2014-02-26 10:00:34-0500 [-] Log opened.\n",
                "2014-02-26 10:00:34-0500 [VTKWebApp,0,127.0.0.1] Client has reconnected, cancelling reaper\n",
                "2014-02-26 10:00:34-0500 [VTKWebApp,0,127.0.0.1] on_connect: connection count = 1\n"
            ]
        }

  The ``status`` field indicates that the request for information was
  successful, while the remaining fields give information about the running
  process.  In particular, the ``stderr`` and ``stdout`` streams are queried for
  any lines of text they contain, and these are delivered as well.  These can be
  useful for debugging purposes.

  If a process has ended, the ``process`` field will read ``terminated`` and
  there will be an additional field ``returncode`` containing the exit code of
  the process.

* ``DELETE /plugin/vtkweb/vtkweb/<key>`` terminates the associated VTK process
  and returns a response containing the key:

    .. code-block:: javascript

        {
            "status": "complete",
            "key": "d74a945ca7e3fe39629aa623149126bf"
        }

  As with the streaming ``DELETE`` action, the key is returned to help
  differentiate which deletion has completed, in case multiple ``DELETE``
  requests are in flight at the same time.

JavaScript Support for VTK Web
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

As with the Stream plugin's JavaScript functions, ``/plugin/vtkweb/vtkweb.js``
defines a clientside plugin providing a clean, callback-based interface to the
low-level REST API:

.. js:function:: tangelo.plugin.vtkweb.processes(callback)

    :param function(keys) callback: The callback to invoke when the list of keys
        becomes available

    Asynchronously retrieves a list of VTK Web process keys, and invokes
    `callback` with the list.

.. js:function:: tangelo.plugin.vtkweb.info(key, callback)

    :param string key: The key for the requested VTK Web process
    :param function(object) callback: The callback to invoke when the info
        report becomes available

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

.. js:function:: tangelo.plugin.vtkweb.launch(cfg)

    :param string cfg.url: A relative or absolute web path referring to a VTK
        Web script
    :param string cfg.argstring: A string containing command line arguments to
        pass to the launcher script
    :param string cfg.viewport: A CSS selector for the ``div`` element to serve
        as the graphics viewport for the running process
    :param function(key,error) cfg.callback: A callback that reports the key of
        the new process, or the error that occured

    Attempts to launch a new VTK Web process by running a Python script found at
    `cfg.url`, passing `cfg.argstring` as commandline arguments to the launcher
    script.  If successful, the streaming image output will be sent to the first
    DOM element matching the CSS selector given in `cfg.viewport`, which should
    generally be a ``div`` element.

    After the launch attempt succeeds or fails, `callback` is invoked, passing
    the process key as the first argument, and the error object describing any
    errors that occurred as the second (or ``undefined`` if there was no error).

.. js:function:: tangelo.plugin.vtkweb.terminate(key[, callback])

    :param string key: The key of the process to terminate
    :param function(key,viewport,error) callback: A callback that will be
        invoked upon completion of the termination attempt

    Attempts to terminate the VTK Web process keyed by `key`.  If there is a
    `callback`, it will be invoked with the key of the terminated process, the
    DOM element that was the viewport for that process, and an error (if any).
    The key is passed to the callback in case this function is called several
    times at once, and you wish to distinguish between the termination of
    different processes.  The DOM element is passed in case you wish to change
    something about the appearance of the element upon termination.

Girder
------

`Girder <http://girder.readthedocs.org/en/latest/>`_ is an open-source,
high-performance data management platform.  The Girder plugin mounts a working
instance of Girder in the plugin namespace so that its web client and REST API
become available for use with Tangelo web applications.

When the plugin is loaded, ``/plugin/girder/girder`` will serve out the web
frontend to Girder, while ``/plugin/girder/girder/api/v1`` will point to the
REST API documentation, as well as serving as the base URL for all API calls to
Girder.

For more information about how to use Girder, see its `documentation
<http://girder.readthedocs.org/en/latest/>`_.

Utilities
=========

These plugins do not represent core, substantive functionality, but rather
utility functions that significantly ease the process of creating web
applications.

Config
------

Many web applications need to change their behavior depending on external
resources or other factors.  For instance, if an application makes use of a
Mongo database, a particular deployment of that application may wish to specify
just which database to use.  To this end, the Config plugin works to provide a
simple way to configure the runtime behavior of applications, by using a file
containing a JSON object as a key-value store representing the configuration.

The plugin provides a web service at ``/plugin/config/config`` that simply
parses a JSON file and returns a JSON object representing the contents of the
file.  The API is as follows:

* ``GET /plugin/config/config/<absolute>/<webpath>/<to>/<json>/<file>[?required]``

If the path specified does not point to a static file, or does not contain a
valid JSON object, the call will result in an HTTP 4xx error, with the body
expressing the particular reason for the error in a JSON response.  Otherwise,
the service will parse the file and return the configuration object in the
"result" field of the response.

If the file does not exist, then the behavior of the service depends on the
presence of absence of the ``required`` parameter:  when the call is made *with*
the parameter, this results in a 404 error; otherwise, the service returns an
empty object.  This is meant to express the use case where an application *can*
use a configuration file if specified, falling back on defaults if there is
none.

The plugin also supplies a JavaScript plugin via ``/plugin/config/config.js``;
like other JavaScript plugin components, it provides a callback-based function
that engages the service on the user's behalf:

.. js:function:: tangelo.plugin.config.config(url[, required], callback)

    :param url string: An absolute or relative URL to the configuration file
    :param required boolean: A flag indicating whether the configuration file is
        required or not (default: ``false``)
    :param callback(config) function: Callback invoked with configuration data
        when it becomes available

    Engages the config service using the file specified by `url`, invoking
    `callback` with the configuration when it becomes available.  The optional
    `required` flag, if set to ``true``, causes `callback` to be invoked with
    ``undefined`` when the configuration file doesn't exist; when set to
    ``false`` or not supplied, a non-existent configuration file results in
    `callback` being invoked with ``{}``.

UI
--

The UI plugin contains some JQuery plugins useful for building a user interface
as part of a web application.

.. js:function:: $.controlPanel()

    Constructs a control panel drawer from a ``<div>`` element.  The div can
    contain any standard HTML content; when this plugin is invoked on it, it
    becomes a sliding drawer with a clickable handle that will disappear into
    the bottom of the window when closed.

    This plugin can be used to maintain, e.g., visualization settings that
    affect what is seen in the main window.

.. js:function:: $.svgColorLegend(cfg)

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

    Constructs an SVG color legend in the ``g`` element specified by
    `cfg.legend`, mapping colors from the elements of `cfg.categories` through
    the function `cfg.cmap_func`.

Data Management and Processing
==============================

To perform visualization, at some point it is necessary to deal with raw data.
These plugins provide ways of storing, accessing, and tranforming data for use
in your application.

Data
----

These functions provide transformations of common data formats into a common
format usable by Tangelo plugins.

.. js:function:: tangelo.plugin.data.tree(spec)

    Converts an array of nodes with ids and child lists into a nested tree structure.
    The nested tree format with a standard `children` attribute is the required format for other Tangelo
    functions such as :js:func:`$.dendrogram`.

    As an example, evaluating:

    .. code-block:: javascript

        var tree = tangelo.plugin.data.tree({
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

.. js:function:: tangelo.plugin.data.distanceCluster(spec)

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

    >>> tangelo.plugin.data.distanceCluster( { data: data, clusterDistance: 5 } )
    {
        singlets: [ data[2] ],
        clusters: [ [ data[0], data[1] ] ]
    }

.. js:function:: tangelo.plugin.data.smooth(spec)

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

.. js:function:: tangelo.plugin.data.bin(spec)

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

        >>> tangelo.plugin.data.bin({
                data: [{"value": 0}, {"value": 1}, {"value": 2}],
                nBins: 2
            })
        [
            {"min": 0, "max": 1, "count": 1},
            {"min": 1, "max": 2, "count": 2}
        ]

        >>> tangelo.plugin.data.bin({
                data: [{"value": 1}, {"value": 3}],
                nBins: 2,
                min: 0,
                max: 4
            })
        [
            {"min": 0, "max": 2, "count": 1},
            {"min": 2, "max": 4, "count": 1}
        ]

        >>> tangelo.plugin.data.bin({
                data: [{"value": 1}, {"value": 3}],
                bins: [{"min": 0, "max": 2, "count": 1}, {"min": 2, "max": 10, "count": 0}]
            })
        [
            {"min": 0, "max": 2, "count": 2},
            {"min": 2, "max": 10, "count": 1}
        ]

Mongo
-----

This plugin provides a service that connects to a Mongo database and retrieves
results based on the requested query.  The API looks as follows:

* ``GET /plugin/mongo/mongo/<hostname>/<database>/<collection>?query=<query-string>&limit=<N>&fields=<fields-string>``

`query-string` should be a JSON string describing a query object, while
`field-string` should be a JSON string describing a list of fields to include in
the results.

The service returns a JSON-encoded list of results from the database.

This plugin is under development, so the interface may change in the future in
order to provide a more complete API.

.. Impala
.. ------

Visualization
=============

In order to help create vibrant visualization applications, the following
plugins provide various services and widgets to visualize different kinds of
data.  These are meant to also offer a guideline on creating new visualization
plugins as new data types and applications arise.

Vis
---

The Vis plugin provides several JQuery widgets for visualization particular
types of data using basic chart types.

**Dendrogram.** ``/plugin/vis/dendrogram.js`` provides the following JQuery
widget:

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

**Correlation Plot.** ``/plugin/vis/correlationPlot.js`` provides this widget:

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

**Timeline.** ``/plugin/vis/timeline.js`` provides this widget:

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

**Node-link diagram.** ``/plugin/vis/nodelink.js`` provides this widget:

.. js:function:: $.nodelink(spec)

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

Mapping
-------

In many cases, data has a geospatial component, for which some kind of map is a
useful mode of visualization.  The mapping plugin provides several options for
visualization geolocation data, via the following JQuery widgets.

**Geo dots.** To plot location dots on a `GeoJSON <http://geojson.org/>`_ map,
``/plugin/mapping/geodots.js`` provides:

.. js:function:: $.geodots(spec)

    :param string spec.worldGeometry: A web path to a GeoJSON file
    :param accessor spec.latitude: An accessor for the latitude component
    :param accessor spec.longitude: An accessor for the longitude component
    :param accessor spec.size: An accessor for the size of each plotted circle
    :param accessor spec.color: An accessor for the colormap category for each
        plotted circle

    Constructs a map from a GeoJSON specification, and
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

**Geo node-link diagram.**  To plot a node-link diagram on a GeoJSON map,
``/plugin/mapping/geonodelink.js`` provides:

.. js:function:: $.geonodelink(spec)

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

**Map dots.** To plot dots on a Google Map, ``/plugin/mapping/mapdots.js``
provides:

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

**GeoJS Map.** `GeoJS <https://github.com/OpenGeoscience/geojs>`_ is an
open-source visualization-centric mapping library.  Tangelo provides some JQuery
plugins to replicate the above mapping use cases with GeoJS.

**GeoJS map.** To use a GeoJS map instance as a plugin,
``/plugin/mapping/geojsMap.js`` provides:

.. js:function:: $.geojsMap(spec)

    This plugin provides a low level interface to the GeoJS mapping library.
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

**GeoJS dots.**  To plot dots on a GeoJS map, ``/plugin/mapping/geojsdots.js``
provides:

.. js:function:: $.geojsdots(spec)

    :param object[] spec.data: The list of dots to plot
    :param accessor spec.latitude: An accessor for the latitude component
    :param accessor spec.longitude: An accessor for the longitude component
    :param accessor spec.size: An accessor for the size of each plotted circle
    :param accessor spec.color: An accessor for the colormap category for each
        plotted circle

    This plugin is similar to :js:func:`$.mapdots`, but plots the dots
    using the geojsMap plugin.

    For a demonstration of this plugin, see the :root:`geojsdots example
    </examples/geojsdots>`.

Bokeh
-----

`Bokeh <http://bokeh.pydata.org/>`_ is a Python plotting library that can
display interactive graphics on the web.  Tangelo provides seamless integration
with Bokeh via the Bokeh plugin.  This plugin provides a Python decorator for
use with web service functions that invoke the Bokeh module to construct a
visualization, and a JavaScript function to smoothly transition the results of
such a service into a web application.

.. py:decorator:: tangelo.plugin.bokeh.bokeh(plot_object)

    :param PlotObject plot_object: A Bokeh ``PlotObject`` instance representing
        the plot to be displayed
    :rtype: dict -- A Python ``dict`` containing a div and a script for embedded
        the plot in a webpage

    This decorator transforms the output of a web service that computes a Bokeh
    plot to a form that can be handled by the browser.  It works by converting
    the plot object into the web components necessary to render it.  When the
    decorator is used, an ajax call to the service results in a ``dict`` of two
    fields: ``script`` and ``div``.  If the div is embedded in the DOM, and the
    script after it so that it executes, the plot will appear in the page.

Rather than perform the task of setting up the div and script manually, the
following JQuery widget, found in ``/plugin/bokeh/bokeh.js``, can help:

.. js:function:: $.bokeh(cfg)

    :param cfg.url string: The URL of a web service returning a PlotObject

    When invoked on a DOM element, the URL is retrieved; the expected data
    should be in the format described by
    :py:func:`tangelo.plugin.bokeh.bokeh` above.  The DOM element then
    receives both the div and script content returned by the service, causing
    the interactive Bokeh plot to begin running in the target DOM element.

An example application can be found at
``/plugin/bokeh/examples/scatter/index.html``.
