import sys
import pymongo

geonames = pymongo.Connection("mongo")["xdata"]["geonames"]
donors = pymongo.Connection("mongo")["xdata"]["charitynet.normalized.donors"]

count = 0
for donor in donors.find():
    if count > 0 and count % 1000 == 0:
        sys.stderr.write("%d\n" % count)
    if "loc" in donor:
        loc = donor["loc"]
        donor["loc"] = [loc[1], loc[0]]
        donors.save(donor)
    count = count + 1
