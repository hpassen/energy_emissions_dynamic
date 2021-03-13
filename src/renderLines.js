import {filter_geog, get_color} from './utils';
import {get_cats} from './utils';
import {json} from 'd3-fetch';
import {select, selectAll} from 'd3-selection';
import {scaleLinear, scaleOrdinal} from 'd3-scale';
import {extent} from 'd3-array';
import {line} from 'd3-shape';
import {axisLeft, axisBottom, tickFormat} from 'd3-axis';
import {format} from 'd3-format';
import {transition} from 'd3-transition';

export function renderLines(
  variable,
  dataset,
  filterVal,
  colorScale,
  place,
  id,
) {
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
