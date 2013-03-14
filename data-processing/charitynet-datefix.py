import sys
import pymongo
import datetime

transactions = pymongo.Connection("mongo")["xdata"]["charitynet.normalized.transactions"]

count = 0
for transaction in transactions.find():
    if (count > 0 and count % 1000 == 0):
        sys.stderr.write("%d\n" % count)
    count = count + 1
    if not isinstance(transaction["date"], datetime.datetime):
        if transaction["date"] == "null":
            transaction["date"] = None
        else:
            transaction["date"] = datetime.datetime.strptime(transaction["date"], "%Y-%m-%d %H:%M:%S")
        transactions.save(transaction)
