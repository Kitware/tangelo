====================================
    Installation and Quick Start
====================================

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
* CherryPy 3.2

The following dependencies are optional; the example application pack relies on them:

* NLTK
* NLTK data
* MongoDB
* PyMongo

**2. Check out the Tangelo source code**

Issue this git command to clone the Tangelo repository: ::

    git clone git://github.com/Kitware/tangelo.git

This will create a directory called ``tangelo`` containing the source code.

**3. Configure the build**

Create a build directory and move into it: ::

    mkdir tangelo-build
    cd tangelo-build

Run ``cmake`` or ``ccmake`` to configure, supplying the source code directory as
its argument. ::

    ccmake ../tangelo

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

This will create a directory ``deploy`` in the ``tangelo-build`` directory,
containing the deployed Tangelo server.

**5. Start the server!**

The ``tangelo`` program (in the ``deploy`` directory) controls startup and
shutdown of the Tangelo server.  Run ::

    cd deploy
    ./tangelo start

to launch the server (on `localhost:8080 <http://localhost:8080>`_ by default).  Point your browser there
and check out the demos!

Windows
=======

This installation assumes a "from-scratch" environment. Some of the steps may
not apply to you.

**1. Install Git**

GitHub has great `instructions <https://help.github.com/articles/set-up-git>`_
for setting up Git.

**2. Install CMake**

Download and install the latest version of `CMake
<http://www.cmake.org/cmake/resources/software.html>`_. Use the link marked
*Win32 Installer*.

**3. Install Ninja**

Download and unzip `Ninja <https://github.com/martine/ninja/downloads>`_. Use
the link marked *ninja-120715-win.zip*. This extracts to the single file
*ninja.exe*. We'll want the Ninja executable handy, so move it into your home
directory. You can do this from the Git shell: ::

    cp ~/Downloads/ninja.exe ~

**4. Install Python**

Download and install `Python 2.7.3 <http://www.python.org/download/>`_. Use the
link marked *Windows Installer*.

**5. Install PyMongo**

Install the `pymongo <https://pypi.python.org/pypi/pymongo/>`_ package. Use the
the *pymongo-2.4.2.win32-py2.7.exe* link.

**6. Install Python package management**

Download and install the Python packages `distribute
<http://www.lfd.uci.edu/~gohlke/pythonlibs/#distribute>`_ and `pip
<http://www.lfd.uci.edu/~gohlke/pythonlibs/#pip>`_. For each, use the link
marked *win32-py2.7.exe*.

**7. Install CherryPy**

Open the Git GUI bash shell and issue this command: ::

    /c/Python27/Scripts/pip install cherrypy

**8. Get the Tangelo source code**

Also from the Git shell, move to your development directory (here we will just
use your home directory, ``~``) and clone the Tangelo repository: ::

    cd ~
    git clone git://github.com/Kitware/tangelo.git

This will create a directory named ``tangelo``.

**9. Configure the build**

Run CMake (the *cmake-gui* shortcut in the Start menu) and set the source
directory as ``C:\Users\<username>\tangelo`` and the build directory as
``C:\Users\<username>\tangelo-build``. Click configure, and select the Ninja
generator. There will be an error initially, and you will need to specify the
``CMAKE_MAKE_PROGRAM`` as ``C:\Users\<username>\ninja.exe``. Hit generate, then
close CMake.

.. todo::
    **Verify that the above works as written, since ``cherryd`` is no longer
    needed, and the old instructions reference it as a final configure/generate
    step.**

**10. Build Tangelo**

Back in the Git GUI prompt, issue these commands: ::

    cd ~/tangelo-build
    ../ninja

**11. Start Tangelo**

Finally, move into the deployment directory and start the Tangelo server: ::

    cd deploy
    tangelo start

Voila!  You should be able to visit your Tangelo instance at
http://localhost:8080.

**12 (Optional) Install NLTK**

For the document entities example, install `NLTK
<https://pypi.python.org/pypi/nltk>`_ with the *nltk-2.0.4.win32.exe* download
and `PyYAML <http://pyyaml.org/wiki/PyYAML>`_ with the
*PyYAML-3.10.win32-py2.7.exe* download. To get the NLTK datasets needed, run
Python from the shell (``/c/Python27/python``) and execute the following: ::

    import nltk
    nltk.download()

From the window that appears, go to the *Models* tab and download the
*maxent_ne_chunker*, *maxent_treebank_pos_tagger*, and *punkt* models by
clicking on each and pressing the download button. Similarly download the
*words* dataset from the *Corpora* tab.  After closing the download window,
``quit()`` will exit the Python shell.

Testing
=======

First, install Selenium and the Python Imaging Library with

    pip install selenium PIL

Next, install the Chrome Selenium driver for your platform by
`downloading the binary <https://code.google.com/p/chromedriver/downloads/list>`_
and copying it to a directory in your system path, e.g. on Mac/Linux:

    mv /path/to/chromedriver /usr/local/bin/

In order to test Tangelo, build your project by running ``make`` or ``ninja``,
then execute ``ctest`` in the Tangelo build directory.