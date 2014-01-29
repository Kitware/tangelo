import bson.json_util
import datetime
import pymongo
import json

import tangelo

def run(servername, dbname, datatype, by = None, datemin = None, datemax = None, charity = None):
    # Construct an empty response object.
    response = {}

    # Establish a connection to the MongoDB server.
    try:
        conn = pymongo.Connection(servername)
    except (pymongo.errors.AutoReconnect, pymongo.errors.ConnectionFailure) as e:
        response['error'] = "error: %s" % (e.message)
        return bson.json_util.dumps(response)

    # Extract the requested database and collection.
    db = conn[dbname]

    if datatype == "transactions":
        coll = db["charitynet.normalized.transactions"]
        conditions = [{"date": {"$ne": None}}];
        if datemin != None and datemax != None:
            date_min = datetime.datetime.strptime(datemin, "%Y-%m-%d")
            date_max = datetime.datetime.strptime(datemax, "%Y-%m-%d")
            conditions.append({"date": {"$gte": date_min}})
            conditions.append({"date": {"$lt": date_max}})
        if charity != None:
            conditions.append({"charity_id": int(charity)})
        pipeline = []
        if len(conditions) > 0:
            pipeline.append({"$match": {"$and": conditions}})
        if by == "month":
            group = {"year": {"$year": "$date"}, "month": {"$month": "$date"}}
        else:
            group = "$county"
        pipeline.append({"$group": {"_id": group, "amount": {"$sum": "$amount"}}})
        result = coll.aggregate(pipeline)
        if by == "month":
            response = [[d["_id"], float(d["amount"])] for d in result["result"] if d["_id"] != None]
        else:
            response = [["%05d" % d["_id"], float(d["amount"])] for d in result["result"] if d["_id"] != None]
    elif datatype == "population":
        coll = db["census"]
        response = [[d["_id"], int(d["pop2010"])] for d in coll.find()]
    elif datatype == "charities":
        coll = db["charitynet.normalized.transactions"]
        result = coll.aggregate([{"$group": {"_id": "$charity_id", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}])
        response = [[d["_id"], d["_id"], d["count"]] for d in result["result"]]
    else:
        response['error'] = "error: unknown datatype requested"

    # Convert to JSON and return the result.
    return bson.json_util.dumps(response)
