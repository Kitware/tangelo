import pymongo
import bson.json_util

class Handler:
    def __init__(self):
        self.conn = None

    def go(self, dbname, collname, schema=None):
        # If no schema was passed in, give an error.
        #
        # TODO(choudhury): see comment below about error codes, etc.
        if schema == None:
            return ""

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
        coll = db.collname

        # Convert the schema into a Python object (it should come in as JSON).
        try:
            pyschema = bson.json_util.loads(schema)
        except ValueError:
            # TODO(choudhury): once again, see above comment for how to truly
            # handle error conditions.
            return ""

        # Apply the schema to retrieve documents.
        results = [d for d in coll.find(pyschema)]

        # Convert to JSON and return the result.
        return bson.json_util.dumps(results)
