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

Tangelo web services are exactly as powerful as the Python code that drives
them, **so Tangelo web services are very powerful**.

General Services
================

Let's begin with a really simple example.  Suppose
``/home/riker/tangelo_html/calc.py`` reads as follows:

.. code-block:: python

    allowed = ["add", "subtract", "multiply", "divide"]

    def run(operation, a=None, b=None):
        if a is None:
            return "Parameter 'a' is missing!"
        elif b is None:
            return "Parameter 'b' is missing!"

        try:
            a = float(a)
        except ValueError:
            return "Argument 'a' ('%s') must be a number!" % (a)

        try:
            b = float(b)
        except ValueError:
            return "Argument 'b' ('%s') must be a number!" % (b)

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

This is a Python module named ``calc``, implementing a very rudimentary
four-function calculator in the ``run()`` function.

RESTful Services
================

Streaming
=========
