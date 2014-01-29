import datetime
import itertools
import pymongo
import tangelo

def run(host, database, collection, start_time=None, end_time=None, center=None, degree=None):
    response = {}

    # Bail with error if any of the required arguments is missing.
    missing = map(lambda x: x[0], filter(lambda x: x[1] is None, zip(["start_time", "end_time", "center", "degree"], [start_time, end_time, center, degree])))
    if len(missing) > 0:
        response["error"] = "missing required arguments: %s" % (", ".join(missing))
        return response

    # Cast the arguments to the right types.
    #
    # The degree is the degree of separation between the center element and the
    # retrieved nodes - an integer.
    try:
        degree = int(degree)
    except ValueError:
        response["error"] = "argument 'degree' must be an integer"
        return response

    # The start time is the number of milliseconds since the epoch (which is how
    # JavaScript dates are constructed, and therefore how dates are stored in
    # MongoDB) - an integer.
    try:
        start_time = datetime.datetime.strptime(start_time, "%Y-%m-%d")
    except ValueError:
        response["error"] = "argument 'start_time' must be in YYYY-MM-DD format"
        return response

    # The end time is another date - an integer.
    try:
        end_time = datetime.datetime.strptime(end_time, "%Y-%m-%d")
    except ValueError:
        response["error"] = "argument 'end_time' must be in YYYY-MM-DD format"
        return response

    # Get a handle to the database collection.
    ex = None
    try:
        c = pymongo.Connection(host)[database][collection]
    except (pymongo.errors.AutoReconnect, pymongo.errors.ConnectionFailure) as e:
        ex = e

    # Bail out with an error message if there was an exception.
    if ex is not None:
        response["error"] = "database error: %s" % (e.message)
        return response

    # Start a set of all interlocutors we're interested in - that includes the
    # center emailer.
    talkers = set([center])

    # Also start a table of distances from the center.
    distance = {center: 0}

    current_talkers = list(talkers)
    all_results = []
    for i in range(degree):
        # Construct and send a query to retrieve all records involving the
        # current talkers, occurring within the time bounds specified, and
        # involving two known addresses.
        query = {"$and": [ {"date": {"$gte": start_time} }, 
            {"date": {"$lt": end_time} },
            {"source": {"$ne": ""} },
            {"target": {"$ne": ""} },
            {"$or": [
                {"source": {"$in": current_talkers} },
                {"target": {"$in": current_talkers} }
                ]
            }
            ]
        }
        results = c.find(query, fields=["target", "source"])

        # Collect the names.
        #current_talkers = list(set(map(lambda x: x["target"] if x["source"] == center else x["source"], results)))
        current_talkers = list(itertools.chain(*map(lambda x: [x["target"], x["source"]], results)))
        talkers = talkers.union(current_talkers)

        # Compute updates to everyone's distance from center.
        for t in current_talkers:
            if t not in distance:
                distance[t] = i+1

        # Rewind and save the cursor.
        results.rewind()
        all_results.append(results)

    # Construct a canonical graph structure from the set of talkers and the list
    # of emails.
    #
    # Start with an index map of the talkers.
    talkers = list(talkers)
    talker_index = {name: index for (index, name) in enumerate(talkers)}

    # Create a chained iterable from all the rewound partial results.
    all_results = itertools.chain(*all_results)

    # Create a list of graph edges suitable for use by D3 - replace each record
    # in the data with one that carries an index into the emailers list.
    edges = []
    for result in all_results:
        source = result["source"]
        target = result["target"]
        ident = str(result["_id"])

        rec = { "source": talker_index[source],
                "target": talker_index[target],
                "id": ident }

        edges.append(rec)

    talkers = [{"email": n, "distance": distance[n]} for n in talkers]

    # Stuff the graph data into the response object, and return it.
    response["result"] = { "nodes": talkers,
                           "edges": edges }
    return response
