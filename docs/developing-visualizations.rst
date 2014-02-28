=================================
    Developing Visualizations
=================================

.. _jquery-widgets:

Creating jQuery Widgets
=======================

Tangelo visualizations are implemented as jQuery widgets. They extend the
base jQuery UI widget class, but otherwise do not need to depend on anything
else from jQuery UI.

Visualization Options
=====================

Basic Options
-------------

*   `data` - The data associated with the visualization, normally
    an array.
*   `width`, `height` - The width and height of the visualization, in pixels.
    If omitted, the visualization should resize to fit the DOM element.

Visualization Mapping Options
-----------------------------

The following options are optional, but if your visualization is able to map
data element properties to visual attributes like size, color, and label, you
should use this standard naming convention. If you have multiple sets of visual
elements (such as nodes and links in a graph), prefix these attributes as
appropriate (e.g. `nodeSize`, `nodeStrokeWidth`).

*   `size` - The size of the visual element as a number of pixels. For example,
    if drawing a square for each data element, the squares should have sizes
    equal to the square-root of what the `size` option returns for each
    data element.
*   `color` - The main color of the visual element, specified as a CSS color string.
*   `symbol` - The symbol to use for the visual element.
    This should use D3's standard set of symbol names.
*   `label` - The label for the visual element (a string).
*   `stroke` - The color of the stroke (outline) of the visual element specified
    in pixels.
*   `strokeWidth` - The width of the stroke of the visual element in pixels.
*   `opacity` - The opacity of the entire visual element, as a number between 0 to 1.

.. _accessor:

Accessor Specifications
=======================

AccessorSpec
------------

Each visual mapping should take an `AccessorSpec` for a value.
Accessor specifications work much like `DataRef` specs do in Vega,
though they also allow programmatic ways to generate arbitrary
accessors and scales.

*   ``function (d) { ... }`` - The most general purpose way
    to generate a visual mapping. The argument is the data element and the return
    value is the value for the visual property.

*   ``{value: v}`` - Sets the visual property to the same constant
    value `v` for all data elements.

*   ``{index: true}`` - Evaluates to the index of the data item within its
    array.

*   ``{field: "dot.separated.name"}`` - Retrieves the specified field
    or subfield from the data element and passes it through the
    visualization's default scale for that visual property.
    Unlike Vega, fields from the original data do not need to be
    prefixed by ``"data."``. The special field name ``"."``
    refers to the entire data element.

*   ``{field: "dot.separated.name", scale: ScaleSpec}`` - Overrides the default scale
    using a scale specification. Set `scale` to ``tangelo.identity`` to use
    a field directly as the visual property.

*   ``{}`` - The *undefined accessor*.  This is a function that, if called,
    throws an exception.  The function also has a property ``undefined`` set to
    *true*.  This is meant as a stand-in for the case when an accessor must be
    assigned but there is no clear choice for a default.  It is also used when
    creating Tangelo jQuery widgets to mark a property as being an accessor.
    Calling :js:func:`tangelo.accessor()` with no arguments also results in an
    undefined accessor being created and returned.

ScaleSpec
---------

A scale specification defines how to map data properties to visual properties.
For example, if you want to color your visual elements using a data field
`continent` containing values such as North America, Europe, Asia, etc.
you will need a scale that maps North America to ``"blue"``,
Europe to ``"green"``, etc. Vega has a number of built-in named scales that
together define the `ScaleSpec`. In Tangelo, a `ScaleSpec` may also be an
arbitrary function.
