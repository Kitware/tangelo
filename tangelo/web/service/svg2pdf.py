from svglib.svglib import svg2rlg
from reportlab.graphics import renderPDF
import StringIO
import tangelo
import tempfile
import random
import cherrypy

converted = {}

@tangelo.restful
def post():
    #drawing = svg2rlg(StringIO.StringIO(tangelo.request_body()))
    body = tangelo.request_body().read()
    f = tempfile.NamedTemporaryFile(delete=False)
    f.write(body)
    f.close()
    #return open(f.name).read()
    drawing = svg2rlg(f.name)
    #drawing.renderScale = 1
    id = '%030x' % random.randrange(16**30)
    converted[id] = renderPDF.drawToString(drawing)
    return {"result": id, "error": None}

@tangelo.restful
def get(id=None):
    tangelo.content_type("application/pdf")
    cherrypy.response.headers["Content-disposition"] = "attachment; filename=figure.pdf"
    return converted[id]
