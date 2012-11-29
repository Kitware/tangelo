import argparse
import csv
import datetime
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

    # Use "vars" to get a dictionary of the parsed arguments.
    args = vars(parser.parse_args())

    # Some named values for convenience.
    progname = sys.argv[0]
    strict_mode_msg = "%s: strict mode, exiting" % (progname)

    # Extract information from command line args.
    host = args['host']
    database = args['database']
    collection = args['collection']
    drop = args['drop']
    infile = args['input']
    strict = args['strict']

    # Construct a map directing how to process each field of the CSV file.
    valid_actions = ['float', 'int', 'date']
    i = 0
    actions = {}
    for a in args['action']:
        field = a[0]
        action = a[1]

        # Check that the requested action is valid.
        if action not in valid_actions:
            print >>sys.stderr, "%s: error: invalid action '%s'" % (progname, action)
            sys.exit(1)

        # Install the action into the action table.
        actions[field] = {'action' : action}

        # If a field is specified as a date, grab the next date format string
        # supplied by the user; bail out with an error if there are no more date
        # format strings.
        if action == 'date':
            try:
                actions[field]['date-format'] = args['date_format'][i]
                i = i + 1
            except IndexError:
                print >>sys.stderr, "%s: error: not enough date format strings" % (progname)
                sys.exit(1)

    # Create a connection to the Mongo database.
    try:
        conn = pymongo.Connection(host)
    except pymongo.errors.AutoReconnect as e:
        print >>sys.stderr, "%s: error: %s" % (progname, e.message)
        sys.exit(1)

    # TODO(choudhury): In strict mode, make sure a database of the requested
    # name exists, containing a a collection of the requested name.

    # Get a handle to the database.
    db = conn[database]

    # Drop the collection before starting, if requested.
    if drop:
        db.drop_collection(collection)

    # Get a handle to the collection.
    c = db[collection]

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
            print >>sys.stderr, "%s: error: the following action fields were missing from the data file: %s" % (progname,", ".join(missing))
            sys.exit(1)

    # Begin reading records.
    for row in reader:
        # If there are not enough entries in the row, pad it with None to
        # indicate missing values.
        while len(row) < len(cols):
            row.append(None)

        # Construct a dict to describe the row in terms of the headers.
        record = {}
        entries = zip(cols, row)
        for e in entries:
            record[e[0]] = e[1]

        # Perform the requested operations on the appropriate columns.
        for k in record:
            # Test whether the data value is None, because if it is, it means it
            # was filled in by default to represent a missing value in the
            # original data.  In such a case, there is no need to process it.
            if k in actions and record[k] != None:
                action = actions[k]['action']
                if action == 'float':
                    try:
                        record[k] = float(record[k])
                    except ValueError:
                        print >>sys.stderr, "%s: could not convert field '%s' to floating point value" % (progname, record[k])
                        if strict:
                            print >>sys.stderr, strict_mode_msg
                            sys.exit(1)
                elif action == 'int':
                    try:
                        record[k] = int(record[k])
                    except ValueError:
                        print >>sys.stderr, "%s: could not convert field '%s' to floating point value" % (progname, record[k])
                        if strict:
                            print >>sys.stderr, strict_mode_msg
                            sys.exit(1)
                elif action == 'date':
                    try:
                        datefmt = actions[k]['date-format']
                        record[k] = datetime.datetime.strptime(record[k], datefmt)
                    except ValueError as e:
                        print >>sys.stderr, "%s: error: could not convert field '%s' to a datetime object: %s" % (progname, record[k], e.message)
                        if strict:
                            print >>sys.stderr, strict_mode_msg
                            sys.exit(1)
                else:
                    raise RuntimeError("invalid action '%s' encountered during processing" % (action))

        print record

        # Now that the dictionary object is prepped, place it in the database.
        c.insert(record)
