====================
    Installation
====================

Tangelo currently runs on Linux, OS X, and Windows.  It may run on other
UNIXlike operating systems as well, but these are the three supported platforms.

Linux and OS X
==============

**1. Install software dependencies**

Install the following software, which is required to download, build, deploy,
and run Tangelo:

.. todo::
    Hyperlink the software packages to their homepages.

* GNU Make
* CMake
* Git
* Python 2.7

**2. Check out the Tangelo source code**

Issue this git command to clone the Tangelo repository: ::

    git clone git://github.com/Kitware/tangelo.git

This will create a directory called ``tangelo`` containing the source code.

**3. Configure the build**

Create a build directory and move into it: ::

    cd tangelo
    mkdir build

Run ``cmake`` or ``ccmake`` to configure, supplying the source code directory as
its argument. ::

    cd build
    cmake ..

..  TODO: Verify these CMake options and uncomment
    ``ccmake`` will present you with a curses-based configuration interface that
    will allow you to edit the configuration options (some operating systems
    provide ``ccmake`` and ``cmake`` in different packages - check your local
    documentation).  The following options can be set if you wish, but the default
    values should be fine as well:
    * ``BUILD_TESTING`` - Generates a ``ctest`` suite for validating the JavaScript
      code with ``jslint``, running unit tests, etc.
    * ``DEPLOY_TEST_SERVICES`` - Includes the "testing" web services in the deployed
      server.
    * ``BUILD_DOCUMENTATION`` - Generates Tangelo documentation (the very document
      you are reading!) during build.
    * ``MANGLE`` and ``MINIFY`` - Options to the JavaScript minifier: ``MANGLE``
      replaces non-public variable names with shorter strings, while ``MINIFY``
      removes all unnecessary whitespace, resulting in smaller code to transmit over
      the network.
    * ``SERVER_HOSTNAME`` and ``SERVER_PORT`` - The name of the host that will run
      the server, and the port number on which it will run.

**4. Build the server**

Run the ``make`` command: ::

    make

This will create a Python package ``Tangelo-[version].tar.gz`` in the
``dist`` directory.

**5. Install the package**

To install this package into your Python environment, run::

    pip install dist/Tangelo-[version].tar.gz

This installs the `tangelo` Python package along with its dependencies
and places the ``tangelo`` executable in
a standard location such as ``/usr/local/bin``. After this step
you should be able to execute ``which tangelo`` to see where it has
been installed.

If you are reinstalling Tangelo after a ``git pull`` or source code change,
run the following::

    make
    pip uninstall tangelo
    pip install dist/Tangelo-[version].tar.gz

**6. Start the server!**

The ``tangelo`` program controls startup and
shutdown of the Tangelo server.  Run::

    tangelo start

to launch the server (on `localhost:8000 <http://localhost:8000>`_ by default).
Point your browser there and you should see a collection of demo applications
to get you started.

Windows
=======

**1. Install Git**

GitHub has great `instructions <https://help.github.com/articles/set-up-git>`_
for setting up Git.

**2. Install CMake**

Download and install the latest version of `CMake
<http://www.cmake.org/cmake/resources/software.html>`_. Use the link marked
*Win32 Installer*.

**3. Install Python**

Download and install `Python 2.7 <http://www.python.org/download/releases/2.7>`_. Use the
link marked *Windows X86-64 MSI Installer*.

**4. Install Python packages**

Download and install the `Windows Python packages <http://www.lfd.uci.edu/~gohlke/pythonlibs/>`_ for ``pip``, ``pymongo``, and ``twisted``.
Choose the package links ending in ``amd64-py2.7.exe``.

**5. Clone the Tangelo Repository**

Open the Git Bash shell and execute the following::

    cd ~
    git clone https://github.com/Kitware/tangelo.git

This will create a new directory in your home directory called ``tangelo``
containing the Tangelo sources.

**6. Install Ninja**

Create a build directory::

    cd tangelo
    mkdir build

Download and unzip `Ninja <https://github.com/martine/ninja/downloads>`_.
This extracts to the single file
*ninja.exe*. We'll want the Ninja executable handy, so we'll put it into your build
directory. You can do this all from the Git Bash shell::

    cd build
    curl -OL https://github.com/martine/ninja/releases/download/v1.4.0/ninja-win.zip
    unzip ninja-win.zip

**7. Configure and build**

From the build directory, configure the Tangelo build using CMake::

    cmake -G Ninja ..

Then build the project using the ``ninja`` build tool::

    ninja

**8. Install the package**

To install this package into your Python environment, run::

    /c/Python27/Scripts/pip install dist/Tangelo-[version].tar.gz

This installs the `tangelo` Python package along with its dependencies
and places the ``tangelo`` executable in ``/c/Python27/Scripts``.

If you are reinstalling Tangelo after a ``git pull`` or source code change,
run the following from the build directory::

    ninja
    /c/Python27/Scripts/pip uninstall tangelo
    /c/Python27/Scripts/pip install dist/Tangelo-[version].tar.gz

**9. Start the server!**

The ``tangelo`` program controls startup and
shutdown of the Tangelo server.  Run::

    /c/Python27/Scripts/tangelo start

to launch the server (on `localhost:8000 <http://localhost:8000>`_ by default).
Point your browser there and you should see a collection of demo applications
to get you started.

Example App Setup
=================

Named Entities
~~~~~~~~~~~~~~

In order to run the named entities example at http://localhost:8000/examples/ner/,
you need to install NLTK and download some datasets.
On Mac and Linux, simply run::

    pip install nltk

In a Windows Git Bash shell::

    /c/Python27/Scripts/pip install pyyaml nltk

To get the NLTK datasets needed, run
``python`` from the shell (``/c/Python27/python`` from Git Bash on Windows)
and execute the following::

    import nltk
    nltk.download()

From the window that appears, go to the *Models* tab and download the
*maxent_ne_chunker*, *maxent_treebank_pos_tagger*, and *punkt* models by
clicking on each and pressing the download button. Similarly download the
*words* dataset from the *Corpora* tab.  After closing the download window,
``quit()`` will exit the Python shell.

Testing
=======

First, install Selenium and the Python Imaging Library with::

    pip install selenium PIL

Next, install the Chrome Selenium driver for your platform by
`downloading the binary <https://code.google.com/p/chromedriver/downloads/list>`_
and copying it to a directory in your system path, e.g. on Mac/Linux::

    mv /path/to/chromedriver /usr/local/bin/

In order to test Tangelo, build your project by running ``make`` or ``ninja``,
then execute ``ctest`` in the Tangelo build directory.