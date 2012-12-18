window.onload = function(){
    // Load the data.
    //
    // First get the extremes of the data.
    var start = null;
    var end = null;
    var count = null;
    $.ajax({
        url: '/service/mongo/mongo/xdata/flickr_paris',
        data: {
            sort: JSON.stringify([['date',1]]),
            fields: JSON.stringify(['date']),
            limit: 1
        },
        dataType: 'json',
        success: function(response){
            if(response.error !== null){
                console.log("error: could not get earliest time record");
                console.log(response.error);
                return;
            }

            // Capture the date by extracting the millisecond value and
            // converting it to a numeric type.
            start = +response.result.data[0].date.$date;
            console.log("start date: " + start);

            // Trigger an AJAX call to get the *latest* date in the dataset.
            $.ajax({
                url: '/service/mongo/mongo/xdata/flickr_paris',
                data: {
                    sort: JSON.stringify([['date', -1]]),
                    fields: JSON.stringify(['date']),
                    limit: 1
                },
                dataType: 'json',
                success: function(response){
                    if(response.error !== null){
                        console.log("error: could not get latest time record");
                        console.log(response.error);
                        return;
                    }

                    // Capture the date.
                    end = +response.result.data[0].date.$date;
                    console.log("end date: " + end);

                    // Now fire an AJAX call to count the total number of
                    // records.
                    $.ajax({
                        url: '/service/mongo/mongo/xdata/flickr_paris',
                        data: {
                            limit: 0,
                            fill: false
                        },
                        dataType: 'json',
                        success: function(response){
                            if(response.error !== null){
                                console.log("error: could not count the number of records in the database");
                                console.log(response.error);
                                return;
                            }

                            // Save the count.
                            count = +response.result.count;
                            console.log("count: " + count);
                            
                            // Initialize the buttons.
                            d3.select("#quartile").node().onclick = function(){
                                alert("quartile");
                            };

                            d3.select("#decile").node().onclick = function(){
                                alert("decile");
                            };

                            d3.select("#percentile").node().onclick = function(){
                                alert("percentile");
                            };
                        }
                    });
                }
            });


        }
    });
};
