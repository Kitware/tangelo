# This service imports a non-local script and rusn that
import tangelo

tangelo.paths('..')
import echo


def run(*args, **kwargs):
    return echo.run(*args, **kwargs)
