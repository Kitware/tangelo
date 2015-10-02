import os


# This service reports its name and file mtime, plus whatever some sub service
# uses
def run(*args, **kwargs):
    response = 'Watch D [%s]' % str(os.path.getmtime(__file__))
    return response
