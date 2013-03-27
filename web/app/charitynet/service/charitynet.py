import bson.json_util
import datetime
import pymongo
import json

import tangelo

def run(servername, dbname, datatype, datemin = "2012-01-01", datemax = "2012-02-01"):
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
        result = coll.find()

        # Do not use normal 'result' field so the URL be used directly in a vega
        # specification.
        response = [["%05d" % d['_id'], int(d['value'])] for d in result if d['_id'] != None]
    elif datatype == "bycounty":
        coll = db["charitynet.normalized.transactions"]
        result = coll.aggregate([{"$group": {"_id": "$county", "amount": {"$sum": "$amount"}}}])
        response = [["%05d" % d['_id'], float(d['amount'])] for d in result["result"] if d["_id"] != None]
    elif datatype == "bydate":
        date_min = datetime.datetime.strptime(datemin, "%Y-%m-%d")
        date_max = datetime.datetime.strptime(datemax, "%Y-%m-%d")
        coll = db["charitynet.normalized.transactions"]
        query = {"$and": [{"date": {"$gte": date_min}}, {"date": {"$lt": date_max}}]}
        group = {"_id": "$county", "amount": {"$sum": "$amount"}}

        result = coll.aggregate([{"$match": query}, {"$group": group}])
        response = [["%05d" % d['_id'], float(d['amount'])] for d in result["result"] if d["_id"] != None]
    elif datatype == "population":
        coll = db["census"]
        response = [[d["_id"], int(d["pop2010"])] for d in coll.find()]
    else:
        response['error'] = "error: unknown datatype requested"

    # Convert to JSON and return the result.
    return bson.json_util.dumps(response)
