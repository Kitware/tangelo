import datetime
import itertools
#import pymongo
import tangelo
from pyspark.context import SparkContext
import hashlib

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
        response["error"] = "argument 'start_time' must be in YYYY-MM-DD format"
        return response

    # The end time is another date - an integer.
    try:
        end_time = datetime.datetime.strptime(end_time, "%Y-%m-%d")
    except ValueError:
        response["error"] = "argument 'end_time' must be in YYYY-MM-DD format"
        return response

    # Get a handle to the database collection.
    if SparkContext._active_spark_context == None:
        sc = SparkContext('spark://impaladev.darpa.mil:7077', 'Enron Emailers')
    else:
        sc = SparkContext._active_spark_context

    enronData = sc.textFile('hdfs://localhost:8020/user/bigdata/pgill/enron/email_graph_fixed.txt').map(lambda line: line.split('\t')).cache()
            
    def withinTimespan(record):
        recordDate = datetime.datetime.strptime(record[2], "%Y-%m-%d")
        return recordDate >= start_time and recordDate < end_time
    
    def emptyRecords(record):
        return record[0] != "" and record[1] != ""
        
    def orderRecord(record):
        if record[1] < record[0]:
            record[0], record[1] = record[1], record[0]
        return record

    enronSpan = enronData.filter(withinTimespan).filter(emptyRecords).map(orderRecord).map(lambda rec: (rec[0], rec[1])).distinct().cache()
    
    # Start a set of all interlocutors we're interested in - that includes the
    # center emailer.
    talkers = set([center])

    # Also start a table of distances from the center.
    distance = {center: 0}

    current_talkers = list(talkers)
    all_results = []
    for i in range(degree):
        
        def emailsInvolved(record):
            return any(keyword in record for keyword in current_talkers)
        
        results = enronSpan.filter(emailsInvolved).collect()

        # Collect the names.
        current_talkers = list(itertools.chain(*map(lambda x: [x[1], x[0]], results)))
        current_talkers = list(set(current_talkers))
        talkers = talkers.union(current_talkers)

        # Compute updates to everyone's distance from center.
        for t in current_talkers:
            if t not in distance:
                distance[t] = i+1

        # save the cursor.
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
    ident = 0
    for result in all_results:
        source = result[0]
        target = result[1]
        ident += 1

        rec = { "source": talker_index[source],
                "target": talker_index[target],
                "id": str(ident) }

        edges.append(rec)

    talkers = [{"email": n, "distance": distance[n]} for n in talkers]

    # Stuff the graph data into the response object, and return it.
    response["result"] = { "nodes": talkers,
                           "edges": edges }
    return response




