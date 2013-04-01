# This script parses and uploads the Enron graph data file, as supplied by
# Sotera (under the name "email_graph - Copy.txt").  The file is encoded as
# ISO-8859-2, but needs to be converted to UTF-8 for Mongo.

import argparse
import datetime
import pymongo
import sys

# Parse command line arguments.
p = argparse.ArgumentParser(description="Upload enron dataset to mongo.")
p.add_argument("--host", required=True, help="the MongoDB server")
p.add_argument("-d", "--database", required=True, help="the database to use")
p.add_argument("-c", "--collection", required=True, help="the collection to use")
p.add_argument("--drop", action="store_true", help="drop the specified collection before starting")
p.add_argument("-i", "--input", required=True, help="the input file")
p.add_argument("-b", "--bundle-size", type=int, default=10000, metavar="NUM", help="upload <NUM> records at a time")
p.add_argument("-r", "--report", type=int, default=0, metavar="NUM", help="report progress every <NUM> records (0 to disable reporting)")

# Extract the arguments.
args = vars(p.parse_args())
host = args["host"]
database = args["database"]
collection = args["collection"]
drop = args["drop"]
infile = args["input"]
bundle_size = args["bundle_size"]
report = args["report"]

# Open the input file and throw out the first line.
try:
    f = open(infile)
    f.readline()
except IOError as e:
    print >>sys.stderr, "error: %s" % (e.message)
    sys.exit(1)
        
# Establish the connection.
try:
    conn = pymongo.Connection(host)
except pymongo.errors.AutoReconnect as e:
    print >>sys.stderr, "error: %s" % (e.message)
    sys.exit(1)

# Get a handle to the collection (and drop it if requested).
c = conn[database][collection]
if drop:
    c.drop()

bundle = []
for (i, line) in enumerate(f):
    try:
        # Extract the data from the line.
        source, target, date, length = line.decode("ISO-8859-2").encode("utf-8").split("\t")

        # Cast the data to the right types.
        length = int(length)
        date = datetime.datetime.strptime(date, "%m/%d/%Y")

        # Add a record to the current bundle.
        bundle.append({"source": source, "target": target, "length": length, "date": date})
        if len(bundle) == bundle_size:
            c.insert(bundle)
            bundle = []
        
        # Report if requested.
        if report > 0 and (i+1) % report == 0:
            print "%d records processed" % (i+1)
    except:
        print "error on input line %d" % (i+1)
        print line
        print repr(line)
        raise

if len(bundle) > 0:
    c.insert(bundle)
