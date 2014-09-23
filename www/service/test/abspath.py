import tangelo


def run():
    return [["pass", tangelo.abspath("/blah/yay.html")],
            ["fail", tangelo.abspath("blah/yay.html")],
            ["fail", tangelo.abspath("/../blah/yay.html")],
            ["pass", tangelo.abspath("/~roni/blah")],
            ["fail", tangelo.abspath("/~roni/..")],
            ["fail", tangelo.abspath("~roni/blah")]]
