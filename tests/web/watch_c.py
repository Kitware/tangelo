import time

import watch_d


ImportTime = time.time()


# This service reports its name and import time, plus whatever some sub service
# uses
def run(*args, **kwargs):
    response = 'Watch C [%s]' % str(ImportTime)
    result = watch_d.run(*args, **kwargs)
    if isinstance(result, basestring):
        response += '\n' + result
    return response
