const passport = require('passport')
const GitHubApi = require('github')
const {ensureAuthenticated} = require('./helpers')

const github = new GitHubApi()

async function getRepos (robot, appInstallations, uid) {
  return Promise.all(appInstallations.map(async installation => {
    const gh = await robot.auth(installation.id)
    return gh.paginate(gh.apps.getInstallationRepositories({ user_id: uid }), res => res.data)
  }))
}

module.exports = (robot, app, log) => {
  app.get('/webhooks/logs', ensureAuthenticated, async (req, res) => {
    const user = { username: req.user.username, photos: req.user.photos }
    github.authenticate({
      type: 'token',
      token: req.user.token
    })
    const insts = await github.users.getInstallations({})
    if (insts.data.total_count === 0) {
      return res.json({ log: [], user })
    }

    const APP_ID = parseInt(process.env.APP_ID, 10)
    const appInstallations = insts.data.installations.filter(inst => inst.app_id === APP_ID)
    const data = await getRepos(robot, appInstallations, req.user.id)
    const repos = [].concat.apply([], data)

    const filtered = Array.from(log.values())
      .filter(v => v.payload.repository)
      .filter(v => repos.some(page => page.repositories.some(repo => repo.id === v.payload.repository.id)))

    return res.json({ log: filtered, user })
  })

  app.post('/webhooks/logs/:id', ensureAuthenticated, (req, res) => {
    const event = log.get(req.params.id)
    robot.receive(event)
  })

  // Passport authentication routes
  const strat = { successRedirect: '/', failureRedirect: '/probot/login' }
  app.get('/probot/login', passport.authenticate('github', strat))
  app.get('/probot/login/cb', passport.authenticate('github', strat), (req, res) => {
    res.redirect('/')
  })
}
