from bokeh.sampledata.iris import flowers
from bokeh.plotting import *

def run():
    colormap = {'setosa': 'red', 'versicolor': 'green', 'virginica': 'blue'}
    flowers['color'] = flowers['species'].map(lambda x: colormap[x])
    return scatter(flowers["petal_length"], flowers["petal_width"],
        color=flowers["color"], fill_alpha=0.2, size=10, name="iris")
