
var createMap = () => {

  //Width and height of map
  var width = 960,
      height = 480;

  // D3 Projection
  var projection = d3.geoAlbersUsa()
           .translate([width/2, height/2])    // translate to center of screen
           .scale([1000]);          // scale things down so see entire US

  // Define path generator
  var path = d3.geoPath()               // path generator that will convert GeoJSON to SVG paths
           .projection(projection);  // tell path generator to use albersUsa projection

  //Create SVG element and append map to the SVG
  var svg = d3.select('#map')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
          
  // Append Div for tooltip to SVG
  var div = d3.select('body')
          .append('div')   
          .attr('class', 'tooltip')               
          .style('opacity', 0);

  drawMap(svg, path);
};


var drawMap = (svg, path) => {

  //var colors = ["#ffffb2", "#fed976", "#feb24c", "#fd8d3c", "#f03b20", "#bd0026"];
  var colors = ["#ffffcc", "#a1dab4", "#41b6c4", "#2c7fb8", "#253494"];

  var colorScale = d3.scaleQuantile()
      .domain([50, 100, 200, 300])
      .range(colors);

  // Load GeoJSON data and merge with states data
  d3.json('states.json', function(json) {

    // Bind the data to the SVG and create one path per GeoJSON feature
    svg.selectAll('path')
      .data(json.features)
      .enter()
      .append('path')
      .attr('d', path)
      .on('click', function(d) { mapOnClick(d.properties.name); })
      .style('stroke', '#fff')
      .style('stroke-width', '1')
      .style('fill', 'white')
      .transition()
        .delay(function(d, i) { return i * 10; })
        .duration(750)
          .style('fill', function(d,i) {

            var selectState = data[d.properties.name]

            if (!selectState)
              return 'grey';

            var latestDate = selectState.length - 1;
            return colorScale(selectState[latestDate].value);
          });

    var legendHold = d3.select('#legend')
        .append('svg')
        .attr('width', 960)
        .attr('height', 25);

    var legend = legendHold.selectAll(".legend")
        .data([0].concat(colorScale.quantiles()), function(d) { return d; });

    legend = legend.enter().append("g")
        .attr("class", "legend");

    legend.append("rect")
      .attr("x", function(d, i) { return 80 * i + 20; })
      .attr("y", 0)
      .attr("width", 80)
      .attr("height", 20 / 2)
      .style("fill", function(d, i) { return colors[i]; });

    legend.append("text")
      .attr("class", "mono")
      .text(function(d,i) {
        if (i == 0)
          return "Low"
        if (i == 4) 
          return "High"
      })
      .attr("x", function(d, i) { return 80 * i + 20; })
      .attr("y", 22);

    legend.exit().remove();
  });

}

// On map single click: update chart with state info
var mapOnClick = (selectState) => {

  if (!data[selectState])
    return;

  stateStack.push(selectState);

  console.log(stateStack);

  var width = 500,
      height = 350,
      margin = {top: 20, right: 0, bottom: 30, left: 50};

  var chart = d3.select('#chart')
    .select('svg')

  var x = d3.scaleTime().range([0, width - margin.left - margin.right]),
      y = d3.scaleLinear().range([0, height - margin.bottom - margin.top]);

  var drawLine = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.value); });

  x.domain([new Date(1996, 04), new Date(2016,12)]);
  y.domain([calculateMax(selectState),0]);

  chart.select(".axisY") // change the y axis
    .transition()
      .duration(750)
      .call(d3.axisLeft(y))

  var lineID = selectState.replace(/\s/g, '');

  // ENTER new elements present in new data.
  chart.append('path')
      .datum(data[selectState])
      .attr('class', 'line')
      .attr('id', lineID)
      .attr('d', function(d) { return drawLine(d); })
      .attr('transform', 'translate(' + 30 + ',0)')
      .style('opacity', 1e-6)
      //.on('click', removeLine)
      .transition()
        .duration(400)
        .style("opacity", 1);

  chart.selectAll('path.line')
    .attr('d', function(d) { return drawLine(d); });

  updatePie(selectState);

  console.log(selectState);
}

var updatePie = (selectState) => {

  var pie = d3.pie()
      .sort(null)
      .value(function(d) { return d.value; })

  var svg = d3.select('#pie')
    .select('svg')

  var selectData = dataPie[selectState];

  if (!selectData) {
    var dummyData = [
      {
        type: 'gain',
        value: 0
      },
      {
        type: 'loss',
        value: 0
      },
      {
        type: 'blank',
        value: 1
      }
    ]

    selectData = dummyData;
  }
  else
    selectData = selectData['2016-12'];


  var path = svg.selectAll('path')
    .data(pie(selectData))

  var text = svg.select('text')
    .text(selectState);

  path.transition().duration(500).attrTween("d", arcTween); // redraw the arcs
}

var arcTween = (a) => {

  var width = 320,
    height = 320,
    radius = Math.min(width, height) / 2;

  var arc = d3.arc()
    .innerRadius(radius - 70)
    .outerRadius(radius - 10)
    .cornerRadius(5);

  var i = d3.interpolate(this._current, a);
  this._current = i(0);
  return function(t) {
    return arc(i(t));
  };
}

var removeLine = (d, i) => {

  var width = 500,
      height = 350,
      margin = {top: 20, right: 0, bottom: 30, left: 50};

  var x = d3.scaleTime().range([0, width - margin.left - margin.right]),
      y = d3.scaleLinear().range([0, height - margin.bottom - margin.top]);

  var chart = d3.select('#chart')
    .select('svg');

  x.domain([new Date(1996, 04), new Date(2016,12)]);
  y.domain([0,0]);

  if(stateStack.length == 0) 
    chartMax = 0;

  else {

    var id = stateStack.pop();

    if(stateStack.length == 0) 
      chartMax = 0;

    id = id.replace(/\s/g, '');

    d3.selectAll('path#' + id).style('opacity', 0);
  }
  if (chartMax == 0) {
    chart.select(".axisY") // change the y axis
      .transition()
        .duration(750)
        .call(d3.axisLeft(y))
  }
}

var createChart = () => {
  
  var width = 500,
      height = 350;

  var svg = d3.select('#chart').append('svg')
    .attr('width', width)
    .attr('height', height)
    .on('click', removeLine);
    
  var margin = {top: 20, right: 0, bottom: 30, left: 50},
      g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var x = d3.scaleTime().range([0, width - margin.right - margin.left]),
      y = d3.scaleLinear().range([0, height - margin.bottom - margin.top]);

  var line = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.value); });

  x.domain([new Date(1996, 04), new Date(2016,12)]);
  y.domain([0,0]);

  svg.append('g')
      .attr('class', 'axisX')
      .attr('transform', 'translate(' + 30 + ',' + (height - margin.bottom - margin.top) + ')')
      .call(d3.axisBottom(x));

  svg.append('g')
      .attr('class', 'axisY')
      .attr('transform', 'translate(' + 30 + ',0)')
      .call(d3.axisLeft(y))
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '0.71em')
      .attr('fill', '#000')
      .text('($)');

}

var calculateMax = (state) => {
  //Can probably be done in getData
  var stateArray = data[state];
  var stateMax = 0;

  for(var i in stateArray) {
    if (isNaN(stateArray[i].value))
      continue;

    if (stateArray[i].value > stateMax) 
      stateMax = stateArray[i].value;
  }

  if (chartMax < stateMax)
    chartMax = stateMax;

  return chartMax;
}

var getData = (callback) => {

  var parseTime = d3.timeParse('%Y-%m');
  var data = {}; // Will hold KVP with key: states and value: array of datapoints (date,value)

  d3.csv('State_MedianValuePerSqft_AllHomes.csv', function(err, dat) {
    if (err) throw err;

    dat.forEach(function(d) {

      var points = [];

      for (const key of Object.keys(d)) {

        if (key == 'RegionID' | key == 'RegionName' | key == 'SizeRank')
          continue;

        if (isNaN(parseInt(d[key])))
          continue;
          
        dateValue = {
          date: parseTime(key),
          value: parseInt(d[key])
        };

        points.sort(function(a,b) {
          return a.date - b.date;
        }); 

        points.push(dateValue);
      }

      data[d.RegionName] = points;
    });

    callback(data);
  });

}

var getDataPie = (callback) => {

  var parseTime = d3.timeParse('%Y-%m');

  var data = {};

  d3.csv('State_PctOfHomesSellingForGain_AllHomes.csv', function(err, dat) {
    if (err) throw err;

    dat.forEach(function(d) {

      var dateGainLoss = {};

      for (const key of Object.keys(d)) {

        dataPoints = [];

        if(key == 'SizeRank')
          continue;

        dateGain = {
          type: 'gain',
          date: parseTime(key),
          value: parseFloat(d[key])
        };

        dateLoss = {
          type: 'loss',
          date: parseTime(key),
          value: 100 - parseFloat(d[key])
        };

        dateEven = {
          type: 'blank',
          date: parseTime(key),
          value: 0
        };

        dataPoints.push(dateGain);
        dataPoints.push(dateLoss);
        dataPoints.push(dateEven);

        dateGainLoss[key] = dataPoints;

        data[d.RegionName] = dateGainLoss;
      }
    })

    callback(data);
  });

}

var createPie = () => {

  var width = 320,
    height = 320,
    radius = Math.min(width, height) / 2;

  var color = d3.scaleOrdinal()
    .range(['#b9e3b6','#c44f41', 'grey']);

  var arc = d3.arc()
    .innerRadius(radius - 70)
    .outerRadius(radius - 10)
    .cornerRadius(5);

  var labelArc = d3.arc()
      .outerRadius(radius - 10)
      .innerRadius(radius - 70);

  var pie = d3.pie()
      .sort(null)
      .value(function(d) { return d.value; })

  var svg = d3.select("#pie").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var dummyData = [
    {
      type: 'gain',
      value: 0
    },
    {
      type: 'loss',
      value: 0
    },
    {
      type: 'blank',
      value: 1
    }
  ]

  var path = svg.selectAll('path')
    .data(pie(dummyData))
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', function(d, i) {
      return color(d.data.type)
    });

  svg.append('text')
    .attr('text-anchor', 'middle')
    .text('');
}



var data;
var dataPie;
var chartMax = 0;
var stateStack = [];
getData(function(d) {
  data = d;
  getDataPie(function(d2) {
    dataPie = d2;
    createMap();
    createChart();
    createPie();
  })
});
