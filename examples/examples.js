'use strict';
/*global d3,$*/

function withSnpData (callback) {

	var parseDate = d3.time.format("%d-%b-%y").parse;
	
	d3.tsv("snp.tsv", function(error, data) {
		data.forEach(function(d) {
			d.date = parseDate(d.date);
			d.y = +d.close;
		  });

		data.sort(function (a, b) { return a.date - b.date; });

		callback(data);
	});
}

function withFlowerData (callback) {

	d3.csv('flowers.csv', function (error, data) {
		data.forEach(function (d) {
			d.x = +d['sepal length'];
			d.y = +d['sepal width'];
		});

		data.sort(function (a, b) { return a.x - b.x; });

		callback(data);
	});
}

function point_cloud (n, μ_x, σ_x, μ_y, σ_y) {
	return [];
}

function snd() {
	var x = 0, y = 0, rds, c;

	do {
		x = Math.random()*2-1;
		y = Math.random()*2-1;
		rds = x*x + y*y;
	}
	while (rds === 0 || rds > 1);

	c = Math.sqrt(-2*Math.log(rds)/rds);

	return x*c;
}

// 
// Simple axis transition example
// 
$(function () {

	var container = "#axis-example";

	var margin = {top: 0, right: 30, bottom: 15, left: 0},
		width = $(container).width() - margin.left - margin.right,
		height = width / 1.5;

	// Scales and axes. Note the inverted domain for the y-scale: bigger is up!
	var x = d3.time.scale().range([0, width]),
		y = d3.scale.linear().range([height, 0]),
		xAxis = d3.svg.axis().scale(x).ticks(4).outerTickSize(0).innerTickSize(-height).tickSubdivide(true),
		yAxis = d3.svg.axis().scale(y).ticks(4).outerTickSize(0).orient("right");

	// An area generator, for the light fill.
	var area = d3.svg.area()
			.interpolate("monotone")
			.x(function(d) { return x(d.date); })
			.y0(height)
			.y1(function(d) { return y(d.y); });

	// A line generator, for the dark stroke.
	var line = d3.svg.line()
			.interpolate("monotone")
			.x(function(d) { return x(d.date); })
			.y(function(d) { return y(d.y); });

	withSnpData(function (data) {

		x.domain(d3.extent(data, function(d) { return d.date; }));
		y.domain(d3.extent(data, function(d) { return d.y; }));

		// Add an SVG element with the desired dimensions and margin.
		var svg = d3.select(container).append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
			.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
				.on("click", click);

		// Add the clip path.
		svg.append("clipPath")
				.attr("id", "clip")
			.append("rect")
				.attr("width", width)
				.attr("height", height);

		// Add the area path.
		svg.append("path")
				.attr("class", "area")
				.attr("clip-path", "url(#clip)")
				.attr("d", area(data));

		// Add the x-axis.
		svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis);

		// Add the y-axis.
		svg.append("g")
				.attr("class", "y axis")
				.attr("transform", "translate(" + width + ",0)")
				.call(yAxis);

		// Add the line path.
		svg.append("path")
				.attr("class", "line")
				.attr("clip-path", "url(#clip)")
				.attr("d", line(data));

		// On click, update the x-axis.
		function click() {
			var n = data.length - 1,
				i = Math.floor(Math.random() * n / 2),
				j = i + Math.floor(Math.random() * n / 2) + 1;
			x.domain([data[i].date, data[j].date]);
			var t = svg.transition().duration(750);
			t.select(".x.axis").call(xAxis);
			t.select(".area").attr("d", area(data));
			t.select(".line").attr("d", line(data));
		}
	});
});


// 
// Grid example
// 
$(function () {

	var container = "#example";

	var margin = {top: 0, right: 30, bottom: 50, left: 10},
		axisSep = 10,
		width = $(container).width() - margin.left - margin.right - axisSep,
		height = width / 1.375;


	var x = d3.time.scale().range([0, width]),
		y = d3.scale.linear().range([height, 0]),
		xAxis = d3.svg.axis().scale(x).ticks(4).outerTickSize(0),
		yAxis = d3.svg.axis().scale(y).ticks(4).outerTickSize(0).orient("right");

	var grid = d3.svg.grid()
		.xAxis(xAxis)
		.yAxis(yAxis);

	var line = d3.svg.line()
		.x(function (d) { return x(d.date); })
		.y(function (d) { return y(d.y); });

	withSnpData(function (data) {

		var svg = d3.select(container).append("svg")
				.attr("width", width + margin.left + margin.right + axisSep)
				.attr("height", height + margin.top + margin.bottom + axisSep)
			.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.right + ")")
				.on("click", clicky);

		svg.append("clipPath")
				.attr("id", "theHaircut")
			.append("rect")
				.attr({
					"width": width,
					"height": height
				});

		svg.append("rect")
			.attr({
				"class": "background",
				"width": width,
				"height": height
			});

		x.domain(d3.extent(data, function(d) { return d.date; }));
		y.domain(d3.extent(data, function(d) { return d.y; }));
	
		svg.append("g")
			.attr("class", "grid")
			.call(grid);
		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + (height + axisSep) + ")")
			.call(xAxis);
		svg.append("g")
			.attr("class", "y axis")
			.attr("transform", "translate(" + (width + axisSep) + ",0)")
			.call(yAxis);

		svg.append("path")
			.attr("class", "line")
			.attr("clip-path", "url(#theHaircut)")
			.attr("d", line(data));

		function clicky () {
			var n = data.length - 1,
				i = Math.floor(Math.random() * n/2),
				j = i + Math.floor(Math.random() * n/2) + 1,
				data1 = data.slice(i, j+1);

			x.domain([data[i].date, data[j].date]);
			y.domain(d3.extent(data1, function(d) { return d.y; }));

			var t = svg.transition().duration(2000);

			t.select(".grid").call(grid);
			t.select(".x.axis").call(xAxis);
			t.select(".y.axis").call(yAxis);
			t.select(".line").attr("d", line(data));
		}
	});
});

// 
// Scatter example
// 
$(function () {

	var container = "#scatter-example";

	var margin = {top: 0, right: 10, bottom: 50, left: 40},
		width = $(container).width() - margin.left - margin.right,
		height = width / 1.375;


	var x = d3.scale.linear().range([0, width]),
		y = d3.scale.linear().range([height, 0]),
		xAxis = d3.svg.axis().scale(x).ticks(4).outerTickSize(0),
		yAxis = d3.svg.axis().scale(y).ticks(4).outerTickSize(0).orient("left");

	var grid = d3.svg.grid()
		.xAxis(xAxis)
		.yAxis(yAxis);

	withFlowerData(function (data) {

		var svg = d3.select(container).append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
			.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
				.on("click", clicky);

		svg.append("clipPath")
				.attr("id", "theHaircut2")
			.append("rect")
				.attr({
					"width": width,
					"height": height
				});

		svg.append("rect")
			.attr({
				"class": "background",
				"width": width,
				"height": height
			});

		x.domain(d3.extent(data, function(d) { return d.x; }));
		y.domain(d3.extent(data, function(d) { return d.y; }));
	
		svg.append("g")
			.attr("class", "grid")
			.call(grid);
		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);
		svg.append("g")
			.attr("class", "y axis")
			// .attr("transform", "translate(" + width + ",0)")
			.call(yAxis);

		svg.append("g").attr("clip-path", "url(#theHaircut2)").selectAll(".dot")
				.data(data)
			.enter().append("circle")
				.attr({
					"class": "dot",
					"r": 2,
					"cx": function (d) { return x(d.x); },
					"cy": function (d) { return y(d.y); }
				});


		function clicky () {
			var n = data.length - 1,
				i = Math.floor(Math.random() * n/2),
				j = i + Math.floor(Math.random() * n/2) + 1,
				data1 = data.slice(i, j+1);

			x.domain([data[i].x, data[j].x]);
			y.domain(d3.extent(data1, function(d) { return d.y; }));

			var t = svg.transition().duration(2000);

			t.select(".grid").call(grid);
			t.select(".x.axis").call(xAxis);
			t.select(".y.axis").call(yAxis);
			t.selectAll(".dot")
				.attr({
					"cx": function (d) { return x(d.x); },
					"cy": function (d) { return y(d.y); }
				});
		}
	});
});

// 
// Ordinal example
// 
$(function () {

	var container = "#ordinal-example";

	var margin = {top: 0, right: 10, bottom: 50, left: 40},
		width = $(container).width() - margin.left - margin.right,
		height = width / 1.375;

	var x = d3.scale.ordinal().rangeRoundBands([0, width], 0.1);
	var y = d3.scale.linear().range([height, 0]);

	var xAxis = d3.svg.axis().scale(x).ticks(4).outerTickSize(0);
	var yAxis = d3.svg.axis().scale(y).ticks(4, "%").outerTickSize(0).orient("left");

	var grid = d3.svg.grid()
		.xAxis(xAxis)
		.yAxis(yAxis);

	d3.tsv("letters.tsv", function (error, data) {
		data.forEach(function (d) {
			d.frequency = +d.frequency;
		});

		x.domain(data.map(function (d) { return d.letter; }));
		y.domain([0, d3.max(data, function (d) { return d.frequency; })]);

		var svg = d3.select(container).append("svg")
				.attr({
					"width": width + margin.left + margin.right,
					"height": height + margin.top + margin.bottom
				})
			.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
				.on("click", clicky);

		svg.append("clipPath")
				.attr("id", "theHaircut3")
			.append("rect")
				.attr({
					"width": width,
					"height": height
				});

		svg.append("rect")
			.attr({
				"class": "background",
				"width": width,
				"height": height
			});

		svg.append("g")
			.attr("class", "grid")
			.call(grid);
		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);
		svg.append("g")
			.attr("class", "y axis")
			.call(yAxis);

		svg.selectAll(".bar")
				.data(data)
			.enter().append("rect")
				.attr({
					"class": "bar",
					"x": function (d) { return x(d.letter); },
					"width": x.rangeBand(),
					"y": function (d) { return y(d.frequency); },
					"height": function (d) { return height - y(d.frequency); }
				});
		function clicky () {
			var n = data.length - 1,
				i = Math.floor(Math.random() * n/2),
				j = i + Math.floor(Math.random() * n/2) + 1,
				data1 = data.slice(i, j+1);

			x.domain(data1.map(function (d) { return d.letter; }));
			y.domain(d3.extent(data1, function(d) { return d.frequency; }));

			var t = svg.transition().duration(2000);

			t.select(".grid").call(grid);
			t.select(".x.axis").call(xAxis);
			t.select(".y.axis").call(yAxis);

			var ε = 1e-6;
			var bars = svg.selectAll(".bar").data(data1, function (d) { return d.letter; });

			bars
				.enter().append("rect")
					.attr({
						"class": "bar",
						"x": function (d) { return x(d.letter); },
						"width": x.rangeBand(),
						"y": function (d) { return y(d.frequency); },
						"height": function (d) { return height - y(d.frequency); }
					})
					.style("opacity", ε);
			bars.transition().duration(2000)
					.attr({
						"x": function (d) { return x(d.letter); },
						"width": x.rangeBand(),
						"y": function (d) { return y(d.frequency); },
						"height": function (d) { return height - y(d.frequency); }
					})
					.style("opacity", 1);
			bars.exit().transition().duration(2000)
					.style("opacity", ε)
					.remove();
		}
	});
});
