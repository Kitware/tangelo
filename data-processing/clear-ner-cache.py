#!/usr/bin/python2

import pymongo

c = pymongo.Connection()
db = c['xdata']['ner-cache']
db.drop()
