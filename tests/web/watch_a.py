import os

import watch_b


# This service reports its name and file mtime, plus whatever some sub service
# uses
def run(*args, **kwargs):
    response = 'Watch A [%s]' % str(os.path.getmtime(__file__))
    result = watch_b.run(*args, **kwargs)
    if isinstance(result, basestring):
        response += '\n' + result
    return response
