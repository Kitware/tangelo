.. Tangelo Web Framework documentation master file, created by
   sphinx-quickstart on Thu Apr 11 11:42:23 2013.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

=============================================
    Welcome to the Tangelo Web Framework!
=============================================

Tangelo is a general-purpose web server framework, built on top of CherryPy_.
Once it's set up, it stays out of your way, clearing the path for you to use
HTML5, CSS, JavaScript, and other web technologies such as jQuery, D3,
Bootstrap, WebGL, Canvas, and Vega_ to create rich web applications - from traditional,
static pages, to cutting-edge, visual, dynamic displays.  **Tangelo also lets
you include Python scripts as part of your application, alongside your HTML and
JavaScript files**, running them on your behalf to do anything from retrieving a
few database results for display, to engaging with powerful computational
engines such as Hadoop to compute complex results.

To help in creating these applications, Tangelo exports the Tangelo API, which
exists as a collection of Python functions, JavaScript functions, and a set of
rules for creating flexible and powerful web services.  This document describes
all the pieces that fit together to make Tangelo work.

Please visit the `Tangelo homepage`_ or the `GitHub repository`_ for more
information.

.. _CherryPy: http://www.cherrypy.org
.. _Tangelo homepage: http://kitware.github.io/tangelo/
.. _GitHub repository: https://github.com/Kitware/tangelo
.. _Vega: http://trifacta.github.io/vega/

.. _quickstart:

Quick Start
===========

1. Make sure you have Python 2.7 and Pip installed (on Linux and OS X systems,
   your local package manager should do the trick; for Windows, see here_).

2. Open a shell (e.g. Terminal on OS X; Bash on Linux; or Command Prompt on
   Windows) and issue this command to install the Tangelo package: ::

    pip install tangelo

   (On UNIX systems you may need to do this as root, or with ``sudo``.)

3. Issue this command to start up a Tangelo server: ::

    tangelo start

4. Visit your Tangelo instance at http://localhost:8080.

.. _here: http://docs.python-guide.org/en/latest/starting/install/win/

Using Tangelo
=============

.. toctree::
    :maxdepth: 2

    installation
    setup
    basic-usage
    python-services
    advanced-usage

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

Tutorials
=========

.. toctree::
    :maxdepth: 2

    building-an-app

Information for Developers
==========================

.. toctree::
    :maxdepth: 2

    coding-style-guide
    developing-visualizations
    testing

Indices and tables
==================

* :ref:`genindex`
* :ref:`search`
