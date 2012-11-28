import argparse
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

    args = vars(parser.parse_args())
    #print args

    # Extract information from command line args.
    host = args['host']
    db = args['database']
    collection = args['collection']
    drop = args['drop']
    infile = args['input']

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
                print >>sys.stderr, sys.argv[0] + ": error: not enough date format strings"
                sys.exit(1)

    #print actions
