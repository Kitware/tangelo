import json

# This is a utility function used to create a response object within any service
# module.
def empty_response():
    return {'error' : None,
            'result' : None}

# This class implements the service module interface; it is used to prevent the
# user from trying to invoke this service.
class Handler:
    def go(*args, **kwargs):
        result = result_container();

        # TODO(choudhury): rather than place this string here by hand, it should
        # be put into a collection of standardized message variables.
        result['error'] = "Invalid service"

        return json.dumps(result)
