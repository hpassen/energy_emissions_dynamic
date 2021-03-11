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
