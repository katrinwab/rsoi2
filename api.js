var MagazineModel       = require('./db/mongoose').MagazineModel;
var PublishingHouseModel = require('./db/mongoose').PublishingHouseModel;

exports.getAllMagazines = function(req, res) {
    MagazineModel.find(function (err, magazine) {
        var pageSize = 3,
            pageCount = parseInt(magazine.length / pageSize, 10),
            currentPage = 1,
            magazinesArrays = [];

        if (magazine.length % pageSize != 0)
            pageCount++;

        while (magazine.length > 0) {
            magazinesArrays.push(magazine.splice(0, pageSize));
        }

        if (typeof req.query.page !== 'undefined') {
            currentPage = +req.query.page;
        }

        var magazinesList = magazinesArrays[+currentPage - 1];
        if (!err) {
            res.render('pagination', {
                magazines: magazinesList,
                pageCount: pageCount,
                currentPage: currentPage
            });
        } else {
            res.statusCode = 500;
            return res.send({error: 'Ошибка сервера'});
        }
    });
}

exports.findMagazine = function(req, res) {
    return MagazineModel.findOne({name : req.params.name}, function (err, magazine) {
        if(!magazine) {
            res.statusCode = 404;
            return res.send({ error: 'Страница не найдена'});
        }
        if (!err) {
            return res.send({ status: 'OK', magazine:magazine });
        } else {
            res.statusCode = 500;
            return res.send({ error: 'Ошибка сервера' });
        }
    });
}

exports.changeDescription = function (req, res){
    return MagazineModel.findOne({name : req.params.name}, function (err, magazine) {
        if(!magazine) {
            res.statusCode = 404;
            return res.send({ error: 'Страница не найдена' });
        }

        magazine.description = req.query.description;
        return magazine.save(function (err) {
            if (!err) {
                return res.send({ status: 'OK', magazine:magazine });
            } else {
                if(err.name == 'ValidationError') {
                    res.statusCode = 400;
                    res.send({ error: 'Ошибка при внесении изменений' });
                } else {
                    res.statusCode = 500;
                    res.send({ error: 'Ошибка сервера' });
                }
            }
        });
    });
}

exports.deleteMagazine = function (req, res){
    return MagazineModel.findOne({name : req.params.name}, function (err, magazine) {
        if(!magazine) {
            res.statusCode = 404;
            return res.send({ error: 'Страница не найдена' });
        }
        return magazine.remove(function (err) {
            if (!err) {
                return res.send({ status: 'OK' });
            } else {
                res.statusCode = 500;
                return res.send({ error: 'Ошибка сервера' });
            }
        });
    });
}

exports.addNewMagazine = function (req, res){
    if (!req.isAuthenticated()) {
        res.statusCode = 401;
        return res.send({ error: 'Доступ запрещен' });
    }
    else {
        return PublishingHouseModel.findOne({users: req.user.username}, function (err, house) {
            if (!house) {
                res.statusCode = 404;
                return res.send({error: 'Для этого пользователя издательский дом не найден'});
            }
            house.magazines.push(req.query.nameMagazine);
            house.save(function(err, user) {
                if(err) {
                    res.statusCode = 500;
                    return res.send({error: 'Ошибка сервера'});
                }
            });
            var magazine = new MagazineModel({ name: req.query.nameMagazine, pubHouseName: house.name});
            magazine.save(function(err, user) {
                if (!err) {
                    return res.send({ status: 'OK' });
                } else {
                    res.statusCode = 500;
                    return res.send({ error: 'Ошибка сервера' });
                }
            });
        });
    }
}