.. image:: https://badge.fury.io/py/tangelo.svg
    :target: http://badge.fury.io/py/tangelo
    
.. image:: https://pypip.in/d/tangelo/badge.svg
    :target: https://pypi.python.org/pypi/tangelo

.. image:: https://pypip.in/license/tangelo/badge.svg
    :target: http://www.apache.org/licenses/LICENSE-2.0.html
    :alt: License

.. image:: https://travis-ci.org/Kitware/tangelo.svg?branch=master
    :target: https://travis-ci.org/Kitware/tangelo

.. image:: https://readthedocs.org/projects/pip/badge/
    :target: http://tangelo.readthedocs.org/en/latest/

============================================================
 Tangelo: A Web Application Platform for Python Programmers
============================================================

Tangelo reimagines the "web application" by bringing Python into the fold:  in
addition to serving standard components such as HTML, CSS, and JavaScript files
in the usual way, Tangelo also manufactures serverside web services from Python
files in your application.  These services might provide custom adapters to
databases, launch complex jobs on a cluster to retrieve the results later,
perform image analysis, or really anything that can be done in a Python script.
The Python standard library is extensive, and the galaxy of third-party
libraries even more so.  Instead of demanding that you adapt your code to a
complex web framework, worrying about routing and scaffolding along the way,
Tangelo adapts to you, effortlessly integrating your Python code right into
your web application.

Tangelo runs these expanded web applications with a special purpose webserver,
built on top of `CherryPy <http://www.cherrypy.org/>`_, which runs the Python
scripts on demand, allowing your HTML and JavaScript to retrieve content from
the scripts.  The result is a rich web application that pairs your data with
cutting-edge visual interfaces.

Tangelo comes bundled with some great examples to get you started. Mix and match
from the following to create your own breed:

* `Bootstrap <http://twitter.github.io/bootstrap/>`_ to put your app's style on
  a solid footing.

* `D3 <http://d3js.org>`_ for constructing all manner of dynamic and animated
  charts.

* `Vega <http://trifacta.github.io/vega/>`_, a brand new declarative language
  for defining visual interfaces.

* `MongoDB <http://www.mongodb.org>`_ for a flexible, speedy NoSQL backend to
  feed data to your apps.

* `Bundled Tangelo plugins
  <http://tangelo.readthedocs.org/en/latest/bundled-plugins.html>`_, providing
  utilities such as streaming of big data, basic visualization elements such as
  interactive charts, and user interface elements.

Get Started
===========

Quick Start
-----------

To get started with Tangelo's example application pack, run the following: ::

    $ pip install tangelo
    $ tangelo --examples

and then visit http://localhost:8080 in your favorite web browser.

Hello World
-----------

Follow these steps to create an extremely simple Tangelo application: ::

    $ mkdir hello
    $ cd hello
    $ vim helloworld.py

.. code-block:: python

    import datetime

    def run():
        return "hello, world - the current time and date is: %s\n" % (datetime.datetime.now())

.. code-block:: none

    $ tangelo --port 8080
    $ curl http://localhost:8080/helloworld

    hello, world - the current time and date is: 2015-03-31 14:29:44.29411

Learn More
==========

See Tangelo's `documentation <http://tangelo.readthedocs.org/>`_ for a getting
started guide, advanced usage manual, step-by-step tutorials, and API descriptions.

Read our ongoing `blog series <http://www.kitware.com/blog/home/post/805>`_ for
some in-depth discussion of Tangelo and its uses.

Visit the `website <http://www.tangelohub.org/tangelo/>`_ to learn about
Tangelo and its sibling software projects in the TangeloHub platform, and about
how Kitware can help you make the most of your data, computational resources,
and web applications.

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
