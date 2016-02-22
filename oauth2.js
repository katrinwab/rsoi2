var oauth2orize = require('oauth2orize')
  , passport = require('passport')
  , login = require('connect-ensure-login')
  , ClientModel = require('./db/mongoose').ClientModel
  , AuthorizationCode = require('./db/mongoose').CodeModel
  , AccessTokenModel =  require('./db/mongoose').AccessTokenModel
  , UserModel = require('./db/mongoose').UserModel
  , utils = require('./utils');
var log         = require('./db/log')(module);

var server = oauth2orize.createServer();

server.serializeClient(function(client, done) {
    return done(null, client.clientId);
});

server.deserializeClient(function(id, done) {
    ClientModel.findOne({clientId : id}, function(err, client) {
        if (err) { return done(err); }
        return done(null, client);
    });
})


server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
  var codeValue = utils.uid(16)

  var code = new AuthorizationCode({
      code: codeValue,
      clientID: client.clientId,
      username: user.username,
      redirectURI: redirectURI
      });

  code.save(function (err) {
  if (err) { return done(err); }
  done(null, codeValue);
  });

}));

server.grant(oauth2orize.grant.token(function(client, user, ares, done) {
    AccessTokenModel.remove({}, function (err) {
        if (err) return log.error(err);
    });

    var tokenValue = utils.uid(5);

    var token = new AccessTokenModel({ token: tokenValue, clientId: client.clientId, username: user.username });
    token.save(function(err, user) {
        if(err) return log.error(err);
        else log.info("New token - %s", token.username);
        done(null, tokenValue);
    });
}));

server.exchange(oauth2orize.exchange.code(function(client, code, redirectURI, done) {
    log.info("Exchange token %s", code);
  AuthorizationCode.findOne({ code: code }, function(err, authCode) {
    if (err) { return done(err); }
    if (client.clientId !== authCode.clientID) { return done(null, false); }
    if (redirectURI !== authCode.redirectURI) { return done(null, false); }
    
    var tokenValue = utils.uid(5)
    var token = new AccessTokenModel({ token: tokenValue, clientId: authCode.clientID, username: authCode.username });
    token.save(function (err) {
        if (err) { return done(err); }
        done(null, tokenValue);
    });
  });
}));

server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done) {

    ClientModel.findOne({ clientId: client.clientId} , function(err, localClient) {
        if (err) { return done(err); }
        if(localClient === null) {
            return done(null, false);
        }
        if(localClient.clientSecret !== client.clientSecret) {
            return done(null, false);
        }
        //Validate the user
        UserModel.findOne({username: username}, function(err, user) {
            if (err) { return done(err); }
            if(user === null) {
                return done(null, false);
            }
            if(!user.checkPassword(password)) {
                return done(null, false);
            }
            var tokenValue = utils.uid(5)
            var token = new AccessTokenModel({ token: tokenValue, clientId: client.clientId, username: user.username });
            token.save(function (err) {
                if (err) { return done(err); }
                done(null, tokenValue);
            });
        });
    });
}));

server.exchange(oauth2orize.exchange.clientCredentials(function(client, scope, done) {
    //Validate the client
    ClientModel.findOne({ clientId: client.clientId}, function(err, localClient) {
        if (err) { return done(err); }
        if(localClient === null) {
            return done(null, false);
        }
        if(localClient.clientSecret !== client.clientSecret) {
            return done(null, false);
        }

        var tokenValue = utils.uid(5)
        var token = new AccessTokenModel({ token: tokenValue, clientId: client.clientId, userId: null });
        token.save(function (err) {
            if (err) { return done(err); }
            done(null, tokenValue);
        });
    });
}));

exports.authorization = [
  login.ensureLoggedIn(),
  server.authorization(function(clientID, redirectURI, done) {
      ClientModel.findOne({ clientId: clientID}, function(err, client) {
      if (err) { return done(err); }
      return done(null, client, redirectURI);
    });
  }),
  function(req, res){
    res.render('dialog', { transactionID: req.oauth2.transactionID, user: req.user, client: req.oauth2.client });
  }
]

exports.decision = [
  login.ensureLoggedIn(),
  server.decision()
]

exports.token = [
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  server.token(),
  server.errorHandler()
]
