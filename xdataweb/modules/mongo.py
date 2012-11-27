import pymongo
import bson.json_util
import json
import lib.util

class Handler:
    def __init__(self):
        self.conn = None

    def go(self, dbname, collname, file_hash=None, data=None):
        # Construct an empty response object.
        resp = lib.util.empty_response();

        # If no schema was passed in, give an error.
        #
        # TODO(choudhury): see comment below about error codes, etc.
        if file_hash == None:
            resp['error'] = "no file hash"
            return bson.json_util.dumps(resp)

        # Try to establish a connection to the MongoDB server.
        #
        # TODO(choudhury): currently this assumes the server is running on the
        # same host, on the default port (27017).  This choice should be
        # passable to this class, or some other service.
        if self.conn == None:
            try:
                self.conn = pymongo.Connection()
            except pymongo.errors.AutoReconnect as e:
                # TODO(choudhury): the error codes should somehow be more
                # standardized.
                resp['error'] = "could not connect to mongo database"
                return bson.json_util.dumps(resp)

        # Extract the requested database and collection.
        db = self.conn[dbname]
        coll = db[collname]

        # If no data field was specified, treat this as a read request;
        # otherwise, write the data to the database.
        if data == None:
            # Create a search schema for finding the record with the appropriate
            # hash.
            schema = {'file_hash' : file_hash}

            # Apply the schema to retrieve documents.
            resp['result'] = [d for d in coll.find(schema)]
        else:
            # Convert the JSON object "data" to a Python object.
            pydata = bson.json_util.loads(data)

            # Apply the schema to an insert request.
            coll.insert({'file_hash': file_hash, 'data': data})

            # Return a success code.
            resp['result'] = "ok"

        # Convert to JSON and return the result.
        return bson.json_util.dumps(resp)
