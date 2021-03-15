import {select, selectAll} from 'd3-selection';
import {scaleLinear, scaleBand, scaleOrdinal, scaleThreshold} from 'd3-scale';
import {extent} from 'd3-array';
import {line} from 'd3-shape';
import {axisLeft, axisBottom, tickFormat} from 'd3-axis';
import {format} from 'd3-format';
import {transition} from 'd3-transition';
import {filter_geog, get_color, barFilter, columnHas} from './utils';
import {get_cats} from './utils';

// Set up Chart Sizing Constants
// const width = 600;
// const height = (24 / 36) * width;
// const margin = {top: 60, bottom: 80, right: 30, left: 100};
// const plotHeight = height - margin.top - margin.bottom;
// const plotWidth = width - margin.left - margin.right;

export function buildContainers(id, xLab, sizes) {
  const width = sizes.width;
  const height = sizes.height;
  const margin = sizes.margin;
  const plotHeight = sizes.plotHeight;
  const plotWidth = sizes.plotWidth;

  const chart = select(id)
    .append('svg')
    .attr('class', 'chart')
    .attr('height', height)
    .attr('width', width);

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
        plotHeight + margin.top + margin.bottom * 0.5
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
    .attr('width', 110)
    .append('g')
    .attr('class', 'legendContainer')
    .attr('transform', `translate(0, ${height / 3.5})`);
  const legRects = legend.append('g').attr('class', 'legRects');
  const legText = legend.append('g').attr('class', 'legText');
}

export function renderBar(dataset, id, year, sizes, colors) {
  const t = transition().duration(800);
  const loc = filter_geog(dataset, 'United States');

  const srcColors = colors.src;

  const barData = barFilter(loc, 'src', 'gen_mwh', 'year', year);
  const remapped = Object.entries(barData).map(([x, y]) => ({x, y}));
  console.log('... the data for my bars is', barData);
  console.log('...and remapped it is:', remapped);

  // Make the Domains and Scales
  const xDomain = Object.keys(barData);
  const yDomain = extent(remapped, (d) => d.y);
  console.log(xDomain, yDomain);

  const xScale = scaleBand().domain(xDomain).range([0, sizes.plotWidth]);
  const yScale = scaleLinear()
    .domain([0, yDomain[1]])
    .range([0, sizes.plotHeight]);

  var xLab = select(id).select('.axisLabelX');
  var chart = select(id).select('.chart');
  var legend = select(id).select('.legend');
  var plotContainer = select(id).select('.plotContainer');

  plotContainer
    .selectAll('rect')
    .data(remapped)
    .join(
      (enter) =>
        enter
          .append('rect')
          .attr('class', (d) => d.x)
          .attr('x', (d) => xScale(d.x) + 5)
          .attr('y', (d) => sizes.plotHeight - yScale(d.y))
          .attr('height', (d) => yScale(d.y))
          .attr('width', xScale.bandwidth() - 10)
          .attr('fill', (d) => srcColors(d.x)),
      (update) =>
        update.call((el) =>
          el
            .transition(t)
            .attr('class', (d) => d.x)
            .attr('x', (d) => xScale(d.x) + 5)
            .attr('y', (d) => sizes.plotHeight - yScale(d.y))
            .attr('height', (d) => yScale(d.y))
            .attr('width', xScale.bandwidth() - 10)
            .attr('fill', (d) => srcColors(d.x)),
        ),
    );

  chart
    .select('.axisContainerX')
    .call(axisBottom(xScale).tickSize(0))
    .selectAll('text')
    .attr('x', -10)
    .attr('y', 0)
    .attr('transform', 'rotate(-60)')
    .attr('text-anchor', 'end');
  chart.select('.axisContainerY').call(
    axisLeft(yScale.range([sizes.plotHeight, 0]))
      .ticks(5)
      .tickSizeOuter(0)
      .tickFormat(format('.2s')),
  );
  xLab.select('text').text('Source').style('opacity', 0);
  // createLegend(barData, srcColors, legend);
}

export function renderLines(
  xCol,
  yCol,
  dataset,
  filterVal,
  colorScale,
  place,
  id,
  sizes,
) {
  // const [axisContainerX, axisContainerY, plotContainer, legend] = pieces;
  const t = transition().duration(400);

  console.log('hi from the render');
  console.log('in the render, the id is', id);
  console.log('in the render, the sizes are', sizes);

  var xLab = select(id).select('.axisLabelX');
  var chart = select(id).select('.chart');
  var legend = select(id).select('.legend');
  var plotContainer = select(id).select('.plotContainer');

  const loc = filter_geog(dataset, place);
  const cat = get_cats(loc, filterVal);

  // Domains and Scales
  const xDomain = extent(loc, (d) => d[xCol]);
  const yDomain = extent(loc, (d) => d[yCol]);
  console.log(xDomain, yDomain);

  const xScale = scaleLinear().domain(xDomain).range([0, sizes.plotWidth]);
  const yScale = scaleLinear()
    .domain([0, yDomain[1]])
    .range([sizes.plotHeight, 0]);

  const lineScale = line()
    .x((d) => xScale(d[xCol]))
    .y((d) => yScale(d[yCol]));

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
  xLab.select('text').text('Year').style('opacity', 1);
  createLegend(cat, colorScale, legend);

  // Build the Plot
  const linecontainer = plotContainer
    .selectAll('path')
    .data(Object.values(cat))
    .join(
      (enter) =>
        enter
          .append('path')
          .attr('class', 'line')
          .attr('id', (_, i) => 'line' + i)
          .attr('d', (d) => lineScale(d))
          .attr('stroke', (d) => colorScale(get_color(d, filterVal))),
      // .attr('stroke-dasharray', '1000 1000')
      // .attr('stroke-dashoffset', 0),

      (update) =>
        update.call((el) =>
          el
            .attr('stroke-dasharray', '2000, 2000') //`${sizes.width * 2} ${sizes.width * 2}`)
            .attr('stroke-dashoffset', 2000) //`${sizes.width * 2}`)
            .transition(t)
            .attr('d', (d) => lineScale(d))
            .style('opacity', 1)
            .attr('stroke', (d) => colorScale(get_color(d, filterVal)))

            .attr('stroke-dashoffset', 0),
        ),
    )
    .attr('stroke-width', 2)
    .attr('fill', 'none');
}

//
//
// Legend Creation Function
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
