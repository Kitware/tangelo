from tangelo.server import analyze_url


def run(test):
    if test == "1":
        return analysis_dict("analyze-url.py")
    elif test == "2":
        return analysis_dict("open.py")
    elif test == "3":
        return analysis_dict("open.yaml")
    elif test == "4":
        return analysis_dict("standalone.yaml")
    elif test == "6":
        return analysis_dict("/analyze-url", "/")
    elif test == "7":
        return analysis_dict("/analyze-url", "")
    elif test == "8":
        return analysis_dict("has-index/")
    elif test == "9":
        return analysis_dict("/plugin", "")
    elif test == "10":
        return analysis_dict("analyze-url/1/2/3")
    elif test == "11":
        return analysis_dict("doesnt-exist.html")
    else:
        raise ValueError("invalid test name: %s" % (test))


def analysis_dict(base, url=None):
    if url is None:
        url = base
        base = "/analyze-url/"

    return eval(str(analyze_url("%s%s" % (base, url))))
