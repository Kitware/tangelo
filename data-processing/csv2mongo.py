import argparse
import csv
import sys

import pymongo

if __name__ == '__main__':
    # Parse command line arguments.
    parser = argparse.ArgumentParser(description="Clean and upload CSV data to a Mongo database.")

    parser.add_argument("--host", required=True, help="the MongoDB server")
    parser.add_argument("-d", "--database", required=True, help="the database to use")
    parser.add_argument("-c", "--collection", required=True, help="the collection to use")
    parser.add_argument("--drop", action='store_true', help="whether to drop the specified collection before beginning")
    parser.add_argument("-a", "--action", action='append', nargs=2, help="a CSV field, and associated action to take ('float','int','date','clean-quotes'")
    parser.add_argument("--date-format", action='append', help="date format string (supply once per 'date' action specified)")
    parser.add_argument("-i", "--input", nargs='?', type=argparse.FileType('r'), default=sys.stdin)
    parser.add_argument("-s", "--strict", action='store_true', help="Exits with error if any action fields do not exist in CSV header row")

    args = vars(parser.parse_args())
    #print args

    # Extract information from command line args.
    host = args['host']
    db = args['database']
    collection = args['collection']
    drop = args['drop']
    infile = args['input']
    strict = args['strict']

    # Construct a map directing how to process each field of the CSV file.
    i = 0
    actions = {}
    for a in args['action']:
        field = a[0]
        action = a[1]
        actions[field] = {'action' : action}

        # If a field is specified as a date, grab the next date format string
        # supplied by the user; bail out with an error if there are no more date
        # format strings.
        if action == 'date':
            try:
                actions[field]['date-format'] = args['date_format'][i]
                i = i + 1
            except IndexError:
                print >>sys.stderr, "%s: error: not enough date format strings" % (sys.argv[0])
                sys.exit(1)

    #print actions

#    # Begin reading the input file.
    ##
    ## The first line should contain column headers.
    #cols = infile.readline().strip().split(",")
    #for i in range(len(cols)):
        #if (cols[i][0] == '"' and cols[i][-1] == '"') or (cols[i][0] == "'" and cols[i][-1] == "'"):
            #cols = cols[1:-1]

    # Create a CSV reader object.
    reader = csv.reader(infile)

    # Read the first line of the input, which should contain column headers.
    cols = reader.next()

    # Check that action fields all exist, if requested.
    if strict:
        missing = []
        for f in actions.keys():
            if f not in cols:
                missing.append(f)
        if len(missing) > 0:
            print >>sys.stderr, "%s: error: the following action fields were missing from the data file: %s" % (sys.argv[0],", ".join(missing))
            sys.exit(1)
