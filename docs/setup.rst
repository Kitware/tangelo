================================
    Setup and Administration
================================

.. todo::
    Fill in section

Configuring and Launching Tangelo
=================================

.. todo::
    Fill in section

Administering a Tangelo Installation
====================================

.. todo::
    Fill in section

.. todo::
    Setup page: mention safety issues, and about creating a permissionless
    "tangelo" user


Preparing Data for the Example Applications
===========================================

Tangelo comes with several `example applications
<http://localhost:8080/examples>`_, some of which require a bit of data setup
before they will work.

Named Entities
--------------

In order to run the named entities example at http://localhost:8000/examples/ner/,
you need to install NLTK and download some datasets.  The part of NLTK used by
the examples also requires `NumPy <http://www.numpy.org/>`_.
On Mac and Linux, simply run::

    pip install nltk numpy

In a Windows Git Bash shell::

    /c/Python27/Scripts/pip install pyyaml nltk numpy

To get the NLTK datasets needed, run the NLTK downloader from the command line
as follows::

    python -m nltk.downloader nltk.downloader maxent_ne_chunker maxent_treebank_pos_tagger punkt words

Flickr Metadata Maps
--------------------

The `Flickr Metadata Maps <http://localhost:8080/examples/flickr>`_ application
plots publicly available Flickr photo data on a Google map.  The application
works by retrieving data from a Mongo database server, which by default is
expected to live at *localhost*.  The steps to getting this application working
are to **set up a MongoDB server**, **retrieve photo metadata via the Flickr
API**, and **upload the data to the MongoDB server**.

#. **Set up MongoDB.**  To set up a Mongo server you can consult the `MongoDB
   documentation <http://www.mongodb.org>`_.  It is generally as
   straightforward as installing it via a package manager, then launching the
   ``mongod`` program, or starting it via your local service manager.

  By default, the Flickr application assumes that the server is running on the
  same host as Tangelo.  To change this, you can edit the configuration file for
  the app, found at ``/usr/share/tangelo/web/examples/flickr/config.json``.

#. **Get photo data from Flickr.**  For this step you will need a `Flickr API
   key <http://www.flickr.com/services/api/misc.api_keys.html>`_.  Armed with a
   key, you can run the ``get-flickr-data.py`` script, which can be found at
   ``/usr/share/tangelo/data/get-flickr-data.py``.  You cun run it like this:

   .. code-block:: none

       get-flickr-data.py <your API key> <maximum number of photos to retrieve> >flickr_paris.json
   
   If you do not want to retrieve the data yourself, you can use the
   `hosted version <http://midas3.kitware.com/midas/download/bitstream/339384/flickr_paris_1000.json.gz>`_.
   This dataset was generated with this script, with a max count argument of 1000.

#. **Upload the data to Mongo.** You can use this command to place the photo
   data into your MongoDB instance:

   .. code-block:: none

        mongoimport -d tangelo -c flickr_paris --jsonArray --file flickr_paris.json

   This command uses the MongoDB instance running on **localhost**, and places
   the photo metadata into the **tangelo** database, in a collection called
   **flickr_paris**.  If you edited the configuration file in Step 1 above, be
   sure to supply your custom hostname, and database/collection names in this
   step.

Now the database should be set up to feed photo data to the Flickr app - reload
the page and you should be able to explore Paris through photos.

Enron Email Network
-------------------

The `Enron Email Network <http://localhost:8080/examples/enron>`_ application
visualizes the `enron email dataset <https://www.cs.cmu.edu/~enron/>`_ as a
network of communication.  The original data has been processed into graph form,
in a file hosted `here <http://midas3.kitware.com/midas/download/bitstream/339385/enron_email.json.gz>`_.
Download this file, ``gunzip`` it, and then issue this command to upload the
records to Mongo:

   .. code-block:: none

       mongoimport -d tangelo -c flickr_paris --file enron_email.json

(Note: although ``enron_email.json`` contains one JSON-encoded object per line,
keep in mind that the file as a whole does **not** constitute a single JSON
object - the file is instead in a particular format recognized by Mongo.)

As with the Flickr data prep above, you can modify this command line to install
this data on another server or in a different database/collection.  If you do
so, remember to also modify
``/usr/share/tangelo/web/examples/enron/config.json`` to reflect these changes.

Reload the Enron app and take a look at the email communication network.

.. _versioning:

A Note on Version Numbers
=========================

Tangelo uses `semantic versioning <http://semver.org/>`_ for its version
numbers, meaning that each release's version number establishes a promise about
the levels of functionality and backwards compatibility present in that release.
Tangelo's version numbers come in two forms: *x.y* and *x.y.z*.  *x* is a *major
version number*, *y* is a *minor version number*, and *z* is a *patch level*.

Following the semantic versioning approach, major versions represent a stable
API for the software as a whole.  If the major version number is incremented, it
means you can expect a discontinuity in backwards compatibility.  That is to
say, a setup that works for, e.g., version 1.3 will work for versions 1.4, 1.5,
and 1.10, but should not be expected to work with version 2.0.

The minor versions indicate new features or functionality added to the previous
version.  So, version 1.1 can be expected to contain some feature not found in
version 1.0, but backwards compatibility is ensured.

The patch level is incremented when a bug fix or other correction to the
software occurs.

Major version 0 is special: essentially, there are no guarantees about
compatibility in the 0.*y* series.  The stability of APIs and behaviors begins
with version 1.0.

In addition to the standard semantic versioning practices, Tangelo also tags the
current version number with "dev" in the Git repository, resulting in version
numbers like "1.1dev" for the Tangelo package that is built from source.  The
release protocol deletes this tag from the version number before uploading a
package to the Python Package Index.

The :js:func:`tangelo.requireCompatibleVersion` function returns a boolean
expressing whether the version number passed to it is compatible with Tangelo's
current version.
