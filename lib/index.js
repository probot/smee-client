const createServer = require('./server')

const app = createServer()

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Listening at http://localhost:' + listener.address().port)
})
