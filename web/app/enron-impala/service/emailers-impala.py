import impala
import json
import tangelo
import itertools

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

def run(database, table, start_time, end_time, center, degree, host="localhost", port="21000", fields="true"):
        response = tangelo.empty_response()

        try:
          degree = int(degree)
        except ValueError:
          response["error"] = "argument 'degree' must be an integer"
          return response
  
        client = impala.ImpalaBeeswaxClient(host + ':' + port)
	client.connect()

        talkers = set([center])

        distance = {center: 0}

        current_talkers = list(talkers)
        all_results = []

        for i in range(degree):
          query = build_query(database, table, start_time, end_time, current_talkers)
          qResults = client.execute(query)
          
          results = convert_results(qResults, "true")
          
          current_talkers = list(itertools.chain(*map(lambda x: [x["emailto"], x["emailfrom"]], results)))
          current_talkers = list(set(current_talkers))
	  
          talkers = talkers.union(current_talkers)

          for t in current_talkers:
            if t not in distance:
              distance[t] = i+1

          all_results.append(results)

        
	talkers = list(talkers)
        talker_index = {name: index for (index, name) in enumerate(talkers)}

        all_results = itertools.chain(*all_results)
        
        edges = []
        ident = 0;
        for result in all_results:
            source = result["emailfrom"]
            target = result["emailto"]
            ident += 1
            
            rec = { "source": talker_index[source],
                    "target": talker_index[target],
                    "id": str(ident) }
            
            edges.append(rec)
            
        talkers = [{"email": n, "distance": distance[n]} for n in talkers]

        response["result"] = { "nodes": talkers,
                               "edges": edges }
        
        return response

def build_query(database, table, start_time, end_time, talkers_list):
  
  talkers_string = '"'+'", "'.join(talkers_list)+'"'

  query = 'select emailto, emailfrom from %s.%s where emaildate < "%s" and emaildate >= "%s" and emailfrom <> "" and emailto <> "" and (emailfrom in (%s) or emailto in (%s))' % (database, table, end_time, start_time, talkers_string, talkers_string)
  return query
