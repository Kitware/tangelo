import json
import sys

for i in range(1,956):
    sys.stderr.write("%d\n" % i)
    filename = "loans/%d.json" % i
    f = file(filename)
    j = json.load(f)
    for loan in j["loans"]:
        loc = loan["location"]["geo"]["pairs"]
        coords = loc.split()
        amount = loan["loan_amount"]
        sector = loan["sector"]
        print "%s,%s,%s,%s" % (coords[0], coords[1], amount, sector)
