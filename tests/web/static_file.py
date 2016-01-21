import tangelo


def run():
    return tangelo.file("../static_file.txt", content_type="text/plain")
