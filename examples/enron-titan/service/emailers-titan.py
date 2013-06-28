import datetime
import itertools
import tangelo
#from bulbs.rexster import RexsterClient
from bulbs.config import Config, DEBUG
from bulbs.titan import Graph

#def run(host, port, graph, start_time=None, end_time=None, center=None, degree=None):
def run(host, port, graph, start_time=None, days=1, center=None, degree=None):
    response = tangelo.empty_response()

    # Bail with error if any of the required arguments is missing.
    missing = map(lambda x: x[0], filter(lambda x: x[1] is None, zip(["start_time", "days", "center", "degree"], [start_time, days, center, degree])))
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
    
    try:
        days = int(days)
    except ValueError:
        response["error"] = "argument 'days' must be an integer"
        return response
    
    dateList = [ start_time + datetime.timedelta(days=x) for x in range(0,days) ]

    config = Config("http://"+host+":"+port+"/graphs/"+graph)
    config.set_logger(DEBUG)
    #client = RexsterClient(config)
    g = Graph(config)

    # Start a set of all interlocutors we're interested in - that includes the
    # center emailer.
    talkers = set([center])

    # Also start a table of distances from the center.
    distance = {center: 0}
    current_talkers = list(talkers)
    
    center_vertex = g.vertices.index.lookup(email=center).next()

    edgeId = 0;
    edges = []
    for i in range(degree):
       
        new_talkers = []
          
        for talker_email in current_talkers:
        
            current_vertex = g.vertices.index.lookup(email=talker_email).next()
          
            for day in dateList:
                dayString = day.strftime('%m/%d/%Y')
              
                adjacent = current_vertex.bothV(dayString)
                
                if adjacent != None:
                    adjacent_talkers = list(set(itertools.chain(*map(lambda x: [x.email], adjacent))))
                    
                    if '' in adjacent_talkers:
                        adjacent_talkers.remove('')
                    
                    for this_talker in adjacent_talkers:
                        newEdge = { "source": this_talker,
                        "target": talker_email,
                        "id": edgeId }
                        edges.append(newEdge)
                        edgeId += 1
                    
                    new_talkers.extend(adjacent_talkers)
            
        current_talkers.extend(new_talkers)
        current_talkers = list(set(current_talkers))
        
        talkers = talkers.union(current_talkers)

        # Compute updates to everyone's distance from center.
        for t in current_talkers:
            if t not in distance:
                distance[t] = i+1

    # Construct a canonical graph structure from the set of talkers and the list
    # of emails.
    #
    # Start with an index map of the talkers.
    talkers = list(set(talkers))
    talker_index = {name: index for (index, name) in enumerate(talkers)}

    for edge in edges:
        edge["source"] = talker_index[edge["source"]]
        edge["target"] = talker_index[edge["target"]]
    
    talkers = [{"email": n, "distance": distance[n]} for n in talkers]
    
    # Stuff the graph data into the response object, and return it.
    response["result"] = { "nodes": talkers,
                           "edges": edges }
    return response
