var mongoose    = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var log         = require('./log')(module);

mongoose.connect('mongodb://localhost/test1');
var db = mongoose.connection;

db.on('error', function (err) {
    log.error('connection error:', err.message);
});
db.once('open', function callback () {
    log.info("Connected to DB!");
});

var schema = new mongoose.Schema();
schema.plugin(mongoosePaginate);

var Magazine = new mongoose.Schema({
    name: { type: String, required: true },
    pubHouseName: { type: String, required: true },
    description: { type: String, required: false },
    modified: { type: Date, default: Date.now }
});
var MagazineModel = mongoose.model('Magazine', Magazine);
module.exports.MagazineModel = MagazineModel;

var PublishingHouse = new mongoose.Schema({
    name: { type: String, required: true },
    magazines: { type: Array, required: false },
    users: { type: Array, required: false }
});

var PublishingHouseModel = mongoose.model('PublishingHouse', PublishingHouse);

module.exports.PublishingHouseModel = PublishingHouseModel;

var crypto      = require('crypto');

// User
var User = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    hashedPassword: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

User.methods.encryptPassword = function(password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
};

User.virtual('password')
    .set(function(password) {
        this._plainPassword = password;
        this.salt = crypto.randomBytes(32).toString('base64');
        this.hashedPassword = this.encryptPassword(password);
    })
    .get(function() { return this._plainPassword; });


User.methods.checkPassword = function(password) {
    return this.encryptPassword(password) === this.hashedPassword;
};

var UserModel = mongoose.model('User', User);

// Client
var Client = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    clientId: {
        type: String,
        unique: true,
        required: true
    },
    clientSecret: {
        type: String,
        required: true
    }
});

var ClientModel = mongoose.model('Client', Client);

// AccessToken
var AccessToken = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    clientId: {
        type: String,
        required: true
    },
    token: {
        type: String,
        unique: true,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

var AccessTokenModel = mongoose.model('AccessToken', AccessToken);

// Code
var Code = new mongoose.Schema({
    code: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    clientID: {
        type: String,
        required: true
    },
    redirectURI: {
        type: String,
        required: true
    }
});

var CodeModel = mongoose.model('Code', Code);

module.exports.UserModel = UserModel;
module.exports.ClientModel = ClientModel;
module.exports.AccessTokenModel = AccessTokenModel;
module.exports.CodeModel = CodeModel;