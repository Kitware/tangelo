import json
import util

# This class implements the service module interface; it is used to prevent the
# user from trying to invoke this service.
class Handler:
    def go(*args, **kwargs):
        result = util.empty_response();

        # TODO(choudhury): rather than place this string here by hand, it should
        # be put into a collection of standardized message variables.
        result['error'] = "Invalid service"

        return json.dumps(result)
