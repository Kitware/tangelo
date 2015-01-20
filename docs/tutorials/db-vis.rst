===============================================
    Driving a Visualization with SQLAlchemy
===============================================

This tutorial demonstrates how you might set up a SQL database to serve data to
a visualization application using Tangelo.  This example demonstrates how an
application-specific approach to building and using a database can provide
flexibility and adaptability for your Tangelo application.

The Problem
===========

In this tutorial we will

- obtain *Star Trek: The Next Generation* episode data
- create an SQLite database from it
- establish some object-relational mapping (ORM) classes using SQLAlchemy
- visualize the data using `Vega <http://trifacta.github.io/vega>`_

The episode data, gleaned from `Memory Alpha <http://memory-alpha.org>`_ by
hand, is in these two CSV files:

- `episodes.csv <../_static/tng/episodes.csv>`_
- `people.csv <../_static/tng/people.csv>`_

To begin this tutorial, create a fresh directory somewhere where we can build
a new project: ::

    mkdir tng-episodes
    cd tng-episodes

Here, we will create a database, along with appropriate ORM infrastructure;
write some web services to be used as runtime data sources to pull requested
data from the database; and a simple web frontend made from HTML and JavaScript,
using the Vega visualization library.

Creating the Database with SQLAlchemy/ORM
=========================================

Writing Data Services
=====================

The Web Application
===================
