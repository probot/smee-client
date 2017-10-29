const passport = require('passport')
const GitHubStrategy = require('passport-github2').Strategy

passport.use(new GitHubStrategy({
  clientID: process.env.OAUTH_ID,
  clientSecret: process.env.OAUTH_SECRET,
  callbackURL: 'https://probotwebhooks.localtunnel.me/probot/login/cb'
}, (accessToken, refreshToken, profile, cb) => {
  return cb(null, {...profile, token: accessToken})
}))

passport.serializeUser((user, cb) => {
  return cb(null, user)
})

// Deserialize user
passport.deserializeUser((user, cb) => {
  return cb(null, user)
})
