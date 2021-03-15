// if the data you are going to import is small, then you can import it using es6 import
// import MY_DATA from './app/data/example.json'

import {filter_geog, get_color, barFilter, columnHas} from './utils';
import {get_cats} from './utils';
import 'intersection-observer';
import scrollama from 'scrollama';
import {json} from 'd3-fetch';
import {select, selectAll} from 'd3-selection';
import {scaleLinear, scaleBand, scaleOrdinal, scaleThreshold} from 'd3-scale';
import {extent} from 'd3-array';
import {line} from 'd3-shape';
import {axisLeft, axisBottom, tickFormat} from 'd3-axis';
import {format} from 'd3-format';
import {transition} from 'd3-transition';
import {buildContainers, renderBar, renderLines} from './rendercharts';
import './main.css';

// Colors
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
var myData = {};
var defaults = {};
// Data Constants
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
  [
    './data/renewables.json',
    './data/source.json',
    // 'https://hpassen.github.io/energy_emissions_dynamic/data/renewables.json',
    // 'https://hpassen.github.io/energy_emissions_dynamic/data/source.json',
  ].map((url) => fetch(url).then((x) => x.json())),
)
  .then((results) => {
    //Name the constants
    const [renewables, source] = results;
    myData = {renew: renewables, src: source};
    console.log('...in the promise...myData:', myData);
    defaults = {
      xCol: 'year',
      yCol: 'gen_mwh',
      dataset: source,
      filterVal: 'src',
      colorScale: srcColors,
      geog: 'United States',
      xLabel: 'year',
    };
    console.log('in the promise...defaults:', defaults);

    //Build the Axes/Chart Body
    buildContainers('#scrollfig', defaults.xLabel, sizesDynamic);

    // Generate the scroll and the interactive dropdowns
    scroll();

    buildContainers('#bar', defaults.xLabel, sizesStatic);
    testBar(source, '#bar', 1990, sizesStatic, colors);
    buildContainers('#smalllines', defaults.xLabel, sizesStatic);
    testLines(source, '#smalllines');
    uxDynamic(results, '#dynamic', defaults);
  })
  .catch((e) => {
    console.log(e);
  });

//
//
// THE SCROLLY SECTION
// initialize the scrollama
var scroller = scrollama();

// generic window resize listener event
function handleResize() {
  // 1. update height of step elements
  // var stepH = Math.floor(window.innerHeight * 0.75);
  var stepH = Math.floor(window.innerHeight * 0.75);
  step.style('height', stepH + 'px');

  // 2. update the figure sizes
  var figureHeight = window.innerHeight / 1.5;
  var figureWidth = window.innerWidth / 2;
  var figureMarginTop = (window.innerHeight - figureHeight) / 2;

  var scaleH = figureHeight / height;
  var scaleW = figureWidth / width;

  figure
    .style('height', figureHeight + 'px')
    .style('width', figureWidth + 'px')
    .style('top', figureMarginTop + 'px');

  // 4. update the sizes variable
  sizesDynamic.height = figureHeight;
  sizesDynamic.width = figureWidth * 0.8;
  sizesDynamic.plotHeight = plotHeight * scaleH;
  sizesDynamic.plotWidth = figureWidth * 0.8 - margin.left - margin.right;

  // 3. update the chart sizes
  select('.chart')
    .attr('height', figureHeight + 'px')
    .attr('width', figureWidth * 0.8 + 'px');

  // 5. tell scrollama to update new element dimensions
  scroller.resize();
}

// scrollama event handlers
function handleStepEnter(response) {
  console.log(response);
  // response = { element, direction, index }

  // add color to current step only
  step.classed('is-active', function (d, i) {
    return i === response.index;
  });

  // update graphic based on step
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

    // if (response.index !== 5 || response.index !== 9) {
    //   var scrollfig = selectAll('#scrollfig');
    //   scrollfig.selectAll('.legend').remove();
    // }
  } else {
    // swap to renewables dataset
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

function setupStickyfill() {
  selectAll('.sticky').each(function () {
    Stickyfill.add(this);
  });
}

function scroll(scrollConfig) {
  console.log('Hi from scroll');
  setupStickyfill();

  // 1. force a resize on load to ensure proper dimensions are sent to scrollama
  handleResize();

  // 2. setup the scroller passing options
  // 		this will also initialize trigger observations
  // 3. bind scrollama event handlers (this can be chained like below)
  scroller
    .setup({
      step: '#scrolly article .step',
      offset: 0.45,
      debug: true,
    })
    .onStepEnter(handleStepEnter);

  // setup resize event
  window.addEventListener('resize', handleResize);
}

// kick things off
scroll();

//
//
// Interactive Function
function uxDynamic(data, id, defaults) {
  const [renewables, source] = data;
  console.log(plotHeight, plotWidth);
  console.log(data);
  console.log('in myViz the defaults are', defaults);
  console.log('in myVis the id is', id);

  // DEFAULTS:
  var xCol = defaults.xCol;
  var yCol = defaults.yCol;
  var geog = defaults.geog;
  var dataset = defaults.dataset;
  var filterVal = defaults.filterVal;
  var colorScale = defaults.colorScale;
  console.log(dataset);

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

  measures_dd.append('div').text((d) => d);

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

  dataset_dd.append('div').text((d) => d);

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

  geog_dd.append('div').text((d) => d);

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
    .property('selected', (d) =>
      d.dim === 'Geography' ? d['state'] === geog : d['state'] === geog,
    );

  // Containers for the Plot
  buildContainers(id, defaults.xLabel, sizesStatic);
  // Lines Inside the Containers
  console.log('but the id is here, right?', id);
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

//
//
// Credit for Line Animation
// http://bl.ocks.org/fryford/2925ecf70ac9d9b51031

//TESTING THE FILTERED LINES
function testLines(dataset, id) {
  console.log('...testing...data:', dataset);
  console.log('...testing...id:', id);
  // DEFAULTS
  var xCol = defaults.xCol;
  var yCol = defaults.yCol;
  var geog = defaults.geog;
  var filterVal = defaults.filterVal;
  var colorScale = defaults.colorScale;

  const t = transition().duration(800);
  const loc = filter_geog(dataset, 'United States');
  console.log('...testing... loc:', loc);

  var filters = ['Coal', 'Wind'];
  var lineData = columnHas(loc, 'src', filters);
  console.log('...testing columnhas:', lineData);

  renderLines(
    xCol,
    yCol,
    lineData,
    filterVal,
    colorScale,
    geog,
    id,
    sizesStatic,
  );
}

//
//
// TESTING THE BARS
function testBar(dataset, figID, year, sizesStatic, colors) {
  renderBar(dataset, figID, year, sizesStatic, colors);
}
