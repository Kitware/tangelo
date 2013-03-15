import sys
import pymongo
import urllib2
import json


baseurl = "http://data.fcc.gov/api/block/2010/find?format=json&latitude=%f&longitude=%f"
blocks = pymongo.Connection("mongo")["xdata"]["blocks"]
blocks.ensure_index([("loc", pymongo.GEO2D)])
donors = pymongo.Connection("mongo")["xdata"]["charitynet.normalized.donors"]

count = 0
cached = 0
fcc = 0
not_found = 0
for donor in donors.find():
    if count > 0 and count % 1000 == 0:
        sys.stderr.write("count: %d, cached: %d, fcc: %d, not_found: %d\n" % (count, cached, fcc, not_found))
    if "loc" in donor:
        loc = donor["loc"]
        found = False
        for d in blocks.find({"loc": loc}):
            donor["block"] = d["block"]
            donor["county"] = d["county"]
            found = True
            cached = cached + 1
            break
        if not found:
            req = urllib2.Request(baseurl % (loc[1], loc[0]))
            opener = urllib2.build_opener()
            f = opener.open(req)
            info = json.load(f)

            if info["status"] == "OK" and info["Block"]["FIPS"] != None:
                donor["block"] = int(info["Block"]["FIPS"])
                donor["county"] = int(info["County"]["FIPS"])
                blocks.save({"loc": loc, "block": donor["block"], "county": donor["county"]})
                found = True
                fcc = fcc + 1
            else:
                sys.stderr.write("Error: " + json.dumps(info))
                not_found = not_found + 1
        if found:
            donors.save(donor)
    count = count + 1
