import tangelo


def run(**kwargs):
    return tangelo.file("../static_file.txt",
                        content_type=kwargs.get("mime_type", "text/plain"))
