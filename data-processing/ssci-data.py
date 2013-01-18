import collections
import copy
import glob
import json
import sys

# This script loads CrossCat json data and converts it into a single json object for
# inclusion into the ssci xdata webapp. All files are assumed to be in the
# current working directory.
#
# Usage:
#     python [script-location] > [output-json-file]
#
# animals_data.json: An array of arrays of integers - the raw data.
#
# Cc_*_[n].json: The column ordering of the data. This must be an object with an integer
# array named labelToIndex.
#
# Cr_*_[n].json: The row ordering of the data. This must be an object with an
# integer array named labelToIndex.
#
# XL_*_[n].json: The partitioning of the columns. This must be an object with
# an integer array named columnPartitionAssignments. Partitions are 1-indexed.
#
# XD_*_[n].json: The partitioning of the rows. This must be an object with an
# integer array of arrays named rowPartitionAssignments. For a given column
# partition i (or "view" i), the row partition is defined by the (i-1)-th
# array in rowPartitionAssignments. Row partitions are also 1-indexed.

matrix_file = file("animals_data.json")
matrix = json.load(matrix_file)
matrix_file.close()

all_data = []
column_partition = []
row_partition = []
for i in range(12):
    cc_file = file(glob.glob("Cc_*_%02d.json" % i)[0])
    cc_json = json.load(cc_file, object_pairs_hook=collections.OrderedDict)
    col_order = cc_json["labelToIndex"]
    col_names = [""]*len(col_order)
    for col in col_order.keys():
        col_names[col_order[col]-1] = col
    cc_file.close()

    cr_file = file(glob.glob("Cr_*_%02d.json" % i)[0])
    cr_json = json.load(cr_file, object_pairs_hook=collections.OrderedDict)
    row_order = cr_json["labelToIndex"]
    row_names = [""]*len(row_order)
    for row in row_order.keys():
        row_names[row_order[row]-1] = row
    cr_file.close()

    xl_file = file(glob.glob("XL_*_%02d.json" % i)[0])
    xl_json = json.load(xl_file)
    column_partition.append(xl_json["columnPartitionAssignments"])
    xl_file.close()

    xd_file = file(glob.glob("XD_*_%02d.json" % i)[0])
    xd_json = json.load(xd_file)
    row_partition.append(xd_json["rowPartitionAssignments"])
    xd_file.close()

    data = []
    for row in xrange(len(matrix)):
        for col in xrange(len(matrix[row])):
            data.append({
                    "row": row_names[row],
                    "col": col_names[col],
                    "i": row,
                    "j": col,
                    "value": matrix[row][col]})
    all_data.append(data)

output = {}
output["table"] = all_data[0]

rows = []
for i in range(len(row_names)):
    rows.append({"name": row_names[i], "i": i})
output["rows"] = rows

cols = []
for i in range(len(col_names)):
    cols.append({"name": col_names[i], "i": i})
output["columns"] = cols
output["columnPartition"] = column_partition
output["rowPartition"] = row_partition

json.dump(output, sys.stdout, indent=2)
