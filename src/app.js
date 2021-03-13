// if the data you are going to import is small, then you can import it using es6 import
// import MY_DATA from './app/data/example.json'

import {filter_geog, get_color, barFilter} from './utils';
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
var chart = scrolly.select('#chart');
var article = scrolly.select('article');
var step = article.selectAll('.step');
var myData = {};
var defaults = {};
// Data Constants
const xCol = 'year';
const xLab = 'Year';
const scrollConfig = {
  0: 1990,
  1: 2019,
  2: ['Coal'],
  3: ['Petroleum'],
  4: ['Natural Gas'],
  5: ['Nuclear', 'Geothermal', 'Hydroelectric'],
  6: ['Wind'],
  7: ['Solar'],
  8: ['Renewable'],
  9: ['Nonrenewable'],
};

// Set up Chart Sizing Constants
const width = 600;
const height = (24 / 36) * width;
const margin = {top: 60, bottom: 60, right: 30, left: 100};
const plotHeight = height - margin.top - margin.bottom;
const plotWidth = width - margin.left - margin.right;

//
//
// THE SCROLLY SECTION
// initialize the scrollama
var scroller = scrollama();

// generic window resize listener event
function handleResize() {
  // 1. update height of step elements
  // var stepH = Math.floor(window.innerHeight * 0.75);
  // var stepH = Math.floor(window.innerHeight * 0.5);
  step.style('height', height + 'px');

  var figureHeight = window.innerHeight / 2;
  var figureMarginTop = (window.innerHeight - figureHeight) / 2;

  figure
    .style('height', figureHeight + 'px')
    .style('top', figureMarginTop + 'px');

  chart.style('height', height + 'px').style('width', width + 'px');
  // 3. tell scrollama to update new element dimensions
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
    renderBar(defaults.dataset, id, scrollConfig[response.index]);
  } else if (response.index === 2) {
    // console.log('the defaults are', defaults);
    // renderLines(
    //   defaults.yCol,
    //   defaults.dataset,
    //   defaults.filterVal,
    //   defaults.colorScale,
    //   defaults.geog,
    //   id,
    // );
  } else if (1 < response.index && response.index < 8) {
    figure.select('p').text('linessrc' + (response.index - 1));
  } else {
    var dataset = myData.renew;
    figure.select('p').text('linesrenew' + (response.index - 7));
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
      yCol: 'gen_mwh',
      dataset: source,
      filterVal: 'src',
      colorScale: srcColors,
      geog: 'United States',
    };
    console.log('in the promise...defaults:', defaults);

    //Build the Axes/Chart Body
    buildContainers('#scrollfig', xLab);

    // Generate the scroll and the interactive dropdowns
    scroll();
    buildContainers('#bar', xLab);
    test(source, '#bar', 1990);
    uxDynamic(results, '#dynamic', defaults);
  })
  .catch((e) => {
    console.log(e);
  });

function test(dataset, figID, year) {
  renderBar(dataset, figID, year);
}

//
//
//Bar Chart
function renderBar(dataset, id, year) {
  console.log('...testing...data:', dataset);
  console.log('...testing...id:', id);
  // buildContainers(id, 'Source');

  const loc = filter_geog(dataset, 'United States');
  const cat = get_cats(loc, 'src');
  console.log('...testing... loc:', loc);

  const barData = barFilter(loc, 'src', 'gen_mwh', 'year', year);
  const remapped = Object.entries(barData).map(([x, y]) => ({x, y}));
  console.log('... the data for my bars is', barData);
  console.log('...and remapped it is:', remapped);

  // Make the Domains and Scales
  const xDomain = Object.keys(barData);
  const yDomain = extent(remapped, (d) => d.y);
  console.log(xDomain, yDomain);

  const xScale = scaleBand().domain(xDomain).range([0, plotWidth]);
  const yScale = scaleLinear().domain([0, yDomain[1]]).range([0, plotHeight]);

  var xLab = select(id).select('.axisLabelX');
  var chart = select(id).select('.chart');
  var legend = select(id).select('.legend');
  var plotContainer = select(id).select('.plotContainer');

  plotContainer
    .selectAll('rect')
    .data(remapped)
    .join('rect')
    .attr('class', (d) => d.x)
    .attr('x', (d) => xScale(d.x) + 5)
    .attr('y', (d) => plotHeight - yScale(d.y))
    .attr('height', (d) => yScale(d.y))
    .attr('width', xScale.bandwidth() - 10)
    .attr('fill', (d) => srcColors(d.x));

  chart.select('.axisContainerX').call(axisBottom(xScale));
  chart.select('.axisContainerY').call(
    axisLeft(yScale.range([plotHeight, 0]))
      .ticks(5)
      .tickSizeOuter(0)
      .tickFormat(format('.2s')),
  );

  xLab.select('text').text('Source');
  createLegend(barData, srcColors, legend);
}

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
      renderLines(yCol, dataset, filterVal, colorScale, geog, id);
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
      renderLines(yCol, dataset, filterVal, colorScale, geog, id);
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
      renderLines(yCol, dataset, filterVal, colorScale, geog, id);
    })
    .selectAll('option')
    .data((dim) => geogs_vars.map((state) => ({state, dim})))
    .join('option')
    .text((d) => d['state'])
    .property('selected', (d) =>
      d.dim === 'Geography' ? d['state'] === geog : d['state'] === geog,
    );

  // Containers for the Plot
  buildContainers(id, xLab);
  // Lines Inside the Containers
  console.log('but the id is here, right?', id);
  renderLines(yCol, dataset, filterVal, colorScale, geog, id);
}

function buildContainers(id, xLab) {
  const chart = select(id)
    .append('svg')
    .attr('class', 'chart')
    .attr('height', height)
    .attr('width', width);
  // .append('g')
  // .attr('class', 'chartContainer')
  // .attr('transform', `translate(0, ${margin.top})`);

  const axisContainerX = chart
    .append('g')
    .attr('class', 'axisContainerX')
    .attr('transform', `translate(${margin.left}, ${plotHeight + margin.top})`);

  const axisLabelX = chart
    .append('g')
    .attr('class', 'axisLabelX')
    .attr(
      'transform',
      `translate(${plotWidth / 2 + margin.left}, ${
        plotHeight + margin.top + margin.bottom * 0.6
      })`,
    )
    .append('text')
    .attr('text-anchor', 'middle')
    .text(xLab);

  const axisContainerY = chart
    .append('g')
    .attr('class', 'axisContainerY')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  const axisLabelY = chart
    .append('g')
    .attr('class', 'axisLabelY')
    .attr(
      'transform',
      `translate(${margin.left / 2}, ${plotHeight / 2 + margin.top})`,
    )
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .text('Energy Generation (MWH)');

  const plotContainer = chart
    .append('g')
    .attr('class', 'plotContainer')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  const legend = select(id)
    .append('svg')
    .attr('class', 'legend')
    .attr('height', height)
    .attr('width', plotWidth / 4)
    .append('g')
    .attr('class', 'legendContainer')
    .attr('transform', `translate(0, ${height / 3.5})`);
  const legRects = legend.append('g').attr('class', 'legRects');
  const legText = legend.append('g').attr('class', 'legText');
}

function renderLines(variable, dataset, filterVal, colorScale, place, id) {
  // const [axisContainerX, axisContainerY, plotContainer, legend] = pieces;
  const t = transition().duration();

  console.log('hi from the render');
  console.log('in the render, the id is', id);

  var chart = select(id).select('.chart');
  var legend = select(id).select('.legend');
  var plotContainer = select(id).select('.plotContainer');

  const loc = filter_geog(dataset, place);
  const cat = get_cats(loc, filterVal);

  // Domains and Scales
  const xDomain = extent(loc, (d) => d[xCol]);
  const yDomain = extent(loc, (d) => d[variable]);
  console.log(xDomain, yDomain);

  const xScale = scaleLinear().domain(xDomain).range([0, plotWidth]);
  const yScale = scaleLinear().domain([0, yDomain[1]]).range([plotHeight, 0]);

  const lineScale = line()
    .x((d) => xScale(d[xCol]))
    .y((d) => yScale(d[variable]));

  // Build the Plot
  const lineContainer = plotContainer
    .selectAll('path')
    .data(Object.values(cat))
    .join(
      (enter) =>
        enter
          .append('path')
          .attr('d', (d) => lineScale(d))
          .attr('stroke', (d) => colorScale(get_color(d, filterVal))),

      (update) =>
        update.call((el) =>
          el
            .transition(t)
            .attr('d', (d) => lineScale(d))
            .attr('stroke', (d) => colorScale(get_color(d, filterVal))),
        ),
    )
    .attr('stroke-width', 2)
    .attr('fill', 'none');

  // Build the Axes and Legend
  chart
    .select('.axisContainerX')
    .call(
      axisBottom(xScale)
        .tickValues([1990, 2000, 2010, 2019])
        .tickFormat(format('0')),
    );
  chart
    .select('.axisContainerY')
    .call(axisLeft(yScale).ticks(5).tickSizeOuter(0).tickFormat(format('.2s')));
  createLegend(cat, colorScale, legend);
}

function createLegend(dataset, colorScale, legend) {
  const t = transition().duration();
  const legVars = Object.keys(dataset);
  const legRects = legend.select('.legRects');
  const legText = legend.select('.legText');

  legRects
    .selectAll('rect')
    .data(legVars)
    .join(
      (enter) =>
        enter
          .append('rect')
          .attr('height', '12px')
          .attr('width', '12px')
          .attr('fill', (d) => colorScale(d))
          .attr('transform', (_, idx) => `translate(0, ${idx * 18})`),
      (update) =>
        update.call((el) =>
          el
            .transition(t)
            .attr('height', '12px')
            .attr('width', '12px')
            .attr('fill', (d) => colorScale(d))
            .attr('transform', (_, idx) => `translate(0, ${idx * 18})`),
        ),
    );
  legText
    .selectAll('text')
    .data(legVars)
    .join(
      (enter) =>
        enter
          .append('text')
          .text((d) => d)
          .attr('class', 'label')
          .attr('transform', (_, idx) => `translate(18, ${idx * 18 + 12})`),
      (update) =>
        update.call((el) =>
          el
            .transition(t)
            .text((d) => d)
            .attr('class', 'label')
            .attr('transform', (_, idx) => `translate(18, ${idx * 18 + 12})`),
        ),
    );
}
