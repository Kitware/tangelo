//var titles = new Array(<<BINS>>);
var titles = new Array(bins);
var format = d3.format('%');
var data = <<DATA>>;
for(var i=0; i<bins; i++){
    titles[i] = format(i/bins) + ' - ' + format((i+1)/bins) + ' (' + format(data[i].value) + ' or ' + data[i].count + ' records)';
}
var containers = dom.select('.mark-1').selectAll('rect');
containers.data(titles).append('title').text(function(d) { return d; });
containers.on('mouseover', function(){ d3.select(this).style('opacity',0.3); });
containers.on('mouseout', function(){ d3.select(this).style('opacity',0.0); });
