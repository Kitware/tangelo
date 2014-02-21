================================
    Setup and Administration
================================

.. todo::
    Fill in "setup and administration" page

Setting Up Data for the Example Applications
============================================

Tangelo comes with several `example applications
<http://localhost:8080/examples>`_, some of which require a bit of data setup
before they will work.

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
   `hosted version <http://midas3.kitwarein.com/midas/download/bitstream/339384/flickr_paris_1000.json.gz>`_.
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
in a file hosted `here <http://midas3.kitwarein.com/midas/download/bitstream/339385/enron_email.json.gz>`_.
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

A Note on Version Numbers
=========================

Tangelo uses `semantic versioning <http://semver.org/>`_ for its version
numbers.

.. todo::
    Fill in rest of version numbers section
