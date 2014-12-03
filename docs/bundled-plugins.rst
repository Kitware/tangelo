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

VTKWeb
------

Girder
------

Utilities
=========

Config
------

SVG2PDF
-------

User Interface
--------------

Data Management and Processing
==============================

Data
----

Mongo
-----

Impala
------

Visualization
=============

Vis
---

Mapping
-------

Bokeh
-----
