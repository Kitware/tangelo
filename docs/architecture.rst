Tangelo System and Application Architecture
===========================================

This page will discuss Tangelo's architecture at two levels: the overall
*system architecture*, and generally recommended *application
architecture*.

System architecture
-------------------

The Tangelo framework is built on top of
`CherryPy <http://http://www.cherrypy.org/>`__, a Python-based web
server that can serve web content from static files (as a traditional
web server does) or as the result of executing some Python code. Tangelo
is set up to serve static files from a particular directory (/web), and
return the result of Python code from another (/service).

This is the major feature of the Tangelo system architecture: *web
pages* are served from one directory, while *web services* are served
from another. How this distinction is used to create *web applications*
is discussed next.

Application Architecture
------------------------

A particular web application consists of a collection of *web pages* and
a collection of *web services*. The web pages are just HTML files with
associated JavaScript or CSS files - the usual notion of a web page. On
the other hand, web *services* are Python functions exposed by the
server as web addresses. Essentially, the server will run these
functions for you when you visit a particular URL.

Web Services
~~~~~~~~~~~~

When someone visits the URL for some web service in a web browser, the
text they will see is the result of running the Python function. Because
Python is a flexible, general purpose language with an extensive
standard library, and wide support among software developers, Tangelo
web services can be very powerful tools.

Web service modules are found in the /modules directory. Each service
appears in a single Python file. For example, the following code might
appear in a file named ``add.py``:

::

    import tangelo

    class Handler:
        def go(self, a=None, b=None):
            response = tangelo.empty_response()

            class BreakOut:
                pass

            try:
                if a == None or b == None:
                    response["error"] = "Two arguments are required"
                    raise BreakOut()
                else:
                    try:
                        a = float(a)
                        b = float(b)
                    except ValueError:
                        response["error"] = "Arguments must be numeric"
                        raise BreakOut()

                    response["result"] = a + b
            except BreakOut:
                pass

            return tangelo.dumps(response)

After starting the server, visiting a URL like
``http://localhost:8080/service/add?a=5&b=10`` would show a response
similar to the following:

::

    { "error": null, "result": 15 }

The ``tangelo.dumps()`` function converts a Python object to
`JSON <http://en.wikipedia.org/wiki/JSON>`__, a useful format for
communicating between the server and client side. In this example, you
can see that there was no error reported, and the sum of 5 and 10
appears in the "result" field.

Of course, rather than visiting this page directly, an application
writer would instead use an
[Ajax](http://en.wikipedia.org/wiki/Ajax\_(programming)) call to send
the request and retrieve the result, perhaps something like the
following:

::

    $.ajax({
        url: "/service/add",
        data: {a: 5, b: 10},
        dataType: "json",
        success: function(response){
            alert("The sum is " + response.result);
        }
    });

This example shows how a JavaScript function might make use of the web
service to display a sum. Of course, web services in production
applications will not simply add numbers together. The example Tangelo
applications include web services that retrieve records from a Mongo
database instance for use in the web page portion of the application,
and one that performs "named entity recognition" using the `Natural
Language Toolkit <http://nltk.org/>`__ Python interface.

The ability to write web services in Python is what sets Tangelo apart
from an ordinary web server. They enable rich web applications by
bringing the power of Python to bear on any problem you might wish to
solve.
