var express = require('express')
  , passport = require('passport')
  , site = require('./site')
  , oauth2 = require('./oauth2')
  , util = require('util')
  , request = require('request')
  , MagazineModel = require('./db/mongoose').MagazineModel
  , PublishingHouseModel = require('./db/mongoose').PublishingHouseModel

var methodOverride  = require('method-override');
var log             = require('./db/log')(module);
var fs              = require('fs');
  
var app = express.createServer();
app.set('view engine', 'ejs');
app.use(express.logger());
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
app.use(app.router);
app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

require('./auth');

app.get('/mainHTML', function(req, res) {
    file = fs.readFileSync('mainHTML.html');
    res.end(file);

})

app.get('/main', site.index);
app.get('/',function(req,res){
    var code = req.query.code;
    if (code) {
        res.redirect('http://localhost:3000/dialog/authorize?code='+code);
    }
    else {
        res.redirect('http://localhost:3000/main');
    }
});

app.get('/login', site.loginForm);
app.get('/signup', site.authForm);
app.post('/login', site.login);
app.post('/signup', site.signup);
app.get('/logout', site.logout);
app.get('/account', site.account);


app.get('/dialog/authorize',function(req,res){
    var code = req.query.code;
    if (!code)
        res.redirect('http://localhost:3000/dialog/authorize/code?response_type=code&client_id=first&redirect_uri=/');
    else {
        var str = '&code' + code;
        res.redirect('http://localhost:3000/dialog/authorize/token?response_type=token&client_id=first&client_secret=abc123456&redirect_uri=/'+str);
    }
});

app.get('/dialog/authorize/code', oauth2.authorization);
app.get('/dialog/authorize/token', oauth2.authorization);
app.post('/dialog/authorize/decision', oauth2.decision);

app.post('/oauth/token', oauth2.token);

app.get('/api/magazines', function(req, res) {
    MagazineModel.find( function(err, magazine) {
        var magazineCount = magazine.length,
            pageSize = 3,
            pageCount = parseInt(magazine.length/3, 10)+ 1,
            currentPage = 1,
            magazinesArrays = [];

        while (magazine.length > 0) {
            magazinesArrays.push(magazine.splice(0, pageSize));
        }

        if (typeof req.query.page !== 'undefined') {
            currentPage = +req.query.page;
        }

        var magazinesList = magazinesArrays[+currentPage - 1];
        if (!err) {
            res.render('allMagazines', {
                magazines: magazinesList,
                pageSize: pageSize,
                totalStudents: magazineCount,
                pageCount: pageCount,
                currentPage: currentPage
            });
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});


app.get('/api/magazine/:name?', function(req, res) {
    return MagazineModel.findOne({name : req.params.name}, function (err, magazine) {
        if(!magazine) {
            res.statusCode = 404;
            return res.send({ error: 'Not found'});
        }
        if (!err) {
            return res.send({ status: 'OK', magazine:magazine });
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.put('/test/magazine/:name?', function (req, res) {
    var request = require('request');
    request({
        url: 'http://localhost:3000/api/magazine/'+ req.params.name + '?_method=PUT' + '&description=' + req.body.description,
        method: "POST",
        headers: {"content-type": "application/json", "Authorization": 'Token ' + req.cookies.token}},
        function (error, response, body) {
            res.send(body);
        }
    );
})

app.put('/api/magazine/:name?', passport.authenticate('http-header-token', { session: false }), function (req, res){
    return MagazineModel.findOne({name : req.params.name}, function (err, magazine) {
        if(!magazine) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }

        magazine.description = req.query.description;
        return magazine.save(function (err) {
            if (!err) {
                log.info("magazine updated");
                return res.send({ status: 'OK', magazine:magazine });
            } else {
                if(err.name == 'ValidationError') {
                    res.statusCode = 400;
                    res.send({ error: 'Validation error' });
                } else {
                    res.statusCode = 500;
                    res.send({ error: 'Server error' });
                }
                log.error('Internal error(%d): %s',res.statusCode,err.message);
            }
        });
    });
});

app.delete('/test/magazine/:name?', function (req, res) {
    var request = require('request');
    request({
            url: 'http://localhost:3000/api/magazine/'+ req.params.name +'?_method=DELETE&name=' ,
            method: "POST",
            headers: {"content-type": "application/json", "Authorization": 'Token ' + req.cookies.token}},
        function (error, response, body) {
            res.send(body);
        }
    );
})

app.delete('/api/magazine/:name?', passport.authenticate('http-header-token', { session: false }), function (req, res){
    return MagazineModel.findOne({name : req.params.name}, function (err, magazine) {
        if(!magazine) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        return magazine.remove(function (err) {
            if (!err) {
                log.info("magazine removed");
                return res.send({ status: 'OK' });
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s',res.statusCode,err.message);
                return res.send({ error: 'Server error' });
            }
        });
    });
});

app.post('/test/publishingHouse', function (req, res) {
    var request = require('request');
    request({
            url: 'http://localhost:3000/api/publishingHouse?nameMagazine=' + req.body.nameMagazine,
            method: "POST",
            headers: {"content-type": "application/json", "Authorization": 'Token ' + req.cookies.token}},
        function (error, response, body) {
            res.send(body);
        }
    );
})

app.post('/api/publishingHouse', passport.authenticate('http-header-token', { session: false }), function (req, res){
    if (!req.isAuthenticated()) {
        res.statusCode = 401;
        log.error('Ошибка(%d): %s',res.statusCode,"Доступ запрещен");
        return res.send({ error: 'Доступ запрещен' });
    }
    else {
        return PublishingHouseModel.findOne({users: req.user.username}, function (err, house) {
            if (!house) {
                res.statusCode = 404;
                return res.send({error: 'Для этого пользователя издательский дом не найден'});
            }
            house.magazines.push(req.query.nameMagazine);
            var magazine = new MagazineModel({ name: req.query.nameMagazine, pubHouseName: house.name});
            magazine.save(function(err, user) {
                if(err) return log.error(err);
                else log.info("New magazine - %s:%s",magazine.name, magazine.pubHouseName);
                return res.send({status: 'OK'});
            });
        });
    }
});

app.listen(3000);
