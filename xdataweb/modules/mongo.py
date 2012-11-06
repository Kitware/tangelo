import pymongo
import bson.json_util

class Handler:
    def __init__(self):
        self.conn = None

    def go(self, dbname, collname, file_hash=None, data=None):
        # If no schema was passed in, give an error.
        #
        # TODO(choudhury): see comment below about error codes, etc.
        if file_hash == None:
            return "no file hash!"

        # Try to establish a connection to the MongoDB server.
        #
        # TODO(choudhury): currently this assumes the server is running on the
        # same host, on the default port (27017).  This choice should be
        # passable to this class, or some other service.
        if self.conn == None:
            try:
                self.conn = pymongo.Connection()
            except pymongo.errors.AutoReconnect as e:
                # TODO(choudhury): For now, signal error with a blank return
                # string.  In the future, stuff an error code into the returned
                # json object (which can simply be None for no error).
                return ""

        # Extract the requested database and collection.
        db = self.conn[dbname]
        coll = db[collname]

        # If no data field was specified, treat this as a read request.
        if data == None:
            # Create a search schema for finding the record with the appropriate
            # hash.
            schema = {'file_hash' : file_hash}

            # Apply the schema to retrieve documents.
            results = [d for d in coll.find(schema)]

            # Convert to JSON and return the result.
            return bson.json_util.dumps(results)
        else:
            # Apply the schema to an insert request.
            coll.insert({'file_hash': file_hash, 'data': data})

            # Return a success code.
            return "ok"
