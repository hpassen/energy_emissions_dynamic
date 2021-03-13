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

export function buildContainers(id) {
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
    .attr('class', 'axisLab')
    .attr(
      'transform',
      `translate(${plotWidth / 2 + margin.left}, ${
        plotHeight + margin.top + margin.bottom * 0.6
      })`,
    )
    .append('text')
    .attr('text-anchor', 'middle')
    .text('Year');

  const axisContainerY = chart
    .append('g')
    .attr('class', 'axisContainerY')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  const axisLabelY = chart
    .append('g')
    .attr('class', 'axisLab')
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
