.. Tangelo Web Framework documentation master file, created by
   sphinx-quickstart on Thu Apr 11 11:42:23 2013.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

==============================================================================
 Welcome to the Tangelo, the Web Application Platform for Python Programmers!
==============================================================================

Tangelo is a web application driver, implemented as a special-purpose webserver
built on top of `CherryPy <http://www.cherrypy.org>`_.  Tangelo paves the way
for you to use HTML5, CSS, JavaScript, and other web technologies such as
jQuery, D3, Bootstrap, WebGL, Canvas, and `Vega
<http://trifacta.github.io/vega/>`_ to create rich web applications - from
traditional, static pages, to cutting-edge, visual, dynamic displays.

But **Tangelo also considers Python scripts to be part of your application,
alongside your HTML and JavaScript files**, running them on your behalf to do
anything from retrieving a few database results for display, to engaging with
powerful computational engines such as Hadoop to compute complex results.  In
other words, **Tangelo reimagines the web application by making Python a
first-class citizen**, effortlessly integrating your Python code into your web
applications without your having to adapt to complex web frameworks, worry about
routing, or engage in the busy work of putting up application scaffolding.

To help in creating these newly enriched web applications, Tangelo exports the
Tangelo API, a collection of Python and JavaScript functions, standard plugins,
and the means to create custom plugins of your own, to create your own Tangelo
applications.

This document describes all the pieces that fit together to make Tangelo work.

Please visit the `Tangelo homepage <http://tangelo.kitware.com>`_ and `GitHub
repository <https://github.com/Kitware/tangelo>`_, and read our `ongoing blog
series <http://www.kitware.com/blog/posts/view/805>`_ for more information.

.. _quickstart:

Getting Started
===============

Quick Start
-----------

1. Make sure you have Python 2.7 and Pip installed (on Linux and OS X systems,
   your local package manager should do the trick; for Windows, see `here
   <http://docs.python-guide.org/en/latest/starting/install/win/>`_).

2. Open a shell (e.g. Terminal on OS X; Bash on Linux; or Command Prompt on
   Windows) and issue this command to install the Tangelo package: ::

    pip install tangelo

   (On UNIX systems you may need to do this as root, or with ``sudo``.)

3. Issue this command to start Tangelo, serving the example pack: ::

    tangelo --examples

4. Visit your Tangelo instance at http://localhost:8080.

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

Diving Deeper
-------------

* To tinker with the Tangelo examples directly, see :ref:`fiddling`.

* To learn how to create your own Tangelo application from scratch, see
  :ref:`build-app` and the other :ref:`tutorials <tutorials>`.

.. _here: http://docs.python-guide.org/en/latest/starting/install/win/

Using Tangelo
=============

.. toctree::
    :maxdepth: 2

    installation
    setup
    basic-usage
    python-services
    plugins

.. _tutorials:

Tutorials
=========

.. toctree::
    :maxdepth: 2

    tutorials/building-an-app
    tutorials/db-vis
    tutorials/fiddling

Command Line Utilities
======================

.. toctree::
    :maxdepth: 2

    tangelo-manpage
    tangelo-passwd-manpage

The Tangelo API
===============

.. toctree::
    :maxdepth: 2

    tangelo-py
    tangelo-js
    bundled-plugins

Information for Developers
==========================

.. toctree::
    :maxdepth: 2

    coding-style-guide
    releasing-tangelo
    developing-visualizations

Indices and tables
==================

* :ref:`genindex`
* :ref:`search`
