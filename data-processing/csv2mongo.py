import argparse
import csv
import datetime
import sys

import pymongo

def main():
    # Parse command line arguments.
    parser = argparse.ArgumentParser(description="Clean and upload CSV data to a Mongo database.")

    parser.add_argument("--host", required=True, help="the MongoDB server")
    parser.add_argument("-d", "--database", required=True, help="the database to use")
    parser.add_argument("-c", "--collection", required=True, help="the collection to use")
    parser.add_argument("--drop-collection", action='store_true', help="drop the specified collection before beginning")
    parser.add_argument("--convert", action='append', default=[], nargs=2, metavar=('FIELD', 'TYPE'), help="convert <FIELD> to <TYPE> before upload ('float' or 'int')")
    parser.add_argument("--date", action='append', default=[], nargs=2, metavar=('FIELD', 'FMTSTRING'), help="convert <FIELD> to a date object, using <FMTSTRING>")
    parser.add_argument("--location", nargs=3, metavar=('LATFIELD','LONGFIELD','NAME'), help="fuse <LATFIELD> and <LONGFIELD> fields into single field named <NAME> (<LATFIELD> and <LONGFIELD> will be converted to float)")
    parser.add_argument("--hashtags", action='append', default=[], nargs=2, metavar=('FIELD','NAME'), help="extract hashtags from <FIELD> and put them in a new field named <NAME>")
    parser.add_argument("--drop-field", action='append', default=[], metavar=('FIELD'), help="do not upload <FIELD> to database")
    parser.add_argument("-r", "--rename-field", action='append', default=[], nargs=2, metavar=('FIELD', 'NAME'), help="rename field FIELD to NAME")
    parser.add_argument("-i", "--input", nargs='?', metavar='FILE', type=argparse.FileType('r'), default=sys.stdin, help="input file (defaults to stdin)")
    parser.add_argument("-s", "--strict", action='store_true', help="exits with error if any action fields do not exist in CSV header row")
    parser.add_argument("-v", "--verbose", action='store_true', help="print out records as they are processed")
    parser.add_argument("-w", "--warning", action='store_true', help="print out warnings when they occur")
    parser.add_argument("-p", "--progress", type=int, default=0, metavar='NUM', help="print out progress reports every <NUM> records")
    parser.add_argument("-b", "--bundle-size", type=int, default=1, metavar='NUM', help="upload <NUM> records at a time")

    # Use "vars" to get a dictionary of the parsed arguments.
    args = vars(parser.parse_args())

    # Some named values for convenience.
    progname = sys.argv[0]
    strict_mode_msg = "%s: strict mode, exiting" % (progname)

    # Extract information from command line args.
    host = args['host']
    database = args['database']
    collection = args['collection']
    drop_collection = args['drop_collection']
    conversions = args['convert']
    dates = args['date']
    location = args['location']
    hashtags = args['hashtags']
    drop_fields = args['drop_field']
    rename = args['rename_field']
    infile = args['input']
    strict = args['strict']
    verbose = args['verbose']
    warning = args['warning']
    progress = args['progress']
    bundle_size = args['bundle_size']

    # Form a table of field renames.
    tmp = {}
    for p in rename:
        tmp[p[0]] = p[1]
    rename = tmp
    del tmp

    # Process the various requested data processing actions (convert, date,
    # location, hashtags, and drop-field) into an action map.
    #
    # Type conversions.
    valid_types = ['float', 'int']
    convert = {}
    for a in conversions:
        # Extract the sub-arguments.
        field = a[0]
        convtype = a[1]

        # Check that the requested conversion type is valid.
        if convtype not in valid_types:
            print >>sys.stderr, "%s: error: invalid conversion type '%s'" % (progname, convtype)
            sys.exit(1)

        # Check that the field is not being repeated.
        if field in convert:
            print >>sys.stderr, "%s: error: field '%s' specified more than once for type conversion" % (progname, field)
            sys.exit(1)

        # Install the action in the table.
        convert[field] = convtype

    # Date conversions.
    date = {}
    for a in dates:
        # Extract the sub-arguments.
        field = a[0]
        fmt = a[1]

        # Make sure the field is not already in the 'convert' table.
        if field in convert:
            print >>sys.stderr, "%s: error: field '%s' appears for both type conversion and date conversion" % (progname, field)
            sys.exit(1)

        # Install the information in the table.
        date[field] = fmt

    # Location extraction.
    if location is not None:
        # Extract the sub-arguments.
        latfield = args['location'][0]
        longfield = args['location'][1]
        name = args['location'][2]

        # Record the information.
        location = { 'latfield' : latfield,
                     'longfield' : longfield,
                     'name' : name }

    # Hashtag extraction.
    hashtag = {}
    # Add the fields to the hashtag field set.
    for a in hashtags:
        # Extract the sub-arguments.
        field = a[0]
        name = a[1]

        # Make sure field doesn't appear more than once.
        if field in hashtag:
            print >>sys.stderr, "%s: error: field '%s' appears more than once for hashtag extraction" % (progname, field)
            sys.exit(1)

        hashtag[field] = name

    # Drop fields.
    drop = []
    # Add the fields to the drop field set.
    for a in drop_fields:
        # Make sure the field doesn't appear in any data conversion
        # operations.
        if a in convert or a in date:
            print >>sys.stderr, "%s: error: field '%s' appears both for type/date conversion and for dropping" % (progname, field)
            sys.exit(1)

        # Make sure the field doesn't appear more than once.
        if a in drop:
            print >>sys.stderr, "%s: error: field '%s' appears more than once for dropping" % (progname, field)
            sys.exit(1)

        # Place the field name in the drop table.
        drop.append(a)

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
    if drop_collection:
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
        if location is not None:
            all_fields = convert.keys() + date.keys() + [location['latfield'], location['longfield']] + hashtag.keys() + list(drop)
        else:
            all_fields = convert.keys() + date.keys() + hashtag.keys() + list(drop)

        for f in all_fields:
            if f not in cols:
                missing.append(f)

        if len(missing) > 0:
            print >>sys.stderr, "%s: error: the following action fields were missing from the data file: %s" % (progname,", ".join(missing))
            sys.exit(1)

    # Begin reading records.
    count = 0
    bundle = []
    for row in reader:
        # If there are not enough entries in the row, pad it with None to
        # indicate missing values.
        while len(row) < len(cols):
            row.append(None)

        # Construct a dict to describe the row in terms of the headers.  The
        # "dropped" headers must be included in this step, in case they need to
        # be processed into a location tuple or a hashtag list first.
        record = {}
        entries = zip(cols, row)
        for e in entries:
            record[e[0]] = e[1]

        # Adjoin a location field if one exists in the command line arguments.
        # The empty coordinates are to be filled in with lat/long values during
        # processing below.
        if location is not None:
            record[location['name']] = [None, None]

        # Perform the requested operations on the appropriate columns.
        for k in record.keys():
            # Test whether the data value is None, because if it is, it means it
            # was filled in by default to represent a missing value in the
            # original data.  In such a case, there is no need to process it.
            if record[k] is not None:
                # Perform type conversion if requested.
                if k in convert:
                    convtype = convert[k]
                    if convtype == 'float':
                        try:
                            record[k] = float(record[k])
                        except ValueError:
                            if strict or warning:
                                print >>sys.stderr, "%s: warning: could not convert field '%s' to floating point value" % (progname, record[k])
                            if strict:
                                print >>sys.stderr, strict_mode_msg
                                sys.exit(1)
                    elif convtype == 'int':
                        try:
                            record[k] = int(record[k])
                        except ValueError:
                            if strict or warning:
                                print >>sys.stderr, "%s: warning: could not convert field '%s' to integer value" % (progname, record[k])
                            if strict:
                                print >>sys.stderr, strict_mode_msg
                                sys.exit(1)
                    else:
                        raise RuntimeError("invalid action '%s' encountered during processing" % (action))

                # Perform date conversion if requested.
                if k in date:
                    fmt = date[k]
                    try:
                        record[k] = datetime.datetime.strptime(record[k], fmt)
                    except ValueError as e:
                        if strict or warning:
                            print >>sys.stderr, "%s: warning: could not convert field '%s' to a datetime object: %s" % (progname, record[k], e.message)
                        if strict:
                            print >>sys.stderr, strict_mode_msg
                            sys.exit(1)

                # Collect location data if requested.
                #
                # If both values are not supplied in the row, error checking
                # below will catch it.
                if location is not None:
                    if k == location['latfield']:
                        try:
                            record[location['name']][0] = float(record[k])
                        except ValueError:
                            print >>sys.stderr, "%s: error: could not convert latitude field '%s' to a floating point value" % (progname, record[k])
                            sys.exit(1)
                    elif k == location['longfield']:
                        try:
                            record[location['name']][1] = float(record[k])
                        except ValueError:
                            print >>sys.stderr, "%s: error: could not convert longitude field '%s' to a floating point value" % (progname, record[k])
                            sys.exit(1)

                # Perform hashtag extraction if requested.
                if k in hashtag:
                    hashfield = hashtag[k]

                    # Split apart the record field by whitespace, then filter by
                    # first character being a hashmark.
                    record[hashfield] = filter(lambda x: x[0] == '#', record[k].split())

        # Now that the other processing is done, drop the requested fields from
        # the record before continuiing.
        for k in drop:
            del record[k]

        # Rename the field names as requested.
        for k in record:
            if k in rename:
                r = rename[k]
                record[r] = record[k]
                del record[k]

        if verbose:
            print record

        # Make sure that location information is complete, if present.
        if location is not None:
            locdata = record[location['name']]
            if locdata[0] is None or locdata[1] is None:
                print >>sys.stderr, "%s: error: lat/long data in record is incomplete: %s" % (progname, record)
                sys.exit(1)

        # Store the record in the current bundle.
        bundle.append(record)

        # If the bundle is full, upload it to the server.
        if len(bundle) == bundle_size:
            c.insert(bundle)
            bundle = []

        # Print a progress report, if requested.
        count = count + 1
        if progress > 0 and count % progress == 0:
            print >>sys.stderr, "%d records processed" % (count)

    # If at the end of processing there are any stray records left in a bundle,
    # upload them now.
    if len(bundle) > 0:
        c.insert(bundle)

    # Print a final count of the number of records processed.
    if progress > 0:
        print >>sys.stderr, "complete - %d records processed" % (count)

if __name__ == '__main__':
    main()
