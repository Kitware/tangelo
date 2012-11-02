function handleFileSelect(evt){
    var files = evt.target.files;
    
    var output = [];
    for(var i=0; i<files.length; i++){
        var f = files[i];
        var using = null;
        if(f.type == '(n/a)'){
            status = "accepted";
            msg = "ok, assuming text";
            using = true;
        }
        else if(f.type.slice(0,5) == 'text/'){
            status = "accepted";
            msg = "ok";
            using = true;
        }
        else{
            status = "rejected";
            msg = "rejected";
            using = false;
        }
        output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ', f.size, ' bytes ', f.type == 'text/plain' ? '<span class=ok>(ok)</span>' : '<span class="rejected">(rejected)</span>');

        if(using){
            var reader = new FileReader();
            reader.onload = (function(file){
                return function(e){
                    console.log(file.name);

                    // Grab the text of the file.
                    var text = e.target.result;

                    // Create a "preview" bullet point containing a prefix of the file text.
                    var elem = document.createElement("li");
                    elem.innerHTML = escape(file.name) + ": " + text.slice(0,40) + "...";
                    $("#blobs").get(0).appendChild(elem);

                    // Fire an AJAX call to retrieve the named entities in the document.
                    $.ajax({
                        url: '/service/NER',
                        data: {
                            text: text
                        },
                        dataType: 'text',
                        success: function(data){
                            console.log("success for " + file.name + " - result: " + data);
                        },
                        error: function(){
                            console.log("error for " + file.name);
                        }
                    });
                }
            })(f);

            reader.readAsText(f);
        }
    }
    document.getElementById('file-info').innerHTML = '<ul>' + output.join('') + '</ul>';
}

window.onload = function(){
    document.getElementById('docs').addEventListener('change', handleFileSelect, false);
}
