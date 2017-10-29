exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) { return next() }
  res.json({ loggedIn: false })
}

exports.filterObj = (obj, filter) => {
  let result = {}

  for (let key in obj) {
    if (obj.hasOwnProperty(key) && !filter(obj[key])) {
      result[key] = obj[key]
    }
  }

  return result
}
