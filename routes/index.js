var express = require('express');
var router = express.Router();
const  Storage  = require('@google-cloud/storage');


const Sequelize = require('sequelize');
const config = require("./../config/config.json");
const sequelize = new Sequelize(config.dbName, config.userName, config.password , {
	host: config.host,
	dialect: 'mysql',
	pool: {
		max: 1000,
		min: 0,
		acquire: 300000,
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

const Files = sequelize.define('Files', {
	id: {
		type : Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	website: Sequelize.STRING,
	hotLinkUrl: Sequelize.STRING,
	bucketName: Sequelize.STRING,
	type : Sequelize.STRING,
	bucketId : Sequelize.INTEGER,
	filename : Sequelize.STRING,
	hierarchyLevel : Sequelize.STRING,
	status : Sequelize.STRING,
	contentType: Sequelize.STRING,
	size : Sequelize.STRING,
	createdOn : Sequelize.STRING
}, {
	tableName: 'filelist',
	timestamps: false
});

const UploadedFiles = sequelize.define('UploadedFiles', {
	id: {
		type : Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	fileName: Sequelize.STRING,
	type: Sequelize.STRING,
	status: Sequelize.STRING,
}, {
	tableName: 'uploadedfiles',
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


router.get('/getFiles', function(req, res, next) {
	UploadedFiles
	.findAll({
		where : {
			type : req.query.type
		}
	})
	.then(function(err, data) {
		if (err) {
			res.json(err);
		} else {
			res.json(data);
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

router.post('/uploadFilesGeneric', upload.single('files'), function(req, res, next) {
	UploadedFiles
	.create({
		id: null,
		fileName: req.body.fileName,
		type: req.body.type,
		status: "ACTIVE",
	})
	.then(function(err, data) {
		if (err) {
			res.json(err);
		} else {
			res.json(data);
		}
	});
});




router.get('/refreshStorageFiles', function(req, res, next) {

	GoogleAccounts
	.findOne({
		where : {
			id : 15
		}
	})
	.then(function(data, err) {
		if (err) {
			res.json(err);
		} else {
			console.log("Starter");

			var storage = Storage({keyFilename: "./config/"+data.fileName});
			var bucket = data.bucketName;
			var fileList = [];

			console.log("Start Fetching files ");

			storage
			.bucket(bucket)
			.getFiles()
			.then(results => {

				var data = [];
				const files = results[0];
				files.forEach(file => {
					fileList.push({
						id : null,
						website : '',
						hotLinkUrl : '',
						bucketName : bucket,
						type : '',
						bucketId : 13,
						filename : file.name,
						hierarchyLevel : file.name.split("/").length - 1,
						status : 'ACTIVE',
						contentType : file.metadata.contentType,
						size : file.metadata.size,
						createdOn : file.metadata.timeCreated
					});
				});


				console.log(fileList.length);

				var size = 500; var arrayOfArrays = [];
				for (var i=0; i<fileList.length; i+=size) {
					arrayOfArrays.push(fileList.slice(i,i+size));
				}
				console.log(arrayOfArrays);

				arrayOfArrays.forEach(function(item){
					Files
					.bulkCreate(item)
					.then(function(err, GoogleAccounts) {
					});
				})

				res.json({status : "Completed"});

			})
			.catch(err => {
				console.error('ERROR:', err);
			});

		}
	});

});


module.exports = router;
