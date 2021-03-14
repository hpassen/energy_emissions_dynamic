// Filters a dataset by a key representing some geography
export function filter_geog(dataset, geog) {
  return dataset.filter((x) => x['state'] === geog);
}

// Group the Data by the value of the LINE to plot
export function get_cats(dataset, key) {
  return dataset.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] || []).concat(row);
    return acc;
  }, {});
}

export function get_color(d, col) {
  const key = d[0][col];
  return key;
}

export function barFilter(dataset, barCat, barVar, rowCol, rowVal) {
  return dataset.reduce((acc, row) => {
    if (row[rowCol] === rowVal) {
      acc[row[barCat]] = row[barVar];
    }
    return acc;
  }, {});
}

export function columnHas(data, col, allowedValues) {
  return data.filter((row) => allowedValues.includes(row[col]));
}
