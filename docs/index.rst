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
* Vega_

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
information.

.. _CherryPy: http://www.cherrypy.org
.. _Tangelo homepage: http://kitware.github.io/tangelo/
.. _GitHub repository: https://github.com/Kitware/tangelo
.. _Hadoop: http://hadoop.apache.org/
.. _Vega: http://trifacta.github.io/vega/

Quick Start
===========

1. Install Git_.
2. Install CMake_.
3. Open a shell and run the following: ::

    git clone https://github.com/Kitware/tangelo.git
    cd tangelo
    mkdir build
    cd build
    cmake ..
    make
    pip install dist/Tangelo-[version].tar.gz    # May require sudo
    tangelo start

4. Visit your Tangelo instance at http://localhost:8000.

Quick Start for Windows
=======================

Windows machines are "special". Take these steps to get things going.

1. Install Git_.
2. Install CMake_.
3. Install Python_ 2.7 Windows X86-64 installer.
4. Install `Windows Python packages`_ for ``pip``, ``pymongo``, and ``twisted``.
   Choose the package links ending in ``amd64-py2.7.exe``.
5. Open the Git Bash shell and run the following::

    git clone https://github.com/Kitware/tangelo.git
    cd tangelo
    mkdir build
    cd build
    curl -OL https://github.com/martine/ninja/releases/download/v1.4.0/ninja-win.zip
    unzip ninja-win.zip
    cmake -G Ninja ..
    ninja
    /c/Python27/Scripts/pip install dist/Tangelo-[version].tar.gz
    /c/Python27/Scripts/tangelo start

6. Visit your Tangelo instance at http://localhost:8000.

.. _CMake: http://www.cmake.org
.. _VirtualBox: http://www.virtualbox.org
.. _Vagrant: http://www.vagrantup.com
.. _Git: http://gitscm.com
.. _Python: http://www.python.org/download/releases/2.7/
.. _Windows Python packages: http://www.lfd.uci.edu/~gohlke/pythonlibs/

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

Information for Developers
==========================

.. toctree::
    :maxdepth: 2

    coding-style-guide
    architecture
    developing-visualizations

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
