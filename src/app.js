// if the data you are going to import is small, then you can import it using es6 import
// import MY_DATA from './app/data/example.json'

import {filter_geog, get_color} from './utils';
import {get_cats} from './utils';
import {json} from 'd3-fetch';
import {select} from 'd3-selection';
import {nest} from 'd3-collection';
import {scaleLinear, scaleOrdinal, scaleTime} from 'd3-scale';
import {extent} from 'd3-array';
import {line} from 'd3-shape';
import {axisLeft, axisBottom, tickFormat} from 'd3-axis';
import {format} from 'd3-format';
import {transition} from 'd3-transition';
// this command imports the css file, if you remove it your css wont be applied!
import './main.css';

// THIS LOADS THE WHOLE LARGE DATASET - DONT USE THIS
// fetch('../data/data.json')
//   .then((response) => response.json())
//   .then((data) => myVis(data))
//   .catch((e) => {
//     console.log(e);
//   });

Promise.all(
  [
    './data/emissions.json', //a
    './data/renewables.json', //b
    './data/source.json',
  ].map((url) => fetch(url).then((x) => x.json())),
)
  .then((results) => {
    const [emissions, renewables, source] = results;
    myVis([emissions, renewables, source]);
  })
  .catch((e) => {
    console.log(e);
  });

// Data Constants
const xCol = 'year';

// Set up Plot Constants
const width = 600;
const height = (24 / 36) * width;
const margin = {top: 30, bottom: 30, right: 80, left: 20};
const plotHeight = height - margin.top - margin.bottom;
const plotWidth = width - margin.left - margin.right;

// Plotting Function
function myVis(data) {
  const [emissions, renewables, source] = data;
  console.log(plotHeight, plotWidth);
  console.log(data);

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
  // const emitColors = scaleOrdinal().range(['#525951']);

  // DEFAULTS:
  var yCol = 'gen_mwh';
  var geog = 'United States';
  var dataset = source;
  var filterVal = 'src';
  var colorScale = srcColors;

  //CREATE A CONSTANT OF ALL THE STATES FOR THE STATE DROPDOWN
  const dd_inputs = {
    blah: 'blah',
    // UNCLEAR IF I NEED THIS? Would be nice to abstract it all eventually to a single function that takes in this thing, and can access all the other attributes (datasets, columns, colorscales)
  };

  const measures = {
    Total: 'gen_mwh',
    'Per Capita': 'mwh_pp',
  };
  const measures_vars = Object.keys(measures);
  const datasets = {
    'Energy Generation by Source': [source, 'src', srcColors],
    'Energy Generation by Renewables': [renewables, 'renew', renewColors],
    // 'CO2 Emissions': emissions,
  };
  const datasets_vars = Object.keys(datasets);
  // UNIQUES FROM THIS SOURCE https://codeburst.io/javascript-array-distinct-5edc93501dc4
  const geogs_vars = [...new Set(emissions.map((row) => row['state']))];

  // Measurement Dropdown
  const measures_dd = select('#ux')
    .append('div')
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
      renderLines(yCol, dataset, filterVal, colorScale, geog);
    })
    .selectAll('option')
    .data((dim) => measures_vars.map((measurement) => ({measurement, dim})))
    .join('option')
    .text((d) => d.measurement)
    .property('selected', (d) => d.measurement === yCol);

  // Dataset Dropdown
  const dataset_dd = select('#ux')
    .append('div')
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
      renderLines(yCol, dataset, filterVal, colorScale, geog);
    })
    .selectAll('option')
    .data((dim) => datasets_vars.map((dataset) => ({dataset, dim})))
    .join('option')
    .text((d) => d.dataset)
    .property('selected', (d) => d.dataset === dataset);

  // Geography Dropdown
  const geog_dd = select('#ux')
    .append('div')
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
      renderLines(yCol, dataset, filterVal, colorScale, geog);
    })
    .selectAll('option')
    .data((dim) => geogs_vars.map((state) => ({state, dim})))
    .join('option')
    .text((d) => d['state'])
    .property('selected', (d) =>
      d.dim === 'Geography' ? d['state'] === geog : d['state'] === geog,
    );

  // Containers for the Plot
  const chart = select('#dynamic')
    .append('svg')
    .attr('class', 'chart')
    .attr('height', height + 20)
    .attr('width', width + 20)
    .append('g')
    .attr('class', 'chartContainer')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  const axisContainerX = chart
    .append('g')
    .attr('class', 'axisContainerX')
    .attr('transform', `translate(${margin.left}, ${plotHeight})`);
  const axisContainerY = chart
    .append('g')
    .attr('class', 'axisContainerY')
    .attr('transform', `translate(${margin.left}, 0)`);

  const plotContainer = chart
    .append('g')
    .attr('class', 'plotContainer')
    .attr('transform', `translate(${margin.left}, 0)`);

  const legend = select('#dynamic')
    .append('svg')
    .attr('class', 'legend')
    .attr('height', height + 20)
    .attr('width', plotWidth / 4)
    .append('g')
    .attr('class', 'legendContainer')
    .attr('transform', `translate(15, ${height / 3.5})`);

  const legRects = legend.append('g').attr('class', 'legRects');
  const legText = legend.append('g').attr('class', 'legText');

  // NESTED LINES (Make this a separate function with the arguments = the dataset and the colorscale)
  // THESE CONSTANTS WILL NEED TO BE DYNAMIC TO THE DROPDOWNS
  function renderLines(variable, dataset, filterVal, colorScale, place) {
    // console.log(dataset);
    console.log('In the render, the dataset is', dataset);
    console.log('In the render, the filterVal is', filterVal);
    console.log('In the render, the place is', place);
    console.log('in the render, the var is', variable);

    const loc = filter_geog(dataset, place);
    console.log('in the render, I did get filtered data', loc);

    const cat = get_cats(loc, filterVal);

    // Domains and Scales WILL ALSO NEED TO BE DYNAMIC TO DROPDOWNS
    const xDomain = extent(loc, (d) => d[xCol]);
    const yDomain = extent(loc, (d) => d[variable]);
    console.log(xDomain, yDomain);

    const xScale = scaleLinear().domain(xDomain).range([0, plotWidth]);
    const yScale = scaleLinear().domain([0, yDomain[1]]).range([plotHeight, 0]);

    const lineScale = line()
      .x((d) => xScale(d[xCol]))
      .y((d) => yScale(d[variable]));

    const lineContainer = plotContainer
      .selectAll('path')
      .data(Object.values(cat))
      .join('path')
      .attr('d', (d) => lineScale(d))
      .attr('stroke', (d) => colorScale(get_color(d, filterVal)))
      .attr('fill', 'none');

    // Generate the Vis in SVG
    axisContainerX.call(axisBottom(xScale).tickFormat(format('0')));
    axisContainerY.call(axisLeft(yScale).tickFormat(format('.2s')));

    // LEGENDS AND LABELS WILL HAVE TO BE DYNAMIC AS WELL
    createLegend(cat, colorScale, legend);
    labelChart(cat);
  }
  renderLines(yCol, dataset, filterVal, colorScale, geog);
}

const legConfigs = {};
function createLegend(dataset, colorScale, legend) {
  const legVars = Object.keys(dataset);
  const legRects = legend.select('.legRects');
  const legText = legend.select('.legText');
  legRects
    .selectAll('rect')
    .data(legVars)
    .join('rect')
    .attr('height', '10px')
    .attr('width', '10px')
    .attr('fill', (d) => colorScale(d))
    .attr('transform', (_, idx) => `translate(0, ${idx * 15})`);

  legText
    .selectAll('text')
    .data(legVars)
    .join('text')
    .text((d) => d)
    .attr('class', 'label')
    .attr('transform', (_, idx) => `translate(18, ${idx * 15 + 9})`);
}

function labelChart(dataset) {
  console.log('hi');
}
