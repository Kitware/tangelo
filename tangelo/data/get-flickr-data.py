#!python

# To reproduce the 'flickr_paris_1000.json' file, run this script as follows:
#
#     get-flickr-data.py <your-api-key> 1000 >flickr_paris_1000.json
#
# This will retrieve 1000 photos bounded to the Paris area, taken between the
# dates indicated in the "data" dict below, and save them as a JSON array.
#
# To upload these entries to a Mongo database, use the following command (after
# setting up and launching a Mongo instance):
#
#     mongoimport -d tangelo -c flickr_paris --jsonArray --file flickr_paris_1000.json
#
# This will store the 1000 photo entries in a collection called "flickr_paris",
# in a database named "tangelo".  This is the default location the flickr
# example application will look for data.

import datetime
import json
import sys
import urllib

# Construct a JSON representation of a Javascript date (which uses
# *milli*seconds since the epoch, rather than seconds).
def get_javascript_date(datestring):
    date = datetime.datetime.strptime(datestring, "%Y-%m-%d %H:%M:%S")
    return {"$date": int(date.strftime("%s")) * 1000}


# Find tokens in the given text beginning with a hashmark.
def extract_hashtags(text):
    return [token[1:] for token in text.split() if len(token) > 1 and token[0] == "#"]


# Send a flickr API request, then strip off the JSONP container from the result,
# and parse the remainder as a JSON object.
def get_photos(url, data):
    req = urllib.urlopen(url, urllib.urlencode(data))
    result = req.read()
    return json.loads(result[len("jsonFlickrApi("):-1])["photos"]


# This program uses a flickr API key to find photos taken in Paris between July
# 30, 2012, and October 6, 2012.
def main():
    if len(sys.argv) < 2:
        print >>sys.stderr, "usage: getflickr.py <api_key> [<max_photos>]"
        sys.exit(1)

    api_key = sys.argv[1]
    url = "http://api.flickr.com/services/rest"
    data = {"method": "flickr.photos.search",
            "api_key": api_key,
            "format": "json",
            "min_taken_date": "1343611866",
            "max_taken_date": "1349545963",
            "bbox": "2.26,48.8,2.4,48.9",
            "per_page": "250",
            "extras": "geo,url_z,date_taken"}

    # Get the initial page of results, which will specify how many total extra
    # pages there are.
    sys.stderr.write("reading initial page...")
    sys.stderr.flush()
    result = get_photos(url, data)
    print >>sys.stderr, "done"

    pages = result["pages"]
    photos = result["photo"]

    if len(sys.argv) > 2:
        try:
            max_photos = int(sys.argv[2])
        except ValueError:
            print >>sys.stderr, "error: <max_photos> argument must be an int, was %s" % (sys.argv[2])
            sys.exit(1)

        if max_photos < 250:
            data["per_page"] = str(max_photos)

        sys.stderr.write("Retrieving a maximum of %d photo%s " % (max_photos, "" if max_photos == 1 else "s"))
    else:
        max_photos = int(result["total"])
        sys.stderr.write("Retrieving all photos (%d) " % (max_photos))
    print >>sys.stderr, "from %d page%s of results" % (pages, "" if pages == 1 else "s")

    if len(photos) > max_photos:
        photos = photos[:max_photos]
    else:
        # Retrieve the remaining pagefuls of results.
        class Done: pass
        try:
            for page in xrange(2, pages+1):
                data["page"] = page

                sys.stderr.write("reading page %d..." % (page))
                sys.stderr.flush()
                result = get_photos(url, data)
                print >>sys.stderr, "done"

                if len(photos) + len(result["photo"]) >= max_photos:
                    photos += result["photo"][:(max_photos - len(photos))]
                    raise Done()
                else:
                    photos += result["photo"]
        except Done:
            pass

    # These properties are to be struck from the JSON records after prep is
    # complete.
    strike = ["context",
              "server",
              "longitude",
              "latitude",
              "ispublic",
              "geo_is_family",
              "geo_is_contact",
              "geo_is_friend",
              "woeid",
              "id",
              "place_id",
              "geo_is_public",
              "isfriend",
              "secret",
              "accuracy",
              "isfamily",
              "farm",
              "url_z",
              "height_z",
              "width_z",
              "datetakengranularity"]
                
    # Perform a bit of processing: gather the long/lat values into a single
    # field (for use by Mongo indices, etc.); copy the "z" url into a simpler
    # named field; process the date and hashtags out of the appropriate strings.
    for p in photos:
        p["location"] = [p["longitude"], p["latitude"]]
        p["url"] = p["url_z"] if "url_z" in p else None
        p["datetaken"] = get_javascript_date(p["datetaken"])
        p["hashtags"] = extract_hashtags(p["title"])

        for s in strike:
            if s in p:
                del p[s]

    # Dump the JSON to stdout.
    print json.dumps(photos)


if __name__ == "__main__":
    main()
