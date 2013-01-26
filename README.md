# XDATA Web -- A Python Framework for Powerful Web Applications

**XDATA Web** is a web framework built on top of
[CherryPy](http://www.cherrypy.org/) to enable rich web applications, bringing
the power of Python to your browser.  Install and start the server to see some
example applications.

In a nutshell, XDATA Web is a web server that, in addition to web *pages*, also
serves out web *services* written in Python.  That brings you the power of
Python -- your web applications can now do anything that Python can do.

[XDATA](http://www.darpa.mil/Our\_Work/I2O/Programs/XDATA.aspx) is a
DARPA-funded project to develop "Big Data" analysis and visualization solutions
in the realm of open-source software.

# Installation

Installation is simple -- just install the dependencies, clone this repository,
then run the "start-xdataweb" script in the top-level directory.  Then, point
your browser to [http://localhost:8080](http://localhost:8080) to check things
out.

See the [Installing XDATA Web](/wiki/Installation) page on the wiki for detailed
instructions.

# System Architecture

XDATA Web applications are divided into two functional layers: the *frontend*
and *backend*, with [Ajax](http://en.wikipedia.org/wiki/Ajax\_(programming\))
bridging the gap between them.

The *frontend* is a standard website -- HTML for content and formatting, with
CSS for styling and JavaScript for dynamic behavior.  The JavaScript code can
also make Ajax calls to the Python *backend* modules to request various
services, such as database access, server side processing, or anything else that
you can imagine.

See the [Application Architecture](/wiki/Architecture) page on the wiki for more
information.
