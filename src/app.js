// if the data you are going to import is small, then you can import it using es6 import
// (I like to use use screaming snake case for imported json)
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
    '../data/emissions.json',
    '../data/renewables.json',
    '../data/source.json',
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
const yCol = 'gen_mwh';

// Set up Plot Constants
const width = 600;
const height = (24 / 36) * width;
const margin = {top: 20, bottom: 20, right: 20, left: 20};
const plotHeight = height - margin.top - margin.bottom;
const plotWidth = width - margin.left - margin.right;

// Plotting Function
function myVis(data) {
  const [emissions, renewables, source] = data;
  console.log(plotHeight, plotWidth);
  console.log(data);

  // THESE CONSTANTS WILL NEED TO BE DYNAMIC TO THE DROPDOWNS
  const tx = filter_geog(source, 'Texas');
  const cat = get_cats(tx, 'src');
  console.log(cat);

  // Domains and Scales WILL ALSO NEED TO BE DYNAMIC TO DROPDOWNS
  const xDomain = extent(tx, (d) => d[xCol]);
  const yDomain = extent(tx, (d) => d[yCol]);
  console.log(xDomain, yDomain);

  const xScale = scaleLinear().domain(xDomain).range([0, plotWidth]);
  const yScale = scaleLinear().domain([0, yDomain[1]]).range([plotHeight, 0]);

  const lineScale = line()
    .x((d) => xScale(d[xCol]))
    .y((d) => yScale(d[yCol]));

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
  const emitColors = scaleOrdinal().range(['#525951']);

  // Containers for the Plot
  const svg = select('#interact')
    .append('svg')
    .attr('height', height)
    .attr('width', width)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  const axisContainerX = svg
    .append('g')
    .attr('class', 'axisContainerX')
    .attr('transform', `translate(${margin.left}, ${plotHeight})`);
  const axisContainerY = svg
    .append('g')
    .attr('class', 'axisContainerY')
    .attr('transform', `translate(${margin.left}, 0)`);

  const plotContainer = svg
    .append('g')
    .attr('class', 'plotContainer')
    .attr('transform', `translate(${margin.left}, 0)`);

  // NESTED LINES (Make this a separate function with the arguments = the dataset and the colorscale)
  const lineContainer = plotContainer
    .selectAll('g.lineContainer')
    .data(Object.values(cat))
    .join('g')
    .attr('class', (d, idx) => Object.keys(cat)[idx]);

  lineContainer
    .selectAll('.line')
    .data((d) => [d])
    .join('path')
    .attr('d', (d) => lineScale(d))
    .attr('stroke', (d) => srcColors(get_color(d)))
    // .attr('stroke', (d) => {
    //   const key = d[0]['src'];
    //   return srcColors(key);
    // })
    .attr('fill', 'none');

  // Generate the Vis in SVG
  axisContainerX.call(axisBottom(xScale).tickFormat(format('0')));
  axisContainerY.call(axisLeft(yScale).tickFormat(format('.2s')));

  // render_lines(dataset, colorscale, column)
}
