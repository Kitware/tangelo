class Handler:
    def go(self, year, month, day, **kwargs):
        response = {}
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
        for k in kwargs:
            response[k] = kwargs[k]

        return str(response)
