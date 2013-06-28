import tangelo

# This example demonstrates how to create a RESTful service for Tangelo.  You
# can try this out by starting Tangelo then using the curl program as follows:
#
# $ curl -X PUT -d foo=bar localhost:8080/service/restful/foo/baz/quark
#
# This will demonstrate the service's response to a PUT request, but you can
# change that verb out for any of the others.  Because the "delete" method has
# not been exposed via the tangelo.restful decorator, attempting the DELETE
# action will result in HTTP error 405.
#
# Also note that you can create non-standard verbs, simply by writing the
# function and exposing it via the decorator.

@tangelo.restful
def get(*pargs, **kwargs):
    return "GET: " + " ".join(pargs) + "%s" % (kwargs)

@tangelo.restful
def post(*pargs, **kwargs):
    return "POST: " + " ".join(pargs) + "%s" % (kwargs)

@tangelo.restful
def put(*pargs, **kwargs):
    return "PUT: " + " ".join(pargs) + "%s" % (kwargs)

# This function has not been decorated as the above three, so it will not be
# part of this service's RESTful API.
def delete(*pargs, **kwargs):
    return "DELETE: " + " ".join(pargs) + " %s" % (kwargs)

# And here is an example of an unusual HTTP method.
@tangelo.restful
def propfind(*pargs, **kwargs):
    return "PROPFIND: " + " ".join(pargs) + " %s" % (kwargs)

# And one that isn't even a valid HTTP method.
@tangelo.restful
def dukat(*pargs, **kwargs):
    return "DUKAT: " + " ".join(pargs) + " %s" % (kwargs)
