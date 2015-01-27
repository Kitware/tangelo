===============================================
    Driving a Visualization with SQLAlchemy
===============================================

This tutorial demonstrates how you might set up a SQL database to serve data to
a visualization application using Tangelo.  This example demonstrates how an
application-specific approach to building and using a database can provide
flexibility and adaptability for your Tangelo application.

In this tutorial we will

- obtain *Star Trek: The Next Generation* episode data
- create an SQLite database from it
- establish some object-relational mapping (ORM) classes using SQLAlchemy
- visualize the data using `Vega <http://trifacta.github.io/vega>`_

To begin this tutorial, create a fresh directory somewhere where we can build
a new project: ::

    mkdir tng
    cd tng

Here, we will create a database, along with appropriate ORM infrastructure;
write some web services to be used as runtime data sources to pull requested
data from the database; and a simple web frontend made from HTML and JavaScript,
using the Vega visualization library.

For convenience, you can download and unpack a ZIP archive of the entire web
application as well: `tng.zip <../_static/tng.zip>`_.  However, downloading and
inspecting the files as we go, or writing them by hand from the listings below,
may encourage a deeper understanding of what's going on.

Getting the Data
================

The episode data, gleaned from `Memory Alpha <http://memory-alpha.org>`_ by
hand, is in these two CSV files:

- `episodes.csv <../_static/tng/episodes.csv>`_
- `people.csv <../_static/tng/people.csv>`_

If you take a look in these files, you'll see some basic data about episodes of
*Star Trek: The Next Generation*.  *episodes.csv* contains one row per episode,
indicating its overall episode number, season/episode, title, airdate, a link to
the associated Memory Alpha article, and numeric indices into *people.csv* to
indicate who wrote each teleplay, who developed each story, and who directed
each episode.

Creating the Database
=====================

SQLAlchemy is a Python library that provides a programmatic API for creating,
updating, and accessing SQL databases.  It includes an *object-relational
mapping (ORM)* component, meaning it provides facilities for writing Python
classes that transparently maintain a connection to the database, changing it as
the object is updated, etc.

To install SQLAlchemy, you can use the Python package manager ``pip`` as
follows::

    pip install sqlalchemy==0.9.8

(The version specifier may not be necessary, but this tutorial was designed
using SQLAlchemy 0.9.8.)

Establishing ORM Classes
------------------------

The first step in this visualization project is to establish our data model by
writing some ORM classes, then using those classes to read in the CSV files from
above and flow them into an SQLite database.  The file `startrek.py
<../_static/tng/startrek.py>`_ has what we need.  Let's analyze it, section by
section.

First, we need some support from ``SQLAlchemy``:

.. literalinclude:: ../static/tng/startrek.py
    :lines: 1-8
    :linenos:

``create_engine`` simply gives us a handle to a database - this one will exist
on disk, in the file ``tngeps.db``.  The ``echo`` keyword argument controls
whether the behind-the-scenes translation to SQL commands will appear on the
output when changes occur.  For now it may be a good idea to leave this set to
``True`` for the sake of education.

``declarative_base`` is a base class that provides the foundation for creating
ORM classes to model our data, while the ``sessionmaker`` function creates a
function that can be used to establish a connection to the database.

Next we need to import some types for the columns appearing in our data:

.. literalinclude:: ../static/tng/startrek.py
    :lines: 11-14
    :lineno-start: 11
    :linenos:

``Date`` and ``String`` will be used to store actual data values, such as
airdates, and names of people and episodes.  ``Integer`` is useful as a unique
ID field for the various objects we will be storing.

Now, we finally get to the data modeling:

.. literalinclude:: ../static/tng/startrek.py
    :lines: 17-59
    :lineno-start: 17
    :linenos:

First take a look at the classes ``Episode`` and ``Person``.  These make use of
SQLAlchemy's ``declarative_base`` to establish classes whose structure reflect
the semantics of a table in the database.  The ``__tablename__`` attribute gives
the name of the associated table, while the other named attributes give the
names of the columns appearing in it, along with the data type.

Note that the ``teleplay``, ``story``, and ``director`` attributes of
``Episode`` are a bit more complex than the others.  These are fields that
cross-reference into the "people" table:  each ``Episode`` may have
multiple writers and story developers [#f1]_, each of which is a ``Person``.  Of
course, a particular Person may also be associated with multiple Episodes, so a
special "many-to-many" relationship exists between ``Episode`` and ``Person``
when it comes to the ``teleplay``, ``story``, and ``director`` columns.  These
are expressed in the "association table" declarations appearing in lines 25, 29,
and 33.  Such tables simply contain one row for each unique episode-person
connection; they are referenced in the appropriate column declaration (lines
46-48) to implement the many-to-many relation.

The effect of these ORM classes is that when, e.g., an ``Episode`` object is
queried from the database, its ``teleplay`` property will contain a list of the
correct ``Person`` objects, having been reconstructed by examining the
"episode_teleplays" table in the database.

Creating the Database
---------------------

Now it just remains to use the ORM infrastructure to drive the parsing of the
raw data and creation of the actual database.  The file `build-db.py
<../_static/tng/build-db.py>`_ contains a Python script to do just this.  Let's
examine this script, section by section.  First, as always, we need to import
some standard modules:

.. literalinclude:: ../static/tng/build-db.py
    :lines: 1-3
    :linenos:

Next, we need some stuff from *startrek.py*:

.. literalinclude:: ../static/tng/build-db.py
    :lines: 5-9
    :linenos:
    :lineno-start: 5

Now, let's go ahead and slurp in the raw data from the CSV files:

.. literalinclude:: ../static/tng/build-db.py
    :lines: 12-19
    :linenos:
    :lineno-start: 12

We now have two lists, ``episodes`` and ``people``, containing the row data.
Before we continue, we need to "activate" the ORM classes, and connect to the
database:

.. literalinclude:: ../static/tng/build-db.py
    :lines: 22-23
    :linenos:
    :lineno-start: 22

Now let's add the rows from *people.csv* to the database:

.. literalinclude:: ../static/tng/build-db.py
    :lines: 26-33
    :linenos:
    :lineno-start: 26

This loop simply runs through the rows of the people data (excluding the first
"row," which is just the header descriptors), saving each in a table indexed by
ID:  line 30 creates a ``Person`` object, while line 33 causes a row in the
appropriate tables to be created in the database (using ORM magic).  We want the
saved table so we can reference ``Person`` objects later.

Now that we have all the people loaded up, we can put the episode data itself
into the database:

.. literalinclude:: ../static/tng/build-db.py
    :lines: 37-58
    :linenos:
    :lineno-start: 37

This is a loop running through the rows of the episode data, pulling out the
various fields, possibly converting them to appropriate Python types.  The
``teleplay``, ``story``, and ``director`` columns in particular are converted to
lists of ``Person`` objects (by looking up the appropriate ``Person`` in the
table we created earlier).  Line 58 adds the newly created ``Person`` to the
database.  The many-to-many relationships we established earlier will be invoked
here, updating the association tables according to the ``Person`` objects
present in each ``Episode`` object's fields.

Finally, we must commit the accumulated database operations:

.. literalinclude:: ../static/tng/build-db.py
    :lines: 61-
    :linenos:
    :lineno-start: 61

If you have downloaded the data files, *startrek.py*, and *build-db.py* all to
the same directory, you should be able to build the database with this command::

    python build-db.py

Because we directed the database engine to echo its activity to the output, you
should see SQL commands fly by as they are generated by the various calls to
``session.add()``.  This should result in a new file being created, *tngeps.db*.
This is an SQLite database file, and should contain all of the data and
relationships established in the raw data files.

Writing Data Services
=====================

Now we have a database and some ORM classes to query it.  The next step is to
write a web service that can pull out some data that we need.  We are going to
use `Vega <http://trifacta.github.io/vega>`_ to create some basic charts of the
episode data, and Vega visualizations rely on data presented as a list of JSON
objects, one per data point.  As a starting point for a visualization project on
Star Trek episode data, let's tally up the number of episodes written or
developed by each person in the *people* table, and use Vega to render a bar
chart.  To do so, we need to query the database and count how many episodes each
person is associated to.  We can use the ORM classes to accomplish this.  Let's
analyze the file `writers.py <../_static/tng/writers.py>`_ to see how.  First,
module imports:

.. literalinclude:: ../static/tng/writers.py
    :lines: 1-5
    :linenos:

Now, the meat of the service, the ``run()`` function:

.. literalinclude:: ../static/tng/writers.py
    :lines: 8-9
    :lineno-start: 8
    :linenos:

The function signature says that the sort parameter, if present, should be a
query argument in JSON-form, defaulting to ``False``.  We will use this
parameter to sort the list of episode writers by the number of episodes worked
on (since this may be an interesting thing to look into).  Next we need a
connection to the database:

.. literalinclude:: ../static/tng/writers.py
    :lines: 10
    :lineno-start: 10
    :linenos:

and some logic to aggregate writers' episode counts ():

.. literalinclude:: ../static/tng/writers.py
    :lines: 12-22
    :lineno-start: 12
    :linenos:

This retrieves a list of ``Episode`` objects from the database (line 13), then
loops through them, incrementing a count of writers in a dictionary (being
careful not to double count writers listed under both *teleplay* and *story* for
a given episode).

Now we convert the dictionary of collected counts into a list of objects
suitable for a Vega visualization:

.. literalinclude:: ../static/tng/writers.py
    :lines: 24-
    :lineno-start: 24
    :linenos:

This line converts each ``Person`` object into a Python dictionary after sorting
by the numeric ID (which, because of how the data was collected, roughly
corresponds to the order of first involvement in writing for *Star Trek: The
Next Generation*).  If the ``sort`` parameter was ``True``, then the results
will be sorted by descending episode count (so that the most frequent writers
will appear first, etc.).  And finally, of course, the function returns this
list of results.

With this file written we have the start of a web application.  To see how
things stand, you can launch Tangelo to serve this directory to the web,

.. code-block:: shell

    tangelo --root .

and then visit http://localhost:8080/writers?sort=false to see the list of JSON
objects that results.

Designing a Web Frontend
========================

The final piece of the application is a web frontend.  Ours will be relatively
simple.  Here is the webpage itself, in `index.html <../_static/tng/index.html>`_:

.. literalinclude:: ../static/tng/index.html
    :language: html
    :linenos:

This is a very simple HTML file with a ``div`` element (line 9), in which we
will place a Vega visualization.

Next, we have some simple JavaScript to go along with this HTML file, in
`index.js <../_static/tng/index.js>`_:

.. literalinclude:: ../static/tng/index.js
    :language: javascript
    :linenos:

This simply parses a Vega visualization specification into a JavaScript object,
which it then passes to ``vg.parse.spec()``, which in turn renders it into the
``#chart`` element of the web page [#f2]_.

The final piece of the puzzle is the Vega specification itself, in
`barchart.json <../_static/tng/barchart.json>`_.:

.. literalinclude:: ../static/tng/barchart.json
    :linenos:

This specification describes a data-driven bar chart.  You may wish to
experiment with this file (for example, changing the colors used, or the width
and height of the visualization, or by setting the ``sort`` parameter in the
``url`` property to ``false``), but as-is, the specification will deliver a bar
chart of *Star Trek: The Next Generation* writers, ordered by most episodes
worked on.

Putting It All Together
=======================

Your web application is complete!  If Tangelo is not running, start it with

.. code-block:: shell

    tangelo --root .

and then visit http://localhost:8080.  You should see a bar chart appear, in
which the trekkies out there will surely recognize some of the names.

In summary, we performed the following actions to write a Tangelo application
driven by a database:

1. Got some data we wanted to visualize.

2. Developed some ORM infrastructure to model the data, using SQLAlchemy.

3. Imported the data into a new database, using the data and the ORM models.

4. Developed a web service using SQLAlchemy to retrieve some of the data and
   then shape it into a form we needed for Vega.

5. Developed a Vega specification that can take the web service results and
   render it as a bar chart.

6. Developed a simple web application to give Vega a place to work and display
   its results.

Of course, this is just a simple example of what you can do.  With Python's
power, flexibility, and interfaces to many kinds of databases and visualization
systems, you can develop a Tangelo application that is suited to whatever
problem you happen to be working on.

.. rubric:: Footnotes

.. [#f1] And even directors, though this only happened in one episode when the
    original director was fired and a replacement brought on.

.. [#f2] For more information on how Vega works, and what you can do with it,
    see the Vega website at http://trifacta.github.io/vega.
