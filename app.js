var express = require('express')
  , passport = require('passport')
  , site = require('./site')
  , oauth2 = require('./oauth2')
  , api = require('./api')
  , util = require('util')
  , request = require('request')
  , methodOverride  = require('method-override')
  , log = require('./db/log')(module);
  
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

app.get('/main', site.index);
app.get('/',function(req,res){
    var code = req.query.code;
    if (code) {
        request
            .post('http://localhost:3000/oauth/token', {form: {grant_type: 'authorization_code', client_id: 'first',
                client_secret: 'abc123456', redirect_uri: '/', code: code}},
                function (err, response, body) {
                    if (err) {
                        res.statusCode = 500;
                        return res.send({error: 'Ошибка сервера'});
                    }
                    var obj = JSON.parse(body);
                    log.info("TOKEN %s!!", obj.access_token);
                    res.cookie('token', obj.access_token);
                    res.statusCode = 200;
                    return res.send({status: 'Token was saved'});
            })
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
    res.redirect('http://localhost:3000/dialog/authorize/code?response_type=code&client_id=first&redirect_uri=/');
});

app.get('/dialog/authorize/code', oauth2.authorization);
app.post('/dialog/authorize/decision', oauth2.decision);

app.post('/oauth/token', oauth2.token);

app.get('/api/magazines', api.getAllMagazines);
app.get('/api/magazine/:name?', api.findMagazine);
app.put('/api/magazine/:name?', passport.authenticate('http-header-token', { session: false }), api.changeDescription);
app.delete('/api/magazine/:name?', passport.authenticate('http-header-token', { session: false }), api.deleteMagazine);
app.post('/api/publishingHouse', passport.authenticate('http-header-token', { session: false }), api.addNewMagazine);

app.put('/test/magazine/:name?', function (req, res) {
    request({
            url: 'http://localhost:3000/api/magazine/'+ req.params.name + '?_method=PUT' + '&description=' + req.body.description,
            method: "POST",
            headers: {"content-type": "application/json", "Authorization": 'Token ' + req.cookies.token}},
        function (error, response, body) {
            res.send(body);
        }
    );
})

app.delete('/test/magazine/:name?', function (req, res) {
    request({
            url: 'http://localhost:3000/api/magazine/'+ req.params.name +'?_method=DELETE&name=' ,
            method: "POST",
            headers: {"content-type": "application/json", "Authorization": 'Token ' + req.cookies.token}},
        function (error, response, body) {
            res.send(body);
        }
    );
})

app.post('/test/publishingHouse', function (req, res) {
    request({
            url: 'http://localhost:3000/api/publishingHouse?nameMagazine=' + req.body.nameMagazine,
            method: "POST",
            headers: {"content-type": "application/json", "Authorization": 'Token ' + req.cookies.token}},
        function (error, response, body) {
            res.send(body);
        }
    );
})

app.listen(3000);
