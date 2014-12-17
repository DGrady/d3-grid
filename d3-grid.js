// This project is done when:
// - [X] code is fully commented
// - [ ] short blog post that inlines the code to explain the motivation
// - [ ] Git repository with the plugin
// - [X] Example page demoing different scales on the same page

// `d3.svg.grid` is a new component for D3 that simplifies drawing a rectangular
// grid, for example in a scatter plot. The main use case is when you want to draw
// axis tick marks as well as grid lines.

// This component works just like `d3.svg.axis`: it's a factory function that
// returns a configurable `grid` function, which you call on a selection (or
// transition) of `svg` or `g` elements. The only configurable interface it
// exposes are functions to set the x- and- y-axis.

d3.svg.grid = function() {

  var ε = 1e-6;

  var xAxis = d3.svg.axis(),
      yAxis = d3.svg.axis();

  function grid(g) {
    // `d3.svg.grid` works just like `d3.svg.axis`: you call it on a selection
    // (or transition), and it draws SVG elements inside each element of the
    // selection. So right now `g` is a selection or transition - that it might
    // be a transition is important below.

    // [`d3.selection.each`](https://github.com/mbostock/d3/wiki/Selections#wiki-each)
    // runs some function for each element in a selection, setting `this` to the
    // element and supplying the corresponding datum and index.
    g.each(function (datum, index) {

      // Now, the variable `g` is (by assumption) a single `svg` or `g` element.
      var g = d3.select(this);

      // Now we have a handle on a single element to draw the grid into. This
      // element might or might not already have a grid, and if there is a grid
      // we might or might not need to transition it to a new state.
      // Transitioning a grid from an old state to a new one requires us to know
      // about the old axis scales as well as the new ones, so that we can place
      // *new* grid lines at the position they had under the *old* scale, and then
      // transition them to their new and final position. We give ourselves
      // access to the old scales by stashing copies of our new scales in the
      // DOM.

      // Create a stash for scales if it doesn't exist
      this.__chart__ !== undefined || ( this.__chart__ = {} );

      // The old scales, that we're transitioning away from
      var sx0 = this.__chart__.x || xAxis.scale().copy(),
          sy0 = this.__chart__.y || yAxis.scale().copy();

      // The new scales that we're transitioning to (and stash a copy of them)
      var sx = this.__chart__.x = xAxis.scale().copy(),
          sy = this.__chart__.y = yAxis.scale().copy();

      var sxRange = d3_scaleRange(sx),
          syRange = d3_scaleRange(sy),
               x1 = sxRange[0],
               x2 = sxRange[1],
               y1 = syRange[0],
               y2 = syRange[1];

      // Now we create a selection that has exactly one item by binding some
      // dummy data to it.
      var xGrid = g.selectAll("g.x.grid").data([0]);

      // If there are no matching elements in the DOM, we create them.
      xGrid.enter().append("g").attr("class", "x grid");
      
      // Now the `xGrid` selection definitely has exactly one `g` element in it,
      // which is the canvas we'll use for drawing all of the x-grid lines.

      // We make a selection that includes all `line` elements inside the
      // `xGrid` collection. We want there to be one `line` per tick mark, and
      // tick marks are determined by this grid's `xAxis`. D3's policy for
      // figuring out where to put tick marks is a little complicated, and we
      // wrap that up into the `ticks` function. `ticks("x")` looks at the
      // `xAxis` and returns an array of data-space values to put tick marks at.
      // The other complication here is the use of the [key
      // function](https://github.com/mbostock/d3/wiki/Selections#data). By
      // default (without a key function), D3 will match the first item in the
      // data array with the first DOM element in the selection, the second with
      // the second, and so on. That could lead to an irritating situation:
      // there is already a `grid` drawn on this page, and it has a grid line
      // corresponding to an x-position of 2.5 in data space. The user has
      // clicked a tricky widget, which changed the set of data points, and now
      // we find that we need to get rid of the 2.5 grid line and draw a new
      // grid line at 7.3. If we wrote
      // 
      //     xGrid.selectAll("line").data(ticks("x"))
      // 
      // then D3 will match the first `line` element (the line that already
      // exists, marking 2.5) with the first data item (7.3). When we
      // subsequently use a transition to move this line into the canvas space
      // position that corresponds to 7.3, the person looking at our scatter
      // plot will see the grid line that *used to* mark 2.5 move to a new
      // position that *now* marks 7.3. That's a confusing animation. What we
      // want instead is for the line that marks 2.5 to continue marking that
      // same value and slide off the left side of the plot, and to draw a new
      // line to mark 7.3. Using a key function allows us to label each DOM
      // element and each data item with a string; elements and items will only
      // be bound to one another if their strings match.
      // 
      // So in short, this line says to bind all the `line` elements in
      // `xGrid` to the tick values array, but only bind an existing `line`
      // element to a tick value if the `line` element already represents that
      // tick value.
      var xGridLines = xGrid.selectAll("line").data(ticks("x"), function (d) { return d; });

      // Now we follow the enter, update, exit pattern. We append new elements
      // for any tick values that didn't already have corresponding `line`s, but
      // set their opacity to 0. We also place them onto the canvas using the
      // old scale: the grid line for 7.3 should slide onto the canvas as though
      // it had always been there.
      // 
      // Although, of course, there is one further wrinkle. If we are
      // transitioning *to* an ordinal scale, then the new ticks marks that
      // we're adding will correspond to values that aren't even in the domain
      // of the old scale. For example, we're transitioning to a new scale and
      // need to draw a tick mark for the value "C". "C" doesn't exist in the
      // domain of the old scale (if it did, this tick mark would be part of
      // the update selection and not the enter selection). To work around
      // this case, we'll let new tick marks for ordinal scales fade in at
      // their new, final locations by using the new scale to set their
      // entering position. We make this switch using the ternary operator.
      xGridLines.enter().append("line")
          .style("opacity", ε)
          .call(transformX, isOrdinal(sx) ? sx : sx0);
      // Now we transition the opacity of all `line` elements to 1. Why do we
      // use `d3.transition(xGridLines)` instead of calling
      // `xGridLines.transition()`? Because `g` (way back at the beginning) is
      // either a selection, *or* a transition - we might be drawing this grid
      // into an ongoing transition. Using [`d3.transition`](https://github.com/
      // mbostock/d3/wiki/Transitions#d3_transition) lets us inherit properties
      // (like the delay and duration) of the parent transition. We also use the
      // new scale to move grid lines into their final positions.
      d3.transition(xGridLines)
          .style("opacity", 1)
          .call(transformX, sx);
      // Lastly, any grid lines we don't need anymore get faded out, moved to
      // new positions, and then removed. Except, again, if we are
      // transitioning *from* an ordinal scale, then none of the exiting
      // values will exist in the new scale's domain. We fade them out at
      // their old positions.
      d3.transition(xGridLines.exit())
          .style("opacity", ε)
          .call(transformX, isOrdinal(sx0) ? sx0 : sx)
          .remove();

      // And we do the whole thing over for the y grid!
      var yGrid = g.selectAll("g.y.grid").data([0]);
      yGrid.enter().append("g").attr("class", "y grid");

      var yGridLines = yGrid.selectAll("line").data(ticks("y"), function (d) { return d; });
      yGridLines.enter().append("line")
          .style("opacity", ε)
          .call(transformY, isOrdinal(sy) ? sy : sy0);
      d3.transition(yGridLines)
          .style("opacity", 1)
          .call(transformY, sy);
      d3.transition(yGridLines.exit())
          .style("opacity", ε)
          .call(transformY, isOrdinal(sy0) ? sy0 : sy)
          .remove();

      // That's it. Everything else here is boilerplate or details.

      function transformX (selection, sIn) {
        var s = ordinalTickCorrection(sIn);
        selection
          .attr({
            "x1": function (d) { return s(d); },
            "y1": y1,
            "x2": function (d) { return s(d); },
            "y2": y2
          });
      }

      function transformY (selection, sIn) {
        var s = ordinalTickCorrection(sIn);
        selection
          .attr({
            "x1": x1,
            "y1": function (d) { return s(d); },
            "x2": x2,
            "y2": function (d) { return s(d); }
          });
      }

    });

  }

  grid.xAxis = function(_) {
    if (!arguments.length) return xAxis;
    xAxis = _;
    return grid;
  };

  grid.yAxis = function(_) {
    if (!arguments.length) return yAxis;
    yAxis = _;
    return grid;
  };

  return grid;

  // ## Some help
  // 
  // What follows are helper functions that deal with some of the trickier
  // points of how to get tick positions and calculate the extent of scales
  // (which might be ordinal and have a little padding around each tick).

  // D3's axis component does some quick and dirty arithmetic to center tick
  // marks in the middle of each range band
  function ordinalTickCorrection(s) {
    var x = sOut = s.copy();
    if (x.rangeBand) {
      var dx = s.rangeBand() / 2;
      sOut = function (d) { return x(d) + dx; };
    }
    return sOut;
  }

  // Checks if a scale is ordinal or not
  function isOrdinal(s) {
    return (s.rangeBand);
  }

  // Returns an array of values in data space
  function ticks(xOrY) {

    var       axis = (xOrY === "x") ? xAxis : yAxis,
                 s = axis.scale(),
        tickValues = axis.tickValues();

    // This is copied from D3's
    // [axis component source](https://github.com/mbostock/d3/blob/master/src/svg/axis.js#L28);
    // the policy for getting tick positions is apparently a little complicated.
    var coords = tickValues === null ? (s.ticks ? s.ticks.apply(s, axis.ticks()) : s.domain()) : tickValues;

    return coords;
  }

  // How do you find the extent of a scale's range? The simple answer is
  // `d3.extent(s.range())` - but there are at least two problems with this. The
  // first is that `d3.extent` looks for minimum and maximum values using
  // natural ordering, and this may not be appropriate for all scale ranges.
  // For example, if `s = d3.scale.linear().domain([-1, 0, 1]).range(["red",
  // "white", "green"])`, then `d3.extent(s.range()) === ["green", "white"]`
  // because the range values are sorted as strings. The second problem is
  // that ordinal scales add some padding around the canvas position of each
  // categorical variable, which isn't reflected in the `s.range()` array.
  // 
  // For these reasons and possibly others, D3 defines two internal functions
  // to accurately compute the canvas space range of values that a scale covers.
  // These are reproduced below, stolen from
  // [the source for `d3.scale`](https://github.com/mbostock/d3/blob/master/src/scale/scale.js).
  function d3_scaleExtent(domain) {
    var start = domain[0], stop = domain[domain.length - 1];
    return start < stop ? [start, stop] : [stop, start];
  }

  function d3_scaleRange(scale) {
    return scale.rangeExtent ? scale.rangeExtent() : d3_scaleExtent(scale.range());
  }

};
