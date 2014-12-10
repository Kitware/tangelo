def bokeh(plotobject):
    from bokeh.resources import CDN
    from bokeh.embed import components
    from bokeh.plot_object import PlotObject

    script, div = components(plotobject, CDN)
    return {"script": script,
            "div": div}
