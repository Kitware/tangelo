import argparse
import pymongo

# Parse command line arguments.
p = argparse.ArgumentParser(description="Reverse the order of a pair of numbers stored in a MongoDB (e.g. for latlong values that should be stored as longlat).")
p.add_argument("--host", required=True, help="the MongoDB server")
p.add_argument("-d", "--database", required=True, help="the database to use")
p.add_argument("-c", "--collection", required=True, help="the collection to use")
p.add_argument("-f", "--field", required=True, help="the name of the field containing the pair of values")
p.add_argument("-r", "--report", type=int, default=500, metavar="NUM", help="report on progress every <NUM> records (set to 0 to disable reporting)")

# Extract the argument values.
args = vars(p.parse_args())
host = args["host"]
database = args["database"]
collection = args["collection"]
field = args["field"]
#bundle_size = args["bundle_size"]
report = args["report"]

# Establish the connection.
try:
    conn = pymongo.Connection(host)
except pymongo.errors.AutoReconnect as e:
    print >>sys.stderr, "error: %s" % (e.message)
    sys.exit(1)

# Get a handle to the collection.
c = conn[database][collection]

# Find all records containing the specified field name, and reverse their
# values.
pairs = c.find(fields=[field])
for (i, p) in enumerate(pairs):
    if field in p:
        data = [p[field][1], p[field][0]]
        c.update(p, {"$set": {field: data}})

    if report > 0 and (i + 1) % report == 0:
        print "%d records completed" % (i+1)
