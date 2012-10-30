class Handler:
    def go(self, year, month, day, **kwargs):
        response = {}
        try:
            response['year'] = int(year)
        except ValueError:
            pass
        try:
            response['month'] = int(month)
        except ValueError:
            pass
        try:
            response['day'] = int(day)
        except ValueError:
            pass
        for k in kwargs:
            response[k] = kwargs[k]

        return str(response)
