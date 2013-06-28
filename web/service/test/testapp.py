# A test Tangelo application.

def run(year, month, day, **kwargs):
    # Create a response dictionary.
    response = {}

    # Fill it with the positional arguments (i.e. URL path components),
    # which are supposed to be a date.
    try:
        response['year'] = int(year)
    except ValueError:
        response['year'] = 'bad year given'

    try:
        response['month'] = int(month)
    except ValueError:
        response['year'] = 'bad month given'

    try:
        response['day'] = int(day)
    except ValueError:
        response['year'] = 'bad day given'

    # Fill it with the remainder of the arguments, which must be sent in as
    # keyword arguments (i.e. as URL-encoded parameters).
    for k in kwargs:
        response[k] = kwargs[k]

    return str(response)
