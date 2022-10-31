// https://observablehq.com/@bumbeishvili/data-driven-range-sliders@1588
import define1 from "./ba71f1bcb80e011e@346.js";




function _barRangeSlider(d3,width,DOM,group){return(
function barRangeSlider(
  initialDataArray,
  accessorFunction,
  aggregatorFunction,
  paramsObject
) {
  const initialData = initialDataArray;
  const accessor = accessorFunction;
  const aggregator = aggregatorFunction;
  const argumentsArr = [...arguments];
  let params = argumentsArr.filter(isPlainObj)[0];
  if (!params) {
    params = {};
  }

  let chartHeight = 100;
  let startSelection = 100;

  params.minY = params.yScale ? 0.0001 : 0;
  params.yScale = params.yScale || d3.scaleLinear();
  chartHeight = params.height || chartHeight;
  params.yTicks = params.yTicks || 4;
  params.freezeMin = params.freezeMin || false;

  const chartWidth = width - 40 - (params.marginRight || 0);

  var accessorFunc = (d) => d;
  if (initialData[0].value != null) {
    accessorFunc = (d) => d.value;
  }
  if (typeof accessor == "function") {
    accessorFunc = accessor;
  }
  const dataFinal = initialData; //
  const isDate =
    Object.prototype.toString.call(accessor(dataFinal[0])) === "[object Date]";
  var dateExtent, dateScale, scaleTime, dateRangesCount, dateRanges, scaleTime;
  if (isDate) {
    dateExtent = d3.extent(dataFinal.map(accessorFunc));
    dateRangesCount = Math.round(width / 5);
    dateScale = d3.scaleTime().domain(dateExtent).range([0, dateRangesCount]);
    scaleTime = d3.scaleTime().domain(dateExtent).range([0, chartWidth]);
    dateRanges = d3
      .range(dateRangesCount)
      .map((d) => [dateScale.invert(d), dateScale.invert(d + 1)]);
  }

  d3.selection.prototype.patternify = function (params) {
    var container = this;
    var selector = params.selector;
    var elementTag = params.tag;
    var data = params.data || [selector];

    // Pattern in action
    var selection = container.selectAll("." + selector).data(data, (d, i) => {
      if (typeof d === "object") {
        if (d.id) {
          return d.id;
        }
      }
      return i;
    });
    selection.exit().remove();
    selection = selection.enter().append(elementTag).merge(selection);
    selection.attr("class", selector);
    return selection;
  };

  const handlerWidth = 2,
    handlerFill = "#E1E1E3",
    middleHandlerWidth = 10,
    middleHandlerStroke = "#8E8E8E",
    middleHandlerFill = "#EFF4F7";

  const svg = d3
    .select(DOM.svg(chartWidth, chartHeight))
    .style("overflow", "visible");

  const chart = svg
    .append("g")
    .attr("transform", `translate(${params.marginLeft ?? 30},5)`);

  const groupedInitial = group(dataFinal)
    .by((d, i) => {
      const field = accessorFunc(d);
      if (isDate) {
        return Math.round(dateScale(field));
      }
      return field;
    })
    .orderBy((d) => d.key)
    .run();

  const grouped = groupedInitial.map((d) =>
    Object.assign(d, {
      value: typeof aggregator == "function" ? aggregator(d) : d.values.length
    })
  );

  const values = grouped.map((d) => d.value);
  const min = d3.min(values);
  const max = d3.max(values);
  const maxX = grouped[grouped.length - 1].key;
  const minX = grouped[0].key;

  var minDiff = d3.min(grouped, (d, i, arr) => {
    if (!i) return Infinity;
    return d.key - arr[i - 1].key;
  });

  let eachBarWidth = chartWidth / minDiff / (maxX - minX);

  if (eachBarWidth > 20) {
    eachBarWidth = 20;
  }

  if (minDiff < 1) {
    eachBarWidth = eachBarWidth * minDiff;
  }

  if (eachBarWidth < 1) {
    eachBarWidth = 1;
  }

  const scale = params.yScale
    .domain([params.minY, max])
    .range([0, chartHeight - 25]);
  const scaleY = scale
    .copy()
    .domain([max, params.minY])
    .range([0, chartHeight - 25]);

  const scaleX = d3.scaleLinear().domain([minX, maxX]).range([0, chartWidth]);
  var axis = d3.axisBottom(scaleX);
  if (isDate) {
    axis = d3.axisBottom(scaleTime);
  }
  const axisY = d3
    .axisLeft(scaleY)
    .tickSize(-chartWidth - 20)
    .ticks(max == 1 ? 1 : params.yTicks)
    .tickFormat(d3.format(".2s"));

  const bars = chart
    .selectAll(".bar")
    .data(grouped)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("width", eachBarWidth)
    .attr("height", (d) => scale(d.value))
    .attr("fill", "steelblue")
    .attr("y", (d) => -scale(d.value) + (chartHeight - 25))
    .attr("x", (d, i) => scaleX(d.key) - eachBarWidth / 2)
    .attr("opacity", 0.9);

  const xAxisWrapper = chart
    .append("g")
    .attr("transform", `translate(${0},${chartHeight - 25})`)
    .call(axis);

  const yAxisWrapper = chart
    .append("g")
    .attr("transform", `translate(${-10},${0})`)
    .call(axisY);

  const brush = chart
    .append("g")
    .attr("class", "brush")
    .call(
      d3
        .brushX()
        .extent([
          [0, 0],
          [chartWidth, chartHeight]
        ])
        .on("start", brushStarted)
        .on("end", brushEnded)
        .on("brush", brushed)
    );

  chart.selectAll(".selection").attr("fill-opacity", 0.1);

  var handle = brush
    .patternify({
      tag: "g",
      selector: "custom-handle",
      data: [
        {
          left: true
        },
        {
          left: false
        }
      ]
    })
    .attr("cursor", "ew-resize")
    .attr("pointer-events", "all");

  handle
    .patternify({
      tag: "rect",
      selector: "custom-handle-rect",
      data: (d) => [d]
    })
    .attr("width", handlerWidth)
    .attr("height", 100)
    .attr("fill", handlerFill)
    .attr("stroke", handlerFill)
    .attr("y", -50)
    .attr("pointer-events", "none");

  handle
    .patternify({
      tag: "rect",
      selector: "custom-handle-rect-middle",
      data: (d) => [d]
    })
    .attr("width", middleHandlerWidth)
    .attr("height", 30)
    .attr("fill", middleHandlerFill)
    .attr("stroke", middleHandlerStroke)
    .attr("y", -16)
    .attr("x", -middleHandlerWidth / 4)
    .attr("pointer-events", "none")
    .attr("rx", 3);

  handle
    .patternify({
      tag: "rect",
      selector: "custom-handle-rect-line-left",
      data: (d) => [d]
    })
    .attr("width", 0.7)
    .attr("height", 20)
    .attr("fill", middleHandlerStroke)
    .attr("stroke", middleHandlerStroke)
    .attr("y", -100 / 6 + 5)
    .attr("x", -middleHandlerWidth / 4 + 3)
    .attr("pointer-events", "none");

  handle
    .patternify({
      tag: "rect",
      selector: "custom-handle-rect-line-right",
      data: (d) => [d]
    })
    .attr("width", 0.7)
    .attr("height", 20)
    .attr("fill", middleHandlerStroke)
    .attr("stroke", middleHandlerStroke)
    .attr("y", -100 / 6 + 5)
    .attr("x", -middleHandlerWidth / 4 + middleHandlerWidth - 3)
    .attr("pointer-events", "none");

  handle.attr("display", "none");

  function brushStarted() {
    if (d3.event.selection) {
      startSelection = d3.event.selection[0];
    }
  }

  function brushEnded() {
    console.log("ended");
    if (!d3.event.selection) {
      handle.attr("display", "none");

      output({
        range: [minX, maxX]
      });
      return;
    }
    if (d3.event.sourceEvent.type === "brush") return;

    var d0 = d3.event.selection.map(scaleX.invert),
      d1 = d0.map(d3.timeDay.round);

    if (d1[0] >= d1[1]) {
      d1[0] = d3.timeDay.floor(d0[0]);
      d1[1] = d3.timeDay.offset(d1[0]);
    }
    console.log(d0, d1);
  }

  function brushed(d) {
    if (d3.event.sourceEvent.type === "brush") return;
    console.log("brushed", d3.event.selection);

    if (params.freezeMin) {
      if (d3.event.selection[0] < startSelection) {
        d3.event.selection[1] = Math.min(
          d3.event.selection[0],
          d3.event.selection[1]
        );
      }
      if (d3.event.selection[0] >= startSelection) {
        d3.event.selection[1] = Math.max(
          d3.event.selection[0],
          d3.event.selection[1]
        );
      }

      d3.event.selection[0] = 0;
      //    console.log(d3.event.selection)

      d3.select(this).call(d3.event.target.move, d3.event.selection);
    }

    var d0 = d3.event.selection.map(scaleX.invert);
    const s = d3.event.selection;
    console.log(s);

    handle.attr("display", null).attr("transform", function (d, i) {
      console.log(d);
      return "translate(" + (s[i] - 2) + "," + chartHeight / 2 + ")";
    });
    output({
      range: d0
    });
  }

  yAxisWrapper.selectAll(".domain").remove();
  xAxisWrapper.selectAll(".domain").attr("opacity", 0.1);

  chart.selectAll(".tick line").attr("opacity", 0.1);

  function isPlainObj(o) {
    return typeof o == "object" && o.constructor == Object;
  }

  function output(value) {
    const node = svg.node();
    node.value = value;
    node.value.data = getData(node.value.range);
    if (isDate) {
      node.value.range = value.range.map((d) => dateScale.invert(d));
    }
    node.dispatchEvent(new CustomEvent("input"));
  }

  function getData(range) {
    const dataBars = bars
      .attr("fill", "steelblue")
      .filter((d) => {
        return d.key >= range[0] && d.key <= range[1];
      })
      .attr("fill", "red")
      .nodes()
      .map((d) => d.__data__)
      .map((d) => d.values)
      .reduce((a, b) => a.concat(b), []);

    return dataBars;
  }

  const returnValue = Object.assign(svg.node(), {
    value: {
      range: [minX, maxX],
      data: initialData
    }
  });

  if (isDate) {
    returnValue.value.range = returnValue.value.range.map((d) =>
      dateScale.invert(d)
    );
  }

  return returnValue;
}
)}


function _d3(require){return(
require('d3@v5')
)}



export default function define(runtime, observer) {
  const main = runtime.module();

  main.variable(observer("barRangeSlider")).define("barRangeSlider", ["d3","width","DOM","group"], _barRangeSlider);

  main.variable(observer("d3")).define("d3", ["require"], _d3);
  const child2 = runtime.module(define1);
  main.import("group", child2);

  return main;
}
