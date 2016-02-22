var log                 = require('./db/log')(module);
var UserModel           = require('./db/mongoose').UserModel;
var ClientModel         = require('./db/mongoose').ClientModel;
var CodeModel           = require('./db/mongoose').CodeModel;
var AccessTokenModel    = require('./db/mongoose').AccessTokenModel;
var MagazineModel       = require('./db/mongoose').MagazineModel;
var PublishingHouseModel       = require('./db/mongoose').PublishingHouseModel;
var faker               = require('faker');

UserModel.remove({}, function(err) {
    var user = new UserModel({ username: "katrinwab", password: "qwe321" });
    user.save(function(err, user) {
        if(err) return log.error(err);
        else log.info("New user - %s:%s",user.username,user.password);
    });

    for(i=0; i<4; i++) {
        var user = new UserModel({ username: faker.internet.userName(), password: faker.internet.password() });
        user.save(function(err, user) {
            if(err) return log.error(err);
            else log.info("New user - %s:%s",user.username,user.password);
        });
    }
});

ClientModel.remove({}, function(err) {
    var client = new ClientModel({ name: "labRSOI2", clientId: "first", clientSecret:"abc123456" });
    client.save(function(err, client) {
        if(err) return log.error(err);
        else log.info("New client - %s:%s",client.clientId,client.clientSecret);
    });
});
AccessTokenModel.remove({}, function (err) {
    if (err) return log.error(err);
});
CodeModel.remove({}, function (err) {
    if (err) return log.error(err);
});

MagazineModel.remove({}, function(err) {
    var magazine1 = new MagazineModel({ name: "first", pubHouseName: "firstHouse"});
    magazine1.save(function(err, user) {
        if(err) return log.error(err);
        else log.info("New magazine - %s:%s",magazine1.name,magazine1.pubHouseName);
    });

    var magazine2 = new MagazineModel({ name: "first_first", pubHouseName: "firstHouse"});
    magazine2.save(function(err, user) {
        if(err) return log.error(err);
        else log.info("New magazine - %s:%s",magazine2.name,magazine2.pubHouseName);
    });

    var magazine3 = new MagazineModel({ name: "first_first_first", pubHouseName: "firstHouse"});
    magazine3.save(function(err, user) {
        if(err) return log.error(err);
        else log.info("New magazine - %s:%s",magazine3.name,magazine3.pubHouseName);
    });

    var magazine4 = new MagazineModel({ name: "second", pubHouseName: "secondHouse"});
    magazine4.save(function(err, user) {
        if(err) return log.error(err);
        else log.info("New magazine - %s:%s",magazine4.name,magazine4.pubHouseName);
    });

    var magazine5 = new MagazineModel({ name: "third", pubHouseName: "thirdHouse"});
    magazine5.save(function(err, user) {
        if(err) return log.error(err);
        else log.info("New magazine - %s:%s",magazine5.name,magazine5.pubHouseName);
    });
});

PublishingHouseModel.remove({}, function(err) {
    var house1 = new PublishingHouseModel({ name: "firstHouse", magazines: ["first", "first_first", "first_first_first"], users:["katrinwab"]});
    house1.save(function(err, user) {
        if(err) return log.error(err);
        else log.info("New house - %s",house1.name);
    });

    var house2 = new PublishingHouseModel({ name: "secondHouse", magazines: ["second"]});
    house2.save(function(err, user) {
        if(err) return log.error(err);
        else log.info("New house - %s",house2.name);
    });

    var house3 = new PublishingHouseModel({ name: "thirdHouse", magazines: ["third"]});
    house3.save(function(err, user) {
        if(err) return log.error(err);
        else log.info("New house - %s",house3.name);
    });

});
/*setTimeout(function() {
    mongoose.disconnect();
}, 3000);*/