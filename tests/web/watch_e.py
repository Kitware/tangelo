import time

import watch_c


ImportTime = time.time()


# This service reports its name and import time, plus whatever some sub service
# uses
def run(*args, **kwargs):
    response = 'Watch E [%s]' % str(ImportTime)
    result = watch_c.run(*args, **kwargs)
    if isinstance(result, basestring):
        response += '\n' + result
    return response
