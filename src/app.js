//
// Functions to build and generate interactive data visualization web app
//

// Import Libraries
import {filter_geog, get_color, barFilter, columnHas} from './utils';
import {get_cats} from './utils';
import 'intersection-observer';
import scrollama from 'scrollama';
import {json} from 'd3-fetch';
import {select, selectAll} from 'd3-selection';
import {scaleLinear, scaleBand, scaleOrdinal} from 'd3-scale';
import {extent} from 'd3-array';
import {line} from 'd3-shape';
import {axisLeft, axisBottom, tickFormat} from 'd3-axis';
import {format} from 'd3-format';
import {transition} from 'd3-transition';
import {buildContainers, renderBar, renderLines} from './rendercharts';
import './main.css';

//
// SETUP SECTION
//
// Set up Colors
const srcColors = scaleOrdinal()
  .domain([
    'Coal',
    'Hydroelectric',
    'Natural Gas',
    'Petroleum',
    'Wind',
    'Wood Derived Fuels',
    'Nuclear',
    'Other Biomass',
    'Other Gases',
    'Pumped Storage',
    'Geothermal',
    'Other',
    'Solar',
  ])
  .range([
    '#9f9f9f',
    '#6a85da',
    '#c7bd74',
    '#a27c4f',
    '#67c2c8',
    '#e5e5e5',
    '#c89aba',
    '#e5e5e5',
    '#e5e5e5',
    '#e5e5e5',
    '#de6f6f',
    '#e5e5e5',
    '#ff8b42',
  ]);
const renewColors = scaleOrdinal()
  .domain(['Renewable', 'Nonrenewable'])
  .range(['#81d06e', '#8c8276']);

// Set up Scrolly Constants
var id = '#scrollfig';
var scrolly = select('#scrolly');
var figure = scrolly.select('figure');
var article = scrolly.select('article');
var step = article.selectAll('.step');
const scrollConfig = {
  0: 1990,
  1: 2019,
  2: ['Coal'],
  3: ['Petroleum'],
  4: ['Natural Gas'],
  5: ['Geothermal', 'Hydroelectric'],
  6: ['Nuclear'],
  7: ['Wind'],
  8: ['Solar'],
  9: ['Coal', 'Natural Gas', 'Hydroelectric', 'Nuclear', 'Wind', 'Solar'],
  10: ['Renewable'],
  11: ['Renewable', 'Nonrenewable'],
};

// Set up Data Constants
var myData = {src: [], renew: []};
var defaults = {
  xCol: 'year',
  yCol: 'gen_mwh',
  dataset: [],
  filterVal: 'src',
  colorScale: srcColors,
  geog: 'United States',
  xLabel: 'year',
};

// Set up Chart Sizing Constants
const width = 700;
const height = (24 / 36) * width;
const margin = {top: 20, bottom: 80, right: 40, left: 100};
const plotHeight = height - margin.top - margin.bottom;
const plotWidth = width - margin.left - margin.right;

var sizesDynamic = {
  width: width,
  height: height,
  margin: margin,
  plotHeight: plotHeight,
  plotWidth: plotWidth,
};

var sizesStatic = {
  width: width,
  height: height,
  margin: margin,
  plotHeight: plotHeight,
  plotWidth: plotWidth,
};
const colors = {src: srcColors, renew: renewColors};

//
//
//GET THE DATA AND RUN THE PAGE
Promise.all(
  ['./data/renewables.json', './data/source.json'].map((url) =>
    fetch(url).then((x) => x.json()),
  ),
)
  .then((results) => {
    //Name the constants
    const [renewables, source] = results;
    myData = {renew: renewables, src: source};
    defaults = {
      xCol: 'year',
      yCol: 'gen_mwh',
      dataset: source,
      filterVal: 'src',
      colorScale: srcColors,
      geog: 'United States',
      xLabel: 'year',
    };

    //Build the Axes/Chart Body
    buildContainers('#scrollfig', defaults.xLabel, sizesDynamic);
    // Generate the scroll
    scroll();
    // Generate the interactive dropdowns
    uxDynamic(results, '#dynamic', defaults);
  })
  .catch((e) => {
    console.log(e);
  });

//
//
// SCROLLAMA SECTION
// initialize the scrollama
var scroller = scrollama();

// generic window resize listener event
function handleResize() {
  // set resize variables
  var figureHeight = window.innerHeight / 1.5;
  var figureWidth = window.innerWidth / 2;
  var figureMarginTop = (window.innerHeight - figureHeight) / 2;

  var scaleH = figureHeight / height;
  var scaleW = figureWidth / width;

  // 1. update height of step elements
  var stepH = Math.floor(window.innerHeight * 0.7);
  step.style('height', stepH + 'px');

  // 2. update the figure sizes
  figure
    .style('height', figureHeight + 'px')
    .style('width', figureWidth + 'px')
    .style('top', figureMarginTop + 'px');

  // 3. update the sizes variable
  sizesDynamic.height = figureHeight;
  sizesDynamic.width = figureWidth * 0.8;
  sizesDynamic.plotHeight = plotHeight * scaleH;
  sizesDynamic.plotWidth = figureWidth * 0.8 - margin.left - margin.right;

  // 4. update the chart sizes
  select('.chart')
    .attr('height', figureHeight + 'px')
    .attr('width', figureWidth * 0.8 + 'px');

  // 5. tell scrollama to update new element dimensions
  scroller.resize();
}

// scrollama event handlers
function handleStepEnter(response) {
  // Note: response = { element, direction, index }

  // 1. update the color of the text in each step
  step.classed('is-active', function (d, i) {
    return i === response.index;
  });

  // 2. update chart based on step
  if (response.index < 2) {
    // remove the lines & legend on the way up
    if (response.direction == 'up' && response.index == 1) {
      var scrollfig = selectAll('#scrollfig');
      scrollfig.selectAll('.line').remove();
      scrollfig.selectAll('.legend').style('opacity', 0);
    }
    // make the bar charts
    renderBar(
      defaults.dataset,
      id,
      scrollConfig[response.index],
      sizesDynamic,
      colors,
    );
  } else if (1 < response.index && response.index < 10) {
    // remove the rectangles and add legend on the way down
    if (response.direction == 'down' && response.index == 2) {
      var scrollfig = selectAll('#scrollfig');
      scrollfig.selectAll('rect').remove();
      scrollfig.selectAll('.legend').style('opacity', 1);
    }
    // make the line chart
    var filters = scrollConfig[response.index];
    var lineData = columnHas(defaults.dataset, 'src', filters);
    renderLines(
      defaults.xCol,
      defaults.yCol,
      lineData,
      defaults.filterVal,
      defaults.colorScale,
      defaults.geog,
      id,
      sizesDynamic,
    );
  } else {
    // swap to renewables dataset and make the line chart
    var filters = scrollConfig[response.index];
    var lineData = columnHas(myData.renew, 'renew', filters);
    renderLines(
      defaults.xCol,
      defaults.yCol,
      lineData,
      'renew',
      colors.renew,
      defaults.geog,
      id,
      sizesDynamic,
    );
  }
}

// make sure the graphic is sticky on the right
function setupStickyfill() {
  selectAll('.sticky').each(function () {
    Stickyfill.add(this);
  });
}

// scrollama function
function scroll() {
  setupStickyfill();

  // 1. force a resize on load to ensure proper dimensions are sent to scrollama
  handleResize();

  // 2. setup the scroller passing options
  // 		this will also initialize trigger observations
  // 3. bind scrollama event handlers (this can be chained like below)
  scroller
    .setup({
      step: '#scrolly article .step',
      offset: 0.5,
      debug: false,
    })
    .onStepEnter(handleStepEnter);

  // setup resize event
  window.addEventListener('resize', handleResize);
}

// kick things off
scroll();

//
//
// INTERACTIVE UX SECTION
// Interactive Chart and Dropdowns Function
// Inputs:
//        data (obj): an object containing two arrays of data, where each item
//                    in the array is an object representing a row of data
//                    data
//        id (str): the section id on the page where the svg will be bound
//        defaults (obj): an object containing defaults for a dataset, columns,
//                        geographic filters, a color scheme, and a column of
//                        categories
//
function uxDynamic(data, id, defaults) {
  // Defaults and constants
  const [renewables, source] = data;
  var xCol = defaults.xCol;
  var yCol = defaults.yCol;
  var geog = defaults.geog;
  var dataset = defaults.dataset;
  var filterVal = defaults.filterVal;
  var colorScale = defaults.colorScale;

  //Constants for Dropdowns
  const measures = {
    Total: 'gen_mwh',
    'Per Capita': 'mwh_pp',
  };
  const measures_vars = Object.keys(measures);
  const datasets = {
    'Energy Generation by Source': [source, 'src', srcColors],
    'Energy Generation by Renewables': [renewables, 'renew', renewColors],
  };
  const datasets_vars = Object.keys(datasets);
  // UNIQUES FROM THIS SOURCE https://codeburst.io/javascript-array-distinct-5edc93501dc4
  const geogs_vars = [...new Set(renewables.map((row) => row['state']))];

  // Measurement Dropdown
  const measures_dd = select('#ux')
    .append('div')
    .attr('class', 'dropdown')
    .style('display', 'flex')
    .style('flex-direction', 'row')
    .selectAll('.drop-down')
    .data(['Measurement'])
    .join('div');

  measures_dd
    .append('div')
    .text((d) => d)
    .attr('class', 'tight');

  measures_dd
    .append('select')
    .on('change', (event) => {
      var measure = event.target.value;
      yCol = measures[measure];
      renderLines(
        xCol,
        yCol,
        dataset,
        filterVal,
        colorScale,
        geog,
        id,
        sizesStatic,
      );
    })
    .selectAll('option')
    .data((dim) => measures_vars.map((measurement) => ({measurement, dim})))
    .join('option')
    .text((d) => d.measurement)
    .property('selected', (d) => d.measurement === yCol);

  // Dataset Dropdown
  const dataset_dd = select('#ux')
    .append('div')
    .attr('class', 'dropdown')
    .style('display', 'flex')
    .style('flex-direction', 'row')
    .selectAll('.drop-down')
    .data(['Energy'])
    .join('div');

  dataset_dd
    .append('div')
    .text((d) => d)
    .attr('class', 'tight');

  dataset_dd
    .append('select')
    .on('change', (event) => {
      [dataset, filterVal, colorScale] = datasets[event.target.value];
      renderLines(
        xCol,
        yCol,
        dataset,
        filterVal,
        colorScale,
        geog,
        id,
        sizesStatic,
      );
    })
    .selectAll('option')
    .data((dim) => datasets_vars.map((dataset) => ({dataset, dim})))
    .join('option')
    .text((d) => d.dataset)
    .property('selected', (d) => d.dataset === dataset);

  // Geography Dropdown
  const geog_dd = select('#ux')
    .append('div')
    .attr('class', 'dropdown')
    .style('display', 'flex')
    .style('flex-direction', 'row')
    .selectAll('.drop-down')
    .data(['Geography'])
    .join('div');

  geog_dd
    .append('div')
    .text((d) => d)
    .attr('class', 'tight');

  geog_dd
    .append('select')
    .on('change', (event) => {
      geog = event.target.value;
      console.log('In the geog_dd, the geog is', geog);
      renderLines(
        xCol,
        yCol,
        dataset,
        filterVal,
        colorScale,
        geog,
        id,
        sizesStatic,
      );
    })
    .selectAll('option')
    .data((dim) => geogs_vars.map((state) => ({state, dim})))
    .join('option')
    .text((d) => d['state'])
    .property('selected', (d) => d.dim === 'Geography');

  // Build containers for the plot
  buildContainers(id, defaults.xLabel, sizesStatic);
  // Build lines inside the containers
  renderLines(
    xCol,
    yCol,
    dataset,
    filterVal,
    colorScale,
    geog,
    id,
    sizesStatic,
  );
}
