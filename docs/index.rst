.. Tangelo Web Framework documentation master file, created by
   sphinx-quickstart on Thu Apr 11 11:42:23 2013.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

.. todolist::

=============================================
    Welcome to the Tangelo Web Framework!
=============================================

Tangelo is a general-purpose web server framework, built on top of CherryPy_.
Once it's set up, it stays out of your way, clearing the path for you to use
HTML5, CSS, JavaScript, and other web technologies such as

* JQuery
* D3
* Bootstrap
* WebGL
* Canvas

to create rich web applications - from traditional, static pages, to
cutting-edge, visual, dynamic displays.  **Tangelo also lets you include Python
scripts as part of your application, alongside your HTML and Javascript files**,
running them on your behalf to do anything from retrieving a few database
results for display, to engaging with powerful computational engines such as
Hadoop_ to compute complex results.

To help in creating these applications, Tangelo exports the Tangelo API, which
exists as a collection of Python functions, JavaScript functions, and a set of
rules for creating flexible and powerful web services.  This document describes
all the pieces that fit together to make Tangelo work.

Please visit the `Tangelo homepage`_ or the `GitHub repository`_ for more
information.  Happy hacking!

.. _CherryPy: http://www.cherrypy.org
.. _Tangelo homepage: http://kitware.github.io/tangelo/
.. _GitHub repository: https://github.com/Kitware/tangelo
.. _Hadoop: http://hadoop.apache.org/

Quick Start
===========

1. Install Git_.
2. Install CMake_.
3. Open a shell (or Git Bash shell) and run the following: ::

    git clone https://github.com/Kitware/tangelo.git
    cd tangelo
    mkdir build
    cd build
    cmake ..
    make
    pip install dist/Tangelo-[version].tar.gz    # May require sudo
    tangelo start

4. Visit your Tangelo instance at http://localhost:8000.

.. _CMake: http://www.cmake.org
.. _VirtualBox: http://www.virtualbox.org
.. _Vagrant: http://www.vagrantup.com
.. _Git: http://gitscm.com

Using Tangelo
=============

.. toctree::
    :maxdepth: 2

    installation
    basic-usage
    python-services
    integration

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

Other
=====

.. toctree::
    coding-style-guide
    architecture

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
