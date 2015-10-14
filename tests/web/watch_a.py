import time

import watch_b


ImportTime = time.time()


# This service reports its name and import time, plus whatever some sub service
# uses
def run(*args, **kwargs):
    response = 'Watch A [%s]' % str(ImportTime)
    result = watch_b.run(*args, **kwargs)
    if isinstance(result, basestring):
        response += '\n' + result
    return response
