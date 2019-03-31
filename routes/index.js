var express = require('express');
var router = express.Router();
const Storage = require('@google-cloud/storage');

const Sequelize = require('sequelize');
const config = require("./../config/config.json");
const sequelize = new Sequelize(config.dbName, config.userName, config.password , {
	host: config.host,
	dialect: 'mysql',
	pool: {
		max: 5,
		min: 0,
		acquire: 30000,
		idle: 10000
	}
});
sequelize
.authenticate()
.then(() => {
	console.log('Connection has been established successfully.');
})
.catch(err => {
	console.error('Unable to connect to the database:', err);
});
//Models
const GoogleAccounts = sequelize.define('GoogleAccounts', {
	id: {
		type : Sequelize.STRING,
		primaryKey: true,
		autoIncrement: true,
	},
	name: Sequelize.STRING,
	bucketName: Sequelize.STRING,
	fileName: Sequelize.STRING,
	type : Sequelize.STRING
}, {
	tableName: 'storage',
	timestamps: false
});



router.get('/addWordpress', function(req, res, next) {

	res.render('index', { title: 'Express' });

});

router.post('/addGoogleAccounts', function(req, res, next) {

	GoogleAccounts
	.create({
		id: null,
		name: req.body.storageName,
		bucketName: req.body.bucketName,
		fileName: req.body.uploadedFileName, 
		type : req.body.storageType
	})
	.then(function(err, GoogleAccounts) {
		if (err) {
			res.json(err);
		} else {
			res.json(GoogleAccounts);
		}
	});

});

router.get('/getGoogleAccounts', function(req, res, next) {

	GoogleAccounts
	.findAll({
		attributes: ['id', 'name', 'bucketName', 'fileName', 'type']
	})
	.then(function(err, GoogleAccounts) {
		if (err) {
			res.json(err);
		} else {
			res.json(GoogleAccounts);
		}
	});

});

var multer  = require('multer')
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'config/');
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});

var upload = multer({ storage: storage });
router.post('/uploadServiceKeys', upload.single('files'), function(req, res, next) {
	res.json({"foo":"bar"});
});

router.get('/refreshStorageFiles', function(req, res, next) {

GoogleAccounts
	.findOne({
		where : {
			id : 13
		}
	})
	.then(function(err, GoogleAccounts) {
		if (err) {
			res.json(err);
		} else {

			
						
			res.json(GoogleAccounts);
		}
	});

});


module.exports = router;
