import bson.json_util
import pymongo
import json

import tangelo

def run(servername, dbname, collname, file_hash=None, data=None):
    # Construct an empty response object.
    response = {}

    # If no schema was passed in, give an error.
    #
    # TODO(choudhury): see comment below about error codes, etc.
    if file_hash == None:
        response['error'] = "no file hash"
        return bson.json_util.dumps(response)

    # Establish a connection to the MongoDB server.
    try:
        conn = pymongo.Connection(servername)
    except (pymongo.errors.AutoReconnect, pymongo.errors.ConnectionFailure) as e:
        response['error'] = "error: %s" % (e.message)
        return bson.json_util.dumps(response)

    # Extract the requested database and collection.
    db = conn[dbname]
    coll = db[collname]

    # If no data field was specified, treat this as a read request;
    # otherwise, write the data to the database.
    if data == None:
        # Create a search schema for finding the record with the appropriate
        # hash.
        schema = {'file_hash' : file_hash}

        # Apply the schema to retrieve documents.
        response['result'] = [d for d in coll.find(schema)]
    else:
        # Convert the JSON object "data" to a Python object.
        try:
            pydata = bson.json_util.loads(data)
        except ValueError as e:
            response['error'] = e.message
            return bson.json_util.dumps(response)

        # Apply the schema to an insert request.
        coll.insert({'file_hash': file_hash, 'data': data})

        # Return a success code.
        response['result'] = "ok"

    # Convert to JSON and return the result.
    return bson.json_util.dumps(response)
