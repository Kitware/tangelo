=======================================================
    Building a Tangelo Web Application from Scratch
=======================================================

This tutorial will go through the steps of building a working, albeit simple,
Tangelo application from the ground up.  Most Tangelo applications consist of
(at least) three parts:  an HTML document presenting the form of the application
as a web page, a JavaScript file to drive dynamic content and behavior within
the web page, and a Python service to perform serverside processing.  The
tutorial application will have one of each to demonstrate how they will fit
together.

String Reverser
===============

The tutorial application will be a *string reverser*.  The user will see a form
where a word can be entered, and a button to submit the word.  The word will
then make a trip to the server, where it will be reversed and returned to the
client.  The reversed word will then be displayed in the web page.

Preparing the Stage
-------------------

Tangelo will need to be running in order for the application to work.  The
quickstart instructions will be sufficient (see :ref:`quickstart`): ::

    tangelo start

This should launch Tangelo on *localhost*, port 8080 (also known as
http://localhost:8080/).

Next we need a place to put the files for the application.  We will serve the
application out of your home directory - recall that Tangelo serves user content
from the ``tangelo_html`` subdirectory: ::

    cd ~
    mkdir tangelo_html
    cd tangelo_html

It is a good practice to house each application in its own subdirectory - this
keeps things organized, and allows for easy development of web applications in
source control systems such as GitHub: ::

    mkdir reverser
    cd reverser

Supposing your user name is ``crusher``, visiting
http://localhost:8080/~crusher/reverser in a web browser should at this point
show you a directory listing of no entries.  Let's fix that by creating some
content.

HTML
----

The first step is to create a web page.  In a text editor, open a file called
``index.html`` and copy in the following:

.. code-block:: html
    :linenos:

    <!DOCTYPE html>
    <title>Reverser</title>

    <!-- Boilerplate JavaScript -->
    <script src=http://code.jquery.com/jquery-1.11.0.min.js></script>
    <script src=/js/tangelo.js></script>

    <!-- The app's JavaScript -->
    <script src=myapp.js></script>

    <!-- A form to submit the text -->
    <h2>Reverser</h2>
    <div class=form-inline>
        <input id=text type=text>
        <button id=go class="btn btn-class">Go</a>
    </div>

    <!-- A place to show the output -->
    <div id=output></div>

This is a very simple page, containing a text field (with ID ``text``), a button
(ID ``go``), and an empty div element (ID ``output``).  Feel free to reload the
page in your browser to see if everything worked properly.

Next we need to attach some behaviors to these elements.

JavaScript
----------

We want to be able to read the text from the input element, send it to the
server, and do something with the result.  We would like to do this whenever the
"Go" button is clicked.  The JavaScript to accomplish this follows - place this
in a file named ``myapp.js`` (to reflect the script tag in line 9 of
``index.html``):

.. code-block:: javascript
    :linenos:

    $(function () {
        $("#go").click(function () {
            var text = $("#text").val();
            $.getJSON("myservice?text=" + encodeURIComponent(text), function (data) {
                $("#output").text(data.reversed);
            });
        });
    });

Several things are happening in this short bit of code, so let's examine them
one by one.  Line 1 simply makes use of the jQuery ``$()`` function, which takes
a single argument:  a function to invoke with no arguments when the page content
is loaded and ready.

Line 2 uses the "CSS selector" variant of the ``$()`` function to select an
element by ID - in this case, the "go" button - and attach a behavior to its
"click" callback.

Line 3 - the first line of the function executed on button click - causes the
contents of of the text input field to be read out into the variable ``text``.

Line 4 uses the jQuery convenience function ``$.getJSON()`` to initiate an ajax
request to the URL http://localhost:8080/~crusher/reverser/myservice, passing in
the text field contents as a query argument.  When the server has a response
prepared, the function passed as the second argument to ``$.getJSON()`` will be
called, with the response as the argument.

Line 5 makes use of this response data to place some text in the blank div.
Because ``$.getJSON()`` converts the server response to a JSON object
automatically, we can simply get the reversed word we are looking for in
``data.reversed``.  The output div in the webpage should now be displaying the
reversed word.

The final component of this application is the server side processing itself,
the service named ``myservice``.

Python
------

The Python web service will perform a reversal of its input.  The following
Python code accomplishes this (save it in a file named ``myservice.py``, again,
to reflect the usage of that name in the ``myapp.js`` above):

.. code-block:: python

    def run(text=""):
        return {"reversed": text[::-1]}

This short Python function uses a terse array idiom to reverse the order of the
letters in a string.  Note that a string goes into this function from the client
(i.e., the call to ``$.getJSON`` is line 4 of ``myapp.js``), and a Python dict
comes out.  The dict is automatically converted to JSON-encoded text, which the
``$.getJSON()`` function automatically converts to a JavaScript object, which is
finally passed to the anonymous function on line 4 of ``myapp.js``.

Tying it All Together
---------------------

The application is now complete.  Once more refresh the page at
http://localhost:8080/~crusher/reverser/, type in your favorite word, and click
the "Go" button.  If all goes well, you should see your favorite word, reversed,
below the text input field!

Discussion
----------

Of course, we did not need to bring the server into this particular example,
since JavaScript is perfectly suited to reversing words should the need arise.
However, this example was meant to demonstrate how the three pieces - content,
dynamic clientside behavior, and serverside processing - come together to
implement a full, working web application.

Now imagine that instead of reversing the word, you wanted to use the word as a
search index in a database, or to direct the construction of a complex object,
or to kick off a large, parallel processing job on a computation engine, or that
you simply want to use some Python library that has no equivalent in the
JavaScript world.  Each of these cases represents some action that is difficult
or impossible to achieve using clientside JavaScript.  By writing Tangelo web
services you can enrich your application by bringing in the versatility and
power of Python and its libraries.
