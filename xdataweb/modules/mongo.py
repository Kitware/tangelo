import bson.json_util
import pymongo

import xdataweb

def decode(s, argname, resp):
    try:
        return bson.json_util.loads(s)
    except ValueError as e:
        resp['error'] = e.message + " (argument '%s' was '%s')" % (argname, s)
        raise

class Handler:
    def go(self, server, db, coll, method='find', query=None, limit=1000, fields=None, sort=None, fill=None):
        # Create an empty response object.
        response = xdataweb.empty_response()

        # Check the requested method.
        if method not in ['find', 'insert']:
            response['error'] = "Unsupported MongoDB operation '%s'" % (method)
            return xdataweb.dumps(response)

        # Decode the query strings into Python objects.
        try:
            if query is not None: query = decode(query, 'query', response)
            if fields is not None: fields = decode(fields, 'fields', response)
            if sort is not None: sort = decode(sort, 'sort', response)
            if fill is not None:
                fill = decode(fill, 'fill', response)
            else:
                fill = True
        except ValueError:
            return xdataweb.dumps(response)

        # Cast the limit value to an int.
        try:
            limit = int(limit)
        except ValueError:
            response['error'] = "Argument 'limit' ('%s') could not be converted to int." % (limit)
            return xdataweb.dumps(response)

        # Create database connection.
        try:
            c = pymongo.Connection(server)[db][coll]
        except pymongo.errors.AutoReconnect:
            response['error'] = "Could not connect to MongoDB server '%s'" % (server)
            return xdataweb.dumps(response)

        # Perform the requested action.
        if method == 'find':
            # Do a find operation with the passed arguments.
            it = c.find(spec=query, fields=fields, limit=limit, sort=sort)

            # Create a list of the results.
            if fill:
                results = [x for x in it]
            else:
                results = []

            # Create an object to structure the results.
            retobj = {}
            retobj['count'] = it.count()
            retobj['data'] = results

            # Pack the results into the response object, and return it.
            response['result'] = retobj
        else:
            raise RuntimeError("illegal method '%s' in module 'mongo'")

        # Return the response object.
        return xdataweb.dumps(response)
