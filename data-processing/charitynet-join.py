import sys
import pymongo

donors = pymongo.Connection("mongo")["xdata"]["charitynet.normalized.donors"]
donors.ensure_index("accountNumber")
transactions = pymongo.Connection("mongo")["xdata"]["charitynet.normalized.transactions"]
transactions.ensure_index("date")
transactions.ensure_index("charity_id")

count = 0
for transaction in transactions.find():
    if count > 0 and count % 1000 == 0:
        sys.stderr.write("%d\n" % count)
    count = count + 1
    if "loc" not in transaction:
        donor = donors.find_one({"accountNumber": transaction["person_id"]})
        if donor:
            if "state" in donor:
                transaction["state"] = donor["state"]
            if "county" in donor:
                transaction["county"] = donor["county"]
            if "block" in donor:
                transaction["block"] = donor["block"]
            if "loc" in donor:
                transaction["loc"] = donor["loc"]
            transactions.save(transaction)

sys.stderr.write("== %d count\n" % count)
