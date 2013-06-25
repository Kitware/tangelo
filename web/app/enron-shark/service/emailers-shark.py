import datetime
import itertools
import pymongo
import tangelo
import sys

from hive_service import ThriftHive
from hive_service.ttypes import HiveServerException
from thrift import Thrift
from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol

def init_shark(host, port, database):
    try:
        transport = TSocket.TSocket(host, port)
        transport = TTransport.TBufferedTransport(transport)
        protocol = TBinaryProtocol.TBinaryProtocol(transport)

        client = ThriftHive.Client(protocol)
        transport.open()
        client.execute('use %s' % (database))
        
        return client
        
    except Thrift.TException, tx:
        raise Exception('Exception : %s' % (tx.message))


def run(database, table, start_time, end_time, center, degree, host="localhost", port=10000, fields="true"):
        response = tangelo.empty_response()

        try:
          degree = int(degree)
        except ValueError:
          response["error"] = "argument 'degree' must be an integer"
          return response
  
        client = init_shark(host, port, database)

        talkers = set([center])

        distance = {center: 0}

        current_talkers = list(talkers)
        all_results = []

        for i in range(degree):
          query = build_query(database, table, start_time, end_time, current_talkers)
          
          client.execute(query)
          results = client.fetchAll()
          
          current_talkers = list(itertools.chain(*map(lambda x: [x.split("\t")[0], x.split("\t")[1]], results)))
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
            resultArray = result.split("\t")
            source = resultArray[1]
            target = resultArray[0]
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

  query = 'select distinct emailto, emailfrom from %s where emaildate < "%s" and emaildate >= "%s" and emailfrom <> "" and emailto <> "" and (emailfrom in (%s) or emailto in (%s))' % (table, end_time, start_time, talkers_string, talkers_string)
  return query
