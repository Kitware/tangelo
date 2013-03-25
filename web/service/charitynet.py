import bson.json_util
import pymongo
import json

import tangelo

class Handler:
    def go(self, servername, dbname, datatype):
        # Construct an empty response object.
        response = tangelo.empty_response();

        # Establish a connection to the MongoDB server.
        try:
            conn = pymongo.Connection(servername)
        except pymongo.errors.AutoReconnect as e:
            response['error'] = "error: %s" % (e.message)
            return bson.json_util.dumps(response)

        # Extract the requested database and collection.
        db = conn[dbname]

        if datatype == "full":
            # Output number of donors per county. Use a string prefixed by "0" if needed
            # for the county code to output state codes less than 10 correctly.
            coll = db["charitynet.normalized.donors.counties"]

            # Do not use normal 'result' field so the URL be used directly in a vega
            # specification.
            response = [["%05d" % d['_id'], int(d['value'])] for d in coll.find() if d['_id'] != None]
        else:
            respose['error'] = "error: unknown datatype requested"

        # Convert to JSON and return the result.
        return bson.json_util.dumps(response)
