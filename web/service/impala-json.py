import impala
import json

def convert(value, type):
	if type == "tinyint":
		return int(value)
	elif type == "int":
		return int(value)
	elif type == "double":
		return float(value)
	elif type == "string":
		return value
	elif type == "boolean":
		return True if value == "true" else False
	return None

def convert_results(results, fields=False):
	schema = results.schema.fieldSchemas
	converted = []
	for d in results.data:
		parts = d.split("\t")
		if fields:
			row = {}
			for i in range(len(parts)):
				row[schema[i].name] = convert(parts[i], schema[i].type)
		else:
			row = []
			for i in range(len(parts)):
				row.append(convert(parts[i], schema[i].type))
		converted.append(row)
	return converted

def run(q="select 1 as testing", host="localhost", port="21000", fields="true"):
	client = impala.ImpalaBeeswaxClient(host + ':' + port)
	client.connect()
	results = client.execute(q)
	return convert_results(results, fields=(fields == "true"))
