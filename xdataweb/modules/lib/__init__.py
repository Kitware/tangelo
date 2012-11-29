import json
import util

# This class implements the service module interface; it is used to prevent the
# user from trying to invoke this service.
class Handler:
    def go(*args, **kwargs):
        response = util.empty_response();

        # TODO(choudhury): rather than place this string here by hand, it should
        # be put into a collection of standardized message variables.
        response['error'] = "Invalid service"

        return json.dumps(response)
