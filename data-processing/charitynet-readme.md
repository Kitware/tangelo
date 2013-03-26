CharityNet Dataset
==================

* Follow the Kiva instructions to get data from GeoNames into mongo.

"Clean" Dataset
---------------

* For the "clean" dataset, download and extract
charity_net_clean_19oct2012.tar.gz. Before importing into mongo you
must convert to utf8 with

    ```
    iconv -f ISO-8859-1 -t UTF-8 charity_net_entityRef.txt > charity_net_entityRef_utf8.txt
    iconv -f ISO-8859-1 -t UTF-8 charity_net_transaction.txt > charity_net_transaction_utf8.txt
    ```

* Then import these datasets into mongo with mongoimport:

    ```
    mongoimport --type tsv --headerline --drop --host mongo --db xdata --collection charitynet.entityref --file ./charity_net_entityRef_utf8.txt
    mongoimport --type tsv --headerline --drop --host mongo --db xdata --collection charitynet.transaction --file ./charity_net_transaction_utf8.txt
    ```

"Normalized" Dataset
--------------------

* For the "normalized" dataset, download and extract CharityNet_Normalized_18Sept2012.zip.
The four CSV files may be imported directly into mongo:

    ```
    mongoimport --type csv --headerline --drop --host mongo --db xdata --collection charitynet.normalized.charities --file charities.csv
    mongoimport --type csv --headerline --drop --host mongo --db xdata --collection charitynet.normalized.connections --file connections.csv
    mongoimport --type csv --headerline --drop --host mongo --db xdata --collection charitynet.normalized.donors --file donors.csv
    mongoimport --type csv --headerline --drop --host mongo --db xdata --collection charitynet.normalized.transactions --file transactions.csv
    ```

* Fix up the dates in transactions:

    ```
    python charitynet-datefix.py
    ```

* Performs a lookup on the donor location to assign latitude and longitude coordinates:

    ```
    python charitynet-fixup.py
    ```

* Perform a lookup on the donor coordinates to assign census block and county ids:

    ```
    python charitynet-lookup-county.py
    ```

* Cache location information in the transactions table:

    ```
    python charitynet-join.py
    ```
