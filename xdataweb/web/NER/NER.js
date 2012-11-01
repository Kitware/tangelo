function handleFileSelect(evt){
    var files = evt.target.files;
    
    var output = [];
    for(var i=0; i<files.length; i++){
        var f = files[i];
        output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ', f.size, ' bytes ', f.type == 'text/plain' ? '<span class=ok>(ok)</span>' : '<span class="rejected">(rejected)</span>');

        var reader = new FileReader();
        reader.onload = (function(file){
            return function(e){
                console.log(file.name);
                var blobs = document.getElementById("blobs");
                var elem = document.createElement("li");
                elem.innerHTML = escape(file.name) + ": " + e.target.result.slice(0,40) + "...";
                blobs.appendChild(elem);
            }
        })(f);

        reader.readAsText(f);
    }
    document.getElementById('file-info').innerHTML = '<ul>' + output.join('') + '</ul>';
}

window.onload = function(){
    document.getElementById('docs').addEventListener('change', handleFileSelect, false);
}
