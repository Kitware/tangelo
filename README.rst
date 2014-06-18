.. image:: https://badge.fury.io/py/tangelo.svg
    :target: http://badge.fury.io/py/tangelo
    
.. image:: https://pypip.in/d/tangelo/badge.svg
    :target: https://pypi.python.org/pypi/tangelo

.. image:: https://travis-ci.org/Kitware/tangelo.svg?branch=master
    :target: https://travis-ci.org/Kitware/tangelo

============================================================
 Tangelo: A simple, quick, powerful web framework
============================================================

http://tangelo.kitware.com
---------------------------

**Tangelo** is a web framework built on top of
`CherryPy <http://www.cherrypy.org/>`_ for producing rich web applications
that pair your data with cutting-edge visual interfaces.

In a nutshell, Tangelo is a flexible HTML5 web server architecture that cleanly separates
your web *applications* (pure Javascript, HTML, and CSS) and web *services*
(pure Python), bundled with some great tools to get you started. Mix and match
from the following to create your own breed:

* `Bootstrap <http://twitter.github.io/bootstrap/>`_ to put your app's style on a solid
  footing.
* `D3 <http://d3js.org>`_ for constructing all manner of dynamic and animated charts.
* *Vega*, a brand new declarative language for defining visual interfaces.
* `MongoDB <http://www.mongodb.org>`_ for a flexible, speedy NoSQL backend to feed
  data to your apps.
* *tangelo.js*, a set of tools and interface elements that make it easy to create
  apps that put your data front and center.

Documentation
=============

See our `documentation <http://tangelo.readthedocs.org/>`_ for a getting started guide
and API descriptions.

System Architecture
===================

Tangelo applications are divided into two functional layers: the *frontend*
and *backend*, with `Ajax <http://en.wikipedia.org/wiki/Ajax_(programming)>`_
bridging the gap between them.

The *frontend* is a standard website -- HTML for content and formatting, with
CSS for styling and JavaScript for dynamic behavior.  The JavaScript code can
also make Ajax calls to the Python *backend* modules to request various
services, such as database access, server side processing, or anything else that
you can imagine.

See the `Tangelo documentation <https://tangelo.readthedocs.org>`_ for more
information.

Get Involved
============

Please join our `mailing list <http://public.kitware.com/cgi-bin/mailman/listinfo/tangelo-users>`_
to ask questions about setting up and using Tangelo.

Fork our repository and do great things. At `Kitware <http://www.kitware.com>`_,
we've been contributing to open-source software for 15 years and counting, and
want to make Tangelo as useful to as many as possible.

Acknowledgement
===============

Tangelo development is sponsored by the Air Force Research Laboratory and DARPA XDATA program.
