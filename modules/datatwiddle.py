import pymongo
import json

import tangelo

class Handler:
    def go(self, servername, dbname, collname, name=None, data=None, code=None):
        # Construct an empty response object.
        response = empty_response();

        # If no schema was passed in, give an error.
        #
        # TODO(choudhury): see comment below about error codes, etc.
        if name == None:
            response['error'] = "no name"
            return tangelo.dumps(response)

        # Establish a connection to the MongoDB server.
        try:
            conn = pymongo.Connection(servername)
        except pymongo.errors.AutoReconnect as e:
            response['error'] = "error: %s" % (e.message)
            return tangelo.dumps(response)

        # Extract the requested database and collection.
        db = conn[dbname]
        coll = db[collname]

        # If no data field was specified, treat this as a read request;
        # otherwise, write the data to the database.
        if data == None and code == None:
            # Create a search schema for finding the record with the appropriate
            # hash.
            schema = {'_id' : name}

            # Apply the schema to retrieve documents.
            response['result'] = [d for d in coll.find(schema)]
        else:
            # Apply the schema to an insert request.
            coll.save({'_id': name, 'data': data, 'code': code})

            # Return a success code.
            response['result'] = "ok"

        # Convert to JSON and return the result.
        return tangelo.dumps(response)
