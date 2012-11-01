import cherrypy
import nltk
import nltk.chunk.named_entity
import json

# This service performs named entity recognition on input text.
class Handler:
    def go(self, text=""):
        # If nothing passed in, return an empty object.
        if text == "":
            return json.dumps({})

        # Otherwise, perform named entity recognition.
        sentences = nltk.sent_tokenize(text)
        chunks = [nltk.ne_chunk(nltk.pos_tag(nltk.word_tokenize(s))) for s in sentences]

        # Now find all tagged chunks that are not whole sentences - gather the leaves of such
        # chunks into strings, and place them in the list of named entities.
        ne = []
        for c in chunks:
            for subtree in filter(lambda x: x.node != 'S', c.subtrees()):
                ne.append( (subtree.node, ' '.join(map(lambda x: x[0], subtree.leaves())) ) )

        return json.dumps(ne)
