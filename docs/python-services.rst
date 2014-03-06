===========================
    Tangelo Web Services
===========================

Tangelo's special power lies in its ability to run user-created *web services*
as part of a larger web application.  Essentially, each Python file in Tangelo's
web space is associated to a URL; requesting this URL (e.g., by visiting it in a
browser) will cause Tangelo to load the file as a Python module, run a
particular function found within it, and return the output as the content for
the URL.

In other words, **Tangelo web services** mean that **Python code** can become
**web resources**.  Python is a flexible and powerful programming language with
a comprehensive standard library and a galaxy of third-party modules providing
access to all kinds of APIs and software libraries.

General Services
================

Here is a simple example of a web service.  Suppose
``/home/riker/tangelo_html/calc.py`` reads as follows:

.. code-block:: python

    import tangelo

    allowed = ["add", "subtract", "multiply", "divide"]

    @tangelo.types(a=float, b=float)
    def run(operation, a=None, b=None):
        if a is None:
            return "Parameter 'a' is missing!"
        elif b is None:
            return "Parameter 'b' is missing!"

        try:
            if operation == "add":
                return a + b
            elif operation == "subtract":
                return a - b
            elif operation == "multiply":
                return a * b
            elif operation == "divide":
                return a / b
            else:
                return "Unsupported operation: %s\nAllowed operations are: %s" % (operation, ", ".join(allowed))
        except ValueError:
            return "Could not %s '%s' and '%s'" % (operation, a, b)
        except ZeroDivisionError:
            return "Can't divide by zero!"

This is a Python module named ``calc``, implementing a very rudimentary
four-function calculator in the ``run()`` function.  Tangelo will respond to a
request for the URL :root:`/examples/calculator/calc/add?a=33&b=14`
(**without** the trailing ``.py``) by loading ``calc.py`` as a Python module,
executing its ``run()`` function, and returning the result - in this case, the
string ``47`` - as the contents of the URL.

The ``run()`` function takes three arguments:  a positional argument named
``operation``, and two keyword arguments named ``a`` and ``b``.  Tangelo maps
the positional arguments to any "path elements" found after the name of the
script in the URL (in this case, ``add``), while keyword arguments are mapped to
query parameters (``33`` and ``14`` in this case).  In other words, the example
URL is the equivalent of running the following short Python script:

.. code-block:: python

    import calc
    print calc.run("add", "33", "14")

Note that *all arguments are passed as strings.*  This is due to the way URLs
and associated web technologies work - the URL itself is simply a string, so it
is chunked up into tokens which are then sent to the server.  These arguments
must therefore be cast to appropriate types at run time.  The
:py:func:`tangelo.types` decorator offers a convenient way to perform this type
casting automatically, but of course you can do it manually within the service
itself if it is necessary.

Generally speaking, the web endpoints exposed by Tangelo for each Python file
are not meant to be visited directly in a web browser; instead, they provide
data to a web application using Ajax calls to retrieve the data.  Suppose we
wish to use ``calc.py`` in a web calculator application, which includes an HTML
file with two fields for the user to type inputs into, and four buttons, one for
each arithmetic operation.  An associated JavaScript file might have code like
the following:

.. code-block:: javascript

    function do_arithmetic(op) {
        var a_val = $("#input-a").val();
        var b_val = $("#input-b").val();

        $.ajax({
            url: "calc/" + op,
            data: {
                a: a_val,
                b: b_val
            },
            dataType: "text",
            success: function (response) {
                $("#result").text(response);
            },
            error: function (jqxhr, textStatus, reason) {
                $("#result").html(reason);
            }
        });
    }

    $("#plus").click(function () {
        do_arithmetic("add");
    });

    $("#minus").click(function () {
        do_arithmetic("subtract");
    });

    $("#times").click(function () {
        do_arithmetic("multiply");
    });

    $("#divide").click(function () {
        do_arithmetic("divide");
    });

The ``do_arithmetic()`` function is called whenever the operation buttons are
clicked; it contains a call to the JQuery ``ajax()`` function, which prepares a
URL with query parameters then retrieves data from it.  The ``success`` callback
then takes the response from the URL and places it on the webpage so the user
can see the result.  In this way, your web application front end can connect to
the Python back end via Ajax.

.. _return-types:

Return Types
------------

The type of the value returned from the ``run()`` function determines how Tangelo creates
content for the associated web endpoint.  In the example above, the function
returns a number; Tangelo receives this number and turns it into a string (which
is then delivered to the ``success`` callback in the JavaScript code above).  In
general, Tangelo follows this set of steps to determine what to do with the
returned value from a Python service:

#. If the return value is a **Python object containing a** ``next()``
   **method**, Tangelo stores the object in the streaming table, and its
   contents can be retrieved via the :ref:`streaming API <streaming>`.

#.  Otherwise, if the return value is a **JSON-serializable Python object**,
    Tangelo calls ``json.dumps()`` on it to convert it into a string, and then
    delivers that string as the content.

    Python's numeric types are JSON-serializable by default, as is the value
    ``None``.  Lists and tuples of serializable items are converted into JSON
    lists, while dictionaries with serializable keys and values are converted
    into JSON objects.  Finally, any Python object *can be made*
    JSON-serializable by extending ``json.JSONEncoder`` (see the
    `Python documentation
    <http://docs.python.org/2/library/json.html#json.JSONEncoder>`_ for more
    information).

    If a **non**-JSON-serializable object is returned, this will result in a
    server error.

#. Otherwise, if the return value is a **string**, then Tangelo treats the
   return value as the final result; i.e., it delivers the return value without
   changing it.

#. Finally, if the return value **does not fit into any of the above
   steps**, Tangelo will report a server error.

Specifying a Custom Return Type Converter
-----------------------------------------

Similarly to the :py:func:`tangelo.types` decorator mentioned above, services
can specify a custom return type via the :py:func:`tangelo.return_type`
decorator.  It takes a single argument, a function to convert the object
returned from the service function to a string (or other legal service return
type; see :ref:`return-types`):

.. code-block:: python

    import tangelo

    def excited(s):
        return s + "!!!"

    @tangelo.return_type(excited)
    def run(name):
        return "hello %s" % (name)

Given ``Data`` as an input, this service will return the string ``Hello
Data!!!`` to the client.

A more likely use case for this decorator is special-purpose JSON converters,
such as Pymongo's ``bson.json_util.dumps()`` function, which can handle certain
non-standard objects such as Python ``datetime`` objects when converting to JSON
text.

RESTful Services
================

Tangelo also supports the creation of REST services.  Instead of placing
functionality in a ``run()`` function, such a service has one function per
desired REST verb.  For example, a rudimentary service to manage a collection of
databases might look like the following:

.. code-block:: python

    import tangelo
    import lcarsdb

    @tangelo.restful
    def get(dbname, query):
        db = lcarsdb.connect("enterprise.starfleet.mil", dbname)
        if not db:
            return None
        else:
            return db.find(query)

    @tangelo.restful
    def put(dbname):
        connection = lcarsdb.connect("enterprise.starfleet.mil")
        if not connection:
            return "FAIL"
        else:
            success = connection.createDB(dbname)
            if success:
                return "OK"
            else:
                return "FAIL"

The :py:func:`tangelo.restful()` decorator is used to explicitly mark the
functions that are part of the RESTful interface so as to avoid (1) restricting
REST verbs to just the set of commonly used ones and (2) exposing every function
in the service as part of a REST interface (since some of those could simply be
helper functions).

Configuration
=============

You can optionally include a configuration file alongside the service itself.
For instance, suppose the following service is implemented in `autodestruct.py`:

.. code-block:: python

    import tangelo
    import starship

    def run(officer=None, code=None, countdown=20*60):
        config = tangelo.config()

        if officer is None or code is None:
            return {"status": "failed",
                    "reason": "missing officer or code argument"}

        if officer != config["officer"]:
            return {"status": "failed",
                    "reason": "unauthorized"}
        elif code != config["code"]:
            return {"status": "failed",
                    "reason": "incorrect code"}

        starship.autodestruct(countdown)

        return { "status": "complete",
                 "message": "Auto destruct in %d seconds!" % (countdown) }

Via the :py:func:`tangelo.config` function, this service attempts to match the
input data against credentials stored in the module level configuration, which
is stored in `autodestruct.json`:

.. code-block:: javascript

    {
        "officer": "picard",
        "code": "echo november golf alpha golf echo four seven enable"
    }

The two files must have the same base name (`autodestruct` in this case) and be
in the same location. Any time the module for a service is loaded, the
configuration file will be parsed and loaded as well.  Changing either file will
cause the module to be reloaded the next time it is invoked.  The
``tangelo.config()`` function returns a copy of the configuration dictionary, to
prevent an errant service from updating the configuration in a persistent way.
For this reason, it is advisable to only call this function once, capturing the
result in a variable, and retrieving values from it as needed.
