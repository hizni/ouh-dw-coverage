function renderHeatmap(selectedtablename, datafilename){

            document.getElementById('dataAssetHeatmapTitle').innerHTML = selectedtablename;
            //console.log(selectedtablename);

            //key (legend) setup
            // the legends items and break at which bounding of data occurs can be hardcoded
            // or calculated. The calculations are based around a Histogram bounding formulas
            // provided by D3
            var legendItemsInRow = 8;
            var breaks=[1,2,3,4,5,6,7,8]; //absolute values
            var colours = [];

            //for mouseover popup when hovering over rectangles holding data
            var units=" days with activity";

            //general layout information
            var cellSize = 17;
            var xOffset=20;
            var yOffset=60;
            var calY=40; //offset of calendar in each group
            var calX=35;
            var width = 963;
            var height = 163;

            format = d3.timeFormat("%d-%m-%Y");


            d3.csv("./data/" + datafilename)
            .then(
            function(data) {
                //set up an array of all the dates in the data which we need to work out the range of the data
                var dates = new Array();
                var values = new Array();

                //create colour scale based on number of buckets data is to be split into
                //https://github.com/d3/d3-scale-chromatic#interpolatePiYG
                var colorscale = d3.schemeBlues['8'];//.reverse();
                var color = d3.scaleQuantile()
                    .domain(d3.extent(data))
                    .range(colorscale);

                _.forEach(color.range(), function(d){
                    colours.push(d);
                })


                /*  using Lodash to interate over arrays and collections
                    https://dustinpfister.github.io/2018/02/02/lodash_map/

                    and sort array. Default JS sort is alphabetic
                */
                _.map(data, function(item){
                    //must cast values to int as they are read in as String
                    return Number(data.ActivityCount)
                }).sort(function (a,b) { return a-b; })

                //set legend breaks.
                // this can be set programatically depending on the need
                // breaks = [];
                // breaks.push(1);
                // breaks.push(2);
                // breaks.push(3);
                // breaks.push(4);
                // breaks.push(5);
                // breaks.push(6);
                // breaks.push(7);
                // breaks.push(8);

                // parse the data
                _.forEach(data, function(d){
                    //using momentJS library
                    //momentDT = moment(d.ActivityDT,'YYYY-MM-DD')
                    momentDT = moment(d.ActivityDT,'DD/MM/YYYY')

                    if (!momentDT.isValid()) {
                        console.log('Date in unknown format. ', d.ActivityDT);
                    } else {
                        //populate data arrays used in heatmap viz
                        dates.push(momentDT.toDate());
                        values.push(d.ActivityCount);

                        d.date=momentDT.toDate();
                        d.value=d.ActivityCount;
                        d.weekOfYear=momentDT.isoWeek();   //week of year.
                        d.dayOfYear = momentDT.dayOfYear();
                        d.formatDate = momentDT.format("DD/MM/YYYY")

                        //console.log(d.formatDate +"; week of year=" + d.weekOfYear + "; day of year=" + d.dayOfYear)
                        // there is a difference between week() and isoWeek()
                        //https://stackoverflow.com/questions/32120122/difference-between-week-of-year-and-week-of-year-iso-tokens-moment-js
                        d.quarter=momentDT.quarter();   //quarter
                        d.year=momentDT.year();         //year
                    }
                })

                var yearlyData = d3.nest()
                    .key(function(d){return d.year;}).sortKeys(d3.ascending)
                    .entries(data);

                var weeklyData = d3.nest()
                    .key(function(d){return d.year}).sortKeys(d3.ascending)
                    .key(function(d){return d.weekOfYear})
                    //.rollup(function(v) { return function(d){d.date; }})
                    .rollup(function(v) { return v.length; }) //number of entries made
                    //.rollup(function(v) { return d3.avg(v, function(d){return d.value;});}); //average activity in week
                    .entries(data);

                //select the SVG view node
                var svg = d3.select("#heatmap");
                svg.selectAll("g").remove();

                svg.attr("width","100%")
                    //.attr("height","100%")
                    //.attr("viewBox","0 0 "+(xOffset+width)+" 540")
                    .attr("viewBox","0 0 " +(xOffset+width)+ " 2000")
                    .attr("style","border:1px solid red")

                // create an SVG group for each year
                var cals = svg.selectAll("g")
                    .data(weeklyData)
                    .enter()
                    .append("g")
                    .attr("id",function(d){
                        return d.key;
                    })
                    .attr("transform",function(d,i){
                        return "translate(0,"+(yOffset+50+(i*(cellSize+cellSize))) +")";
                    })


                // create a rectangle for each week in a year
                var rects = cals.append("g")
                    .attr("id","allweeks")
                    .selectAll(".week")
                    .data(function(d) {
                        //first of the year
                        yearStart = new Date(parseInt(d.key), 0, 1);
                        yearEnd = new Date(parseInt(d.key), 11, 31);
                        //d3 functions time[day | week |month].range returns a range of data objects that fall
                        //in the dates passed as the start and end parameters.
                        return d3.timeWeek.range(yearStart, yearEnd);
                    })
                    .enter().append("rect")
                    .attr("id",function(d,i) {
                        return "_"+ d.getFullYear() + '_' + (i + 1);
                        //return toolDate(d.date)+":\n"+d.value+" dead or missing";
                    })
                    .attr("class", "week")
                    .attr("width", cellSize)
                    .attr("height", cellSize)
                    .attr("x", function(d,i) {
                        return xOffset+calX+(i * cellSize);
                    })
                    .attr("y", function(d) { return calY; })
                    .datum(format);

                    //create year labels
                    //set the title for the year (on the y-axis)
                    //when selecting an element with an id that does not begin with
                    //a letter use the forllowing sorm [id="999"]
                    weeklyData.forEach(function(d, i){
                        var currCal = d3.select('[id="' + d.key + '"]')
                        currCal.append("g")
                            //.append("text")
                            .attr("id","yearLabels")
                            //.attr("class","dayLabel")
                            // .attr("x",xOffset)
                            // .attr("y",function(d) { return calY; })
                            // .attr("dy","0.9em")
                            .append("text")
                            .attr("class","dayLabel")
                            .attr("x",xOffset)
                            .attr("y",function(d) { return calY; })
                            .attr("dy","0.9em")
                            .text(d.key);
                    });

                    // overlay rectangles with data ontop of grid
                    var dataRects = cals.append("g")
                         .attr("id","dataWeeks")
                         .selectAll(".dataweek")
                         .data(function(d){

                            var myAssociativeArr = [];
                            for (var i=0; i < d.values.length; i++) {
                                var newElement = {};
                                newElement['year'] = d.key;
                                newElement['week'] = d.values[i].key;
                                newElement['value'] = d.values[i].value;

                                myAssociativeArr.push(newElement);
                            }

                            return myAssociativeArr;
                        })
                        .enter()
                        .append("rect")
                        .attr("id",function(d) {
                            return d.year+":"+d.week;
                        })
                        .attr("stroke","#ccc")
                        .attr("width",cellSize)
                        .attr("height",cellSize)
                        // d.week is 1 indexed. week array is 0 indexed.
                        .attr("x", function(d,i) {
                            return xOffset+calX+(parseInt(d.week - 1) * cellSize);
                        })
                        .attr("y", function(d) { return calY; })
                        //filling colour
                        .attr("fill", function(d,i) {
                            //testing absolutes
                            for (i=0;i<breaks.length;i++){
                                if (i == breaks.length - 1){

                                    //handle odd case if more that 7 days in week
                                    //currently down to oddness in handling week rolled up aggregation
                                    if (d.value > breaks[i -1])
                                        return colours[i - 1]
                                }
                                 if (d.value==breaks[i]){
                                     return colours[i];
                                 }
                            }
                        })


                    //append a title element to give basic mouseover info
                    dataRects.append("title")
                         .text(function(d) { return d.year+";week:"+d.week+":\n"+d.value+units; });

                    //create week label
                    var weekLabel = svg.append("g")
                        .attr("id", "weeksLabel")
                        var weeks = ['1','10','20','30','40','50'];
                        weeks.forEach(function(d,i)    {
                            weekLabel.append("text")
                                .attr("id", "weekTitle_" + d)
                                .attr("x",25 + (parseInt(d) * cellSize))
                                .attr("y",70)
                                .attr("class","monthLabel")
                                .attr("transform",function(d,i){
                                    return "translate(" + (xOffset) + ","+(yOffset) +")";
                                })
                                .text(d)
                    });

                    //create key
                    var key = svg.append("g")
                        .attr("id","key")
                        .attr("class","key")
                        .attr("transform",function(d){
                            return "translate("+xOffset+","+(yOffset-(cellSize*1.2))+")";
                        });

                    key.selectAll("rect")
                        .data(colours)
                        .enter()
                        .append("rect")
                        .attr("width",cellSize)
                        .attr("height",cellSize)
                        .attr("x",function(d,i){
                            //return i*130;
                            var x_offset = i%legendItemsInRow;
                            return x_offset*130;
                        })
                        .attr("y",function(d,i){
                            return (cellSize)*(Math.floor(i/legendItemsInRow));
                        })
                        .attr("fill",function(d){
                            return d;
                        });

                    key.selectAll("text")
                        .data(colours)
                        .enter()
                        .append("text")

                        .attr("x",function(d,i){
                            //return i*130;
                            var x_offset = i%legendItemsInRow;
                            return cellSize+5+(x_offset*130);
                        })
                        .attr("y",function(d,i){
                            return (cellSize * 0.9)+(cellSize*(Math.floor(i/legendItemsInRow)));
                        })
                        .text(function(d,i){
                            if (i<colours.length-1){
                                return breaks[i];
                            }   else    {
                                return breaks[i-1] + "+";
                            }
                        });
            }



            )}