// example of how to export functions
// this particular util only doubles a value so it shouldn't be too useful
export function myExampleUtil(x) {
  return x * 2;
}

export function filter_data(dataset, key) {
  return dataset.filter((x) => x['state'] === key);
}

export function get_cats(dataset, key) {
  return dataset.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] || []).concat(row);
    return acc;
  }, {});
}

export function get_single_cat(dataset, key) {
  return dataset.reduce((acc, row) => {
    return acc;
  }, '');
}
