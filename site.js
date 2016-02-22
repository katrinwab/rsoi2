var passport = require('passport')
  , login = require('connect-ensure-login')
  , log = require('./db/log')(module)
  , UserModel = require('./db/mongoose').UserModel
  , AccessTokenModel = require('./db/mongoose').AccessTokenModel


exports.index = function(req, res) {
    var username = "";
  if (req.isAuthenticated())
    username = req.user.username;
    AccessTokenModel.findOne({username: username}, function (err, token) {
      if (token)
        res.cookie('token', token.token);
      res.render('main');
    })
};

exports.loginForm = function(req, res) {
  res.render('login', {message: req.flash('error')});
};

exports.authForm = function(req, res) {
  res.render('auth');
};

exports.signup = function(req, res) {
  UserModel.findOne({username: req.body.username}, function (err, user) {
    if(user) {
      res.statusCode = 422;
      return res.send({ error: 'Пользователь с таким именем уже существует' });
    } else {
      var user = new UserModel({ username: req.body.username, password: req.body.password });
      user.save(function(err, user) {
        if(err) return log.error(err);
      });
      res.redirect('http://localhost:3000/main');
    }
  })
};

exports.login =
    passport.authenticate('local', { successReturnToOrRedirect: '/account', failureRedirect: '/login', failureFlash: true });

exports.logout = function(req, res) {
  req.logout();
  res.redirect('/');
}

exports.account = [
  function(req, res) {
    if (req.isAuthenticated())
      res.render('account', { user: req.user });
    else {
      res.statusCode = 401;
      return res.send({ error: 'Доступ запрещен' });
    }
  }
]
