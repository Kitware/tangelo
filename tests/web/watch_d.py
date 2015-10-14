import time


ImportTime = time.time()


# This service reports its name and import time, plus whatever some sub service
# uses
def run(*args, **kwargs):
    response = 'Watch D [%s]' % str(ImportTime)
    return response
