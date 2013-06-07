from bulbs.config import Config
from bulbs.titan import Graph
import sys

c = Config("http://localhost:8182/graphs/enron")
g = Graph(c)

# Open the input file and throw out the first line.
try:
    f = open("email_graph.txt")
    f.readline()
except IOError as e:
    raise
        
verts = {}
report = 1000
g.vertices.index.create_key("email")
for (i, line) in enumerate(f):
    try:
        # Extract the data from the line.
        source, target, date, length = line.decode("ISO-8859-2").encode("utf-8").split("\t")

        if source not in verts:
            v = g.vertices.create(email=source)
            verts[source] = v

        if target not in verts:
            v = g.vertices.create(email=target)
            verts[target] = v

        g.edges.create(verts[source], date, verts[target])

        # Report if requested.
        if report > 0 and (i+1) % report == 0:
            print "%d records processed" % (i+1)
    except:
        print "error on input line %d" % (i+1)
        print line
        print repr(line)
        raise
