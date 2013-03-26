import argparse
import json
import pymongo
import sys

sys.path += ["../web/service", ".."]
import census

state = {
    "01": "AL",
    "02": "AK",
    "04": "AZ",
    "05": "AR",
    "06": "CA",
    "08": "CO",
    "09": "CT",
    "10": "DE",
    "11": "DC",
    "12": "FL",
    "13": "GA",
    "15": "HI",
    "16": "ID",
    "17": "IL",
    "18": "IN",
    "19": "IA",
    "20": "KS",
    "21": "KY",
    "22": "LA",
    "23": "ME",
    "24": "MD",
    "25": "MA",
    "26": "MI",
    "27": "MN",
    "28": "MS",
    "29": "MO",
    "30": "MT",
    "31": "NE",
    "32": "NV",
    "33": "NH",
    "34": "NJ",
    "35": "NM",
    "36": "NY",
    "37": "NC",
    "38": "ND",
    "39": "OH",
    "40": "OK",
    "41": "OR",
    "42": "PA",
    "44": "RI",
    "45": "SC",
    "46": "SD",
    "47": "TN",
    "48": "TX",
    "49": "UT",
    "50": "VT",
    "51": "VA",
    "53": "WA",
    "54": "WV",
    "55": "WI",
    "56": "WY",
    "60": "AS",
    "64": "FM",
    "66": "GU",
    "68": "MH",
    "69": "MP",
    "70": "PW",
    "72": "PR",
    "74": "UM",
    "78": "VI"
}

def main():
    # Parse command line args.
    p = argparse.ArgumentParser(description="Download census data and upload to Mongo collection.")

    p.add_argument("--host", required=True, help="the MongoDB server")
    p.add_argument("-d", "--database", required=True, help="the database to use")
    p.add_argument("-c", "--collection", required=True, help="the collection to use")
    p.add_argument("--drop-collection", action='store_true', help="drop the specified collection before beginning")
    p.add_argument("-k", "--key", required=True, help="Census API key (obtain one at http://www.census.gov/developers/tos/key_request.html)")

    # Get a dictionary of the parsed arguments.
    args = vars(p.parse_args())

    # Extract information from arguments.
    host = args["host"]
    database = args["database"]
    collection = args["collection"]
    drop_collection = args["drop_collection"]
    key = args["key"]

    # Instantiate a connection to the MongoDB server.
    try:
        conn = pymongo.Connection(host)
    except pymongo.errors.AutoReconnect as e:
        print >>sys.stderr, "error: %s" % (e.message)
        sys.exit(1)

    # Get a handle to the database.
    db = conn[database]

    # Drop the collection before starting, if requested.
    if drop_collection:
        db.drop_collection(collection)

    # Get a handle to the collection.
    c = db[collection]

    # Instantiate the census downloader service, and invoke it to retrieve
    # per-county populations for 2010.
    h = census.Handler()
    kw = {
        "key": key,
        "get": "P0010001,NAME",
        "for": "county:*",
        "in": "state:*"
    }
    data = json.loads(json.loads(h.go("2010", "sf1", **kw))["result"])

    # Remap the data into a form suitable for the Mongo collection:
    #
    # - The id field is the (unique) combination of state code followed by
    # county code
    #
    # - The population is converted to int
    #
    # - The county name is retained as a string
    #
    # - The state code is converted to a postal code (for convenience; the state
    # code is still available as the two digit prefix of the id field).
    #
    # - The mapping is applied to all records but the first, which simply
    # contains the column names.
    data = map(lambda x: {"_id": x[2] + x[3], "pop2010": int(x[0]), "county": x[1], "state": state[x[2]]}, data[1:])

    # Upload the data to the MongoDB server.
    c.insert(data)

if __name__ == "__main__":
    main()
