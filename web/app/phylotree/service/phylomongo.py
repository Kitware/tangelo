import pymongo
import bson.json_util
from bson import ObjectId
import json
import tangelo

def decode(s, argname, resp):
	try:
		return bson.json_util.loads(s)
	except ValueError as e:
		resp['error'] = e.message + " (argument '%s' was '%s')" % (argname, s)
		raise

def decodeAndAdd(s, output, argname, resp):
	try:
		#output = dict(decode(s, argname, resp).items() + output.items())
		if argname is '_id':
			output[argname] = ObjectId(str(s))
		else:
			output[argname] = bson.json_util.loads(s)
	except ValueError as e:
		resp['error'] = e.message + " (argument '%s' was '%s')" % (argname, s)
		raise

def run(servername, dbname, data_coll, name=None, objectid=None, _id=None, accession=None, scientific_name=None, noid=False, noloc=False, maxdepth=100):
    def recursiveHelper(child, depth = 0):
        it = c.find({'_id':child})
        phylo = it[0]
        if 'clades' in phylo:
            counter = 0
            for child in phylo['clades']:
                if depth >= maxdepth:
                    phylo['clades'][counter] = str(child)
                else:
                    phylo['clades'][counter] = recursiveHelper(child, depth + 1)
                counter += 1
        if noid:
            del phylo['_id']
        else:
            phylo['_id'] = str(phylo['_id'])
        if 'loc' in phylo:
            if noloc:
                del phylo['loc']
        return phylo

    # Construct an empty response object.
    response = tangelo.empty_response();

    query = dict()
    # Decode the query strings into Python objects.
    try:
        if name is not None: decodeAndAdd(name, query, 'sequences.name', response)
        if objectid is not None: decodeAndAdd(ObjectId(objectid), query, 'objectid', response)
        if _id is not None: decodeAndAdd(_id, query, '_id', response)
        if accession is not None: decodeAndAdd(accession, query, 'sequences.accession.source', response)
        if scientific_name is not None: decodeAndAdd(scientific_name, query, 'taxonomies.scientific_name', response)
    except ValueError:
        return bson.json_util.dumps(response)

    # Cast the maxdepth value to an int.
    try:
        maxdepth = int(maxdepth)
    except ValueError:
        response['error'] = "Argument 'limit' ('%s') could not be converted to int." % (maxdepth)
        return bson.json_util.dumps(response)

    # Create database connection.
    try:
        c = pymongo.Connection(servername)[dbname][data_coll]
    except pymongo.errors.AutoReconnect:
        response['error'] = "Could not connect to MongoDB server '%s'" % (servername)
        return bson.json_util.dumps(response)

    # if no arguments given just search from root
    if not query:
        query['rooted'] = True

    it = c.find(query)

    # create a new tree for results
    if it.count() == 1:
        phylo = it[0]
        phylotree = recursiveHelper(phylo['_id'])
        # Convert to JSON and return the result.
        return bson.json_util.dumps(phylotree, sort_keys=True)
    else:
        response['error'] = "Search returned %s object(s) to root the tree" % (it.count())
        response['error'] += "| %s" %(str(query))
        return bson.json_util.dumps(response)
