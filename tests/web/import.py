# This service imports a local script and runs that
import echo


def run(*args, **kwargs):
    return echo.run(*args, **kwargs)
