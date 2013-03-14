import sys
import pymongo

geonames = pymongo.Connection("mongo")["xdata"]["geonames"]
donors = pymongo.Connection("mongo")["xdata"]["charitynet.normalized.donors"]

pr = 0
city_country_state = 0
alternate_city_country_state = 0
not_found = 0
count = 0
for donor in donors.find():
    if (count > 0 and count % 1000 == 0):
        sys.stderr.write("%d\n" % count)
    count = count + 1
    country = "US"
    state = donor["state"]
    city = donor["city"]
    lat = 0
    lng = 0
    found = False
    if not found and state == "PR":
        for d in geonames.find({"name": city, "country_code": state,
                "feature_class": "P"}, sort=[("population", -1)],
                fields=["latitude", "longitude"]):
            lat = d["latitude"]
            lng = d["longitude"]
            pr = pr + 1
            found = True
            break
    if not found:
        query = {"name": city, "country_code": country,
                "feature_class": "P",
                "admin1_code": state}
        for d in geonames.find(query, sort=[("population", -1)],
                fields=["latitude", "longitude"]):
            lat = d["latitude"]
            lng = d["longitude"]
            city_country_state = city_country_state + 1
            found = True
            break
    if not found:
        for d in geonames.find({"alternate": city, "country_code": country,
                "feature_class": "P",
                "admin1_code": state}, sort=[("population", -1)],
                fields=["latitude", "longitude"]):
            lat = d["latitude"]
            lng = d["longitude"]
            alternate_city_country_state = alternate_city_country_state + 1
            found = True
            break
    if not found:
        not_found = not_found + 1
        sys.stderr.write("not found: \"%s\" \"%s\"\n" % (city, state))
    else:
        donor["loc"] = [lng, lat]
        donors.save(donor)

sys.stderr.write("== %d pr\n" % pr)
sys.stderr.write("== %d city_country_state\n" % city_country_state)
sys.stderr.write("== %d alternate_city_country_state\n" % alternate_city_country_state)
sys.stderr.write("== %d not_found\n" % not_found)
