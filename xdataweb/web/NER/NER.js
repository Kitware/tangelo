function handleFileSelect(evt){
    var files = evt.target.files;
    
    var output = [];
    for(var i=0; i<files.length; i++){
        f = files[i];
        output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                f.size, ' bytes, last modified: ',
                f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a');
    }
    document.getElementById('file-info').innerHTML = '<ul>' + output.join('') + '</ul>';
}

window.onload = function(){
    document.getElementById('docs').addEventListener('change', handleFileSelect, false);
}
