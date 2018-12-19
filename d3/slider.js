
var formatDate = d3.timeFormat("%b %d");

// parameters
var margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
  },
  width = 960 - margin.left - margin.right,
  height = 300 - margin.bottom - margin.top;


// scale function
var timeScale = d3.scaleTime()
  .domain([new Date('2012-01-02'), new Date('2013-01-01')])
  .range([0, width])
  .clamp(true);


// initial value
var startValue = timeScale(new Date('2012-03-20'));
startingValue = new Date('2012-03-20');

//////////

// defines brush
var brush = d3.brushX(timeScale)
  .extent([[0,0],[startingValue, startingValue]])
  .on("brush", brushed);

var svg = d3.select("#slider").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  // classic transform to position g
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.append("g")
  .attr("class", "x axis")
// put in middle of screen
  .attr("transform", "translate(0," + height / 2 + ")")
  // inroduce axis
  .call(d3.axisBottom(timeScale)
    .tickFormat(function(d) {
      return formatDate(d);
    })
    .tickSize(0)
    .tickPadding(12)
    .tickValues([timeScale.domain()[0], timeScale.domain()[1]]))
    .attr("class", "halo");

var slider = svg.append("g")
  .attr("class", "slider")
  .call(brush)

slider.selectAll(".extent,.resize")
  .remove();

slider.select(".background")
  .attr("height", height);

var handle = slider.append("g")
  .attr("class", "handle")

handle.append("path")
  .attr("transform", "translate(0," + height / 2 + ")")
  .attr("d", "M 0 -20 V 20")

handle.append('text')
  .text(startingValue)
  .attr("transform", "translate(" + (-18) + " ," + (height / 2 - 25) + ")");


function brushed() {
  console.log("lol");
}
