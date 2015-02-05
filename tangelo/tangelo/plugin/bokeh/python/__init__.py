def bokeh(plotobject):
    from bokeh.resources import CDN
    from bokeh.embed import components

    script, div = components(plotobject, CDN)
    return {"script": script,
            "div": div}
