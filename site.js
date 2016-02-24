var passport = require('passport')
  , login = require('connect-ensure-login')
  , UserModel = require('./db/mongoose').UserModel
  , PublishingHouseModel = require('./db/mongoose').PublishingHouseModel
  , fs = require('fs');


exports.index = function(req, res) {
    var username = "";
    if (req.isAuthenticated())
      username = req.user.username;

      var ejs = require('ejs'),
          templateString = fs.readFileSync(__dirname + '/views/user.ejs', 'utf-8'),
          html = ejs.render(templateString, {username : username}),
          file = fs.readFileSync(__dirname + '/public/mainHTML.html');
      res.end(html + file);
};

exports.loginForm = function(req, res) {
  res.render('login', {message: req.flash('error')});
};

exports.authForm = function(req, res) {
  PublishingHouseModel.find(function (err, publishHouse) {
    if (!err) {
      res.render('auth', { publishHouse: publishHouse });
    } else {
      res.statusCode = 500;
      return res.send({error: 'Ошибка сервера'});
    }
  })
};

exports.signup = function(req, res) {
  UserModel.findOne({username: req.body.username}, function (err, user) {
    if(user) {
      res.statusCode = 422;
      return res.send({ error: 'Пользователь с таким именем уже существует' });
    } else {
      var user = new UserModel({ username: req.body.username, password: req.body.password });

      PublishingHouseModel.findOne({name: req.body.selectHouse}, function (err, house) {
        if (err) {
          res.statusCode = 500;
          return res.send({error: 'Ошибка сервера'});
        } else {
          house.users.push(req.body.username);
          house.save(function(err, user) {
            if(err) {
              res.statusCode = 500;
              return res.send({error: 'Ошибка сервера'});
            }
          });
          user.save(function(err, user) {
            if(err) {
              res.statusCode = 500;
              return res.send({error: 'Ошибка сервера'});
            }
          });
        }
      })
      res.statusCode = 200;
      return res.send({status: 'Пользователь сохранен'});
    }
  })
};

exports.login =
    passport.authenticate('local', { successReturnToOrRedirect: '/account', failureRedirect: '/login', failureFlash: true });

exports.logout = function(req, res) {
  req.logout();
  res.statusCode = 200;
  return res.send({status: 'OK'});
}

exports.account = [
  function(req, res) {
    if (req.isAuthenticated())
      res.render('account', { user: req.user });
    else {
      res.statusCode = 401;
      res.send({ error: 'Доступ запрещен' });
    }
  }
]
