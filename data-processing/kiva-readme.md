Kiva Dataset
============

The Kiva dataset is a collection of microloan data that includes lender information
(name, number of loans supported, location, etc.) and loan information
(name, loan amount, location, category, etc.). Since we want to geolocate the
lenders and loans, these steps first set up a mapping from place name to
latitude and longitude using the GeoNames dataset.

* Download and extract `allCountries.zip` from [geonames](http://www.geonames.org)
* Load the geo data into mongo, replacing `your-host`:

    mongoimport -h your-host -d xdata -c geonames --type tsv --file allCountries.txt --fieldFile fieldnames --drop

* Run a script to add indices to the data and split out an array of alternate names:

    mongo --host your-host xdata import-geo.js

* Run the Python scripts which will generate CSV files containing
loan and lender information. Loading lenders will utilize the mongo
geo lookup to assign coordinates to lender locations.

    python kiva-load-lenders.py > lenders.csv
    python kiva-load-loans.py > loans.csv
 
