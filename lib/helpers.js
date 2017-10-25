exports.mapToObj = map => {
  let obj = Object.create(null)
  for (let [k, v] of map) {
    obj[k] = v
  }
  return obj
}
