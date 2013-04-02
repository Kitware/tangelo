import datetime
import pymongo
import tangelo

def run(host, database, collection, start_time=None, end_time=None, center=None, degree=None):
    response = tangelo.empty_response()

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
        response["error"] = "argument 'degree' must be an integer"
        return response

    # The end time is another date - an integer.
    try:
        end_time = datetime.datetime.strptime(end_time, "%Y-%m-%d")
    except ValueError:
        response["error"] = "argument 'degree' must be an integer"
        return response

    # Get a handle to the database collection.
    try:
        c = pymongo.Connection(host)[database][collection]
    except pymongo.errors.AutoReconnect as e:
        response["error"] = "database error: %s" % (e.message)
        return response

    # Start a set of all interlocutors we're interested in - that includes the
    # center emailer.
    talkers = set([center])

    current_talkers = list(talkers)
    for i in range(degree):
        # Construct and send a query to retrieve all records involving the
        # current talkers, occurring within the time bounds specified.
        query = {"$and": [ {"date": {"$gte": start_time} }, 
            {"date": {"$lt": end_time} },
            {"$or": [
                {"source": {"$in": current_talkers} },
                {"target": {"$in": current_talkers} }
                ]
            }
            ]
        }
        results = c.find(query)

        # Collect the names in the degree-1 set that are NOT the center.
        current_talkers = list(set(map(lambda x: x["target"] if x["source"] == center else x["source"], results)))
        talkers = talkers.union(current_talkers)

    # Fire one more query to retrieve all emails involving anyone in the talkers
    # set.
    talkers = list(talkers)
    query = {"$and": [ {"date": {"$gte": start_time} },
        {"date": {"$lt": end_time} },
        {"$or": [
            {"source": {"$in": talkers} },
            {"target": {"$in": talkers} }
            ]
        }
        ]
    }
    results = c.find(query)

    response["result"] = list(results)
    return response
