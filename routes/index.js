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

const Crawlers = sequelize.define('Crawlers', {
	id: {
		type : Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	name: Sequelize.STRING,
	isEmbedable: Sequelize.BOOLEAN,
	websiteUrl: Sequelize.STRING,
	sourceLang : Sequelize.STRING
}, {
	tableName: 'crawlers',
	timestamps: false
});

const CrawlerQueue = sequelize.define('CrawlerQueue', {
	id: {
		type : Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	url: Sequelize.STRING,
	crawler: Sequelize.STRING,
	wordpress: Sequelize.STRING,
	storage : Sequelize.STRING,
	isProcessed : Sequelize.BOOLEAN,
	addedTime : Sequelize.STRING,
	completedTime : Sequelize.STRING,
	status : Sequelize.STRING
}, {
	tableName: 'crawlerqueue',
	timestamps: false
});



const Wordpress = sequelize.define('Wordpress', {
	id: {
		type : Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	name: Sequelize.STRING,
	api: Sequelize.STRING,
	authorization: Sequelize.STRING,
	meta: Sequelize.STRING,
	accKey: Sequelize.STRING,
	tags: Sequelize.STRING,
	categories: Sequelize.STRING,
	authorizationOriginal: Sequelize.STRING,
	languageConversion: Sequelize.BOOLEAN,
	sourceLanguage: Sequelize.STRING,
	destLanguage: Sequelize.STRING,
	appendSuffx: Sequelize.BOOLEAN,
	suffixList: Sequelize.STRING,
	titleFile: Sequelize.STRING,
	descFile: Sequelize.STRING,
	maxPostLimit: Sequelize.STRING,
}, {
	tableName: 'accounts',
	timestamps: false
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

router.get('/getCrawlers', function(req, res, next) {
	Crawlers
	.findAll({
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


router.post('/addNewWordpress', function(req, res, next) {

	Wordpress
	.create({
		id: null,
		name: req.body.wpName,
		api: req.body.apiURL,
		authorization:  "Basic "+Buffer.from(req.body.authKey).toString('base64'),
		meta: req.body.videoMeta,
		accKey: "NA",
		tags: req.body.tagList,
		categories: req.body.catList,
		authorizationOriginal: req.body.authKey,
		languageConversion: req.body.languageIsRequired,
		sourceLanguage: req.body.sourceLang,
		destLanguage:req.body.destLang,
		appendSuffx: req.body.suffixReq,
		suffixList: req.body.suffixList,
		titleFile: req.body.titleFile,
		descFile: req.body.descFile,
		maxPostLimit: "0",
	})
	.then(function(err, data) {
		if (err) {
			res.json(err);
		} else {
			res.json(data);
		}
	});
});

router.get('/getConnectedWpAccounts', function(req, res, next) {

	Wordpress
	.findAll({
		attributes : ['id','api','name', 'meta','tags','categories','languageConversion','sourceLanguage'
		,'destLanguage','appendSuffx','suffixList','titleFile','descFile', 'maxPostLimit']
	})
	.then(function(err, data) {
		if (err) {
			res.json(err);
		} else {
			res.json(data);
		}
	});

});

router.post('/deleteWPAccount', function(req, res, next) {

	Wordpress
	.destroy({
		where : {
			id : req.body.id
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

router.post('/updateWordpress', function(req, res, next) {

	Wordpress
	.update({
		maxPostLimit : req.body.limit
	},{
		where : {
			id : req.body.id
		},
		returning: true,
		plain: true
	})
	.then(function(err, data) {
		if (err) {
			res.json(err);
		} else {
			res.json(data);
		}
	});

});

router.post('/addtoCrawlerQueue', function(req, res, next) {


	CrawlerQueue
	.create({
		id : null,
		url: req.body.videoUrl,
		crawler: req.body.crawler,
		wordpress: req.body.wordpress,
		storage : req.body.storage,
		isProcessed : false,
		addedTime : new Date().toString(),
		completedTime : " ",
		status : "Pending"
	})
	.then(function(err, data) {
		if (err) {
			res.json(err);
		} else {
			res.json(data);
		}
	});

});

router.get('/getCrawlerQueue', function(req, res, next) {

	sequelize.query("SELECT COUNT(*) as rows FROM `crawlerqueue` WHERE 1", { type: sequelize.QueryTypes.SELECT})
	.then(count => {

		CrawlerQueue
		.findAll({
			limit : parseInt(req.query._limit), 
			offset: req.query._page !=1 ? parseInt(req.query._page)*10 : 0,
			attributes: ['id', 'url', 'crawler', 'wordpress','isProcessed', 'addedTime', 'completedTime','status']
		})
		.then(function(data,err) {
			
			res.setHeader('x-total-count', count[0].rows);
			res.json(data);
			
		});

	});

});


router.get('/getStorageFiles', function(req, res, next) {

	sequelize.query("SELECT COUNT(*) as rows FROM `filelist` WHERE 1", { type: sequelize.QueryTypes.SELECT})
	.then(count => {

		const Op = Sequelize.Op;

		Files
		.findAll({
			limit : parseInt(req.query._limit), 
			offset: req.query._page !=1 ? parseInt(req.query._page)*10 : 0,
			attributes: ['id', 'filename', 'bucketName', 'contentType','size'],
			where : {
				bucketName : {
					[Op.like]: '%'+(req.query.bucketName_like|| '')+'%',
				},
				fileName : {
					[Op.like] : '%'+(req.query.filename_like || '')+'%',
				},
				contentType : {
					[Op.like] : '%'+(req.query.contentType_like || '')+'%',
				}
			}
		})
		.then(function(data,err) {
			
			res.setHeader('x-total-count', count[0].rows);
			res.json(data);
			
		});

	});

});

router.get('/refreshStorageFiles', function(req, res, next) {

	var storageId = req.query.id; 

	sequelize.query("DELETE FROM `filelist` WHERE `bucketId` ="+storageId+"", { type: sequelize.QueryTypes.DELETE})

	.then(data => {

		GoogleAccounts
		.findOne({
			where : {
				id : storageId
			}
		})
		.then(function(data, err) {
			if (err) {
				res.json(err);
			} else {

				console.log("Starter");

				var storage = Storage({keyFilename: "./config/"+data.fileName});
				var bucket = data.bucketName;

				console.log(data.bucketName);

				var fileList = [];

				console.log("Start Fetching files ");

				storage
				.bucket(bucket)
				.getFiles()
				.then(results => {

					var data = [];
					const files = results[0];

					console.log("Files Received : "+files.length);

					files.forEach(file => {
						fileList.push({
							id : null,
							website : '',
							hotLinkUrl : '',
							bucketName : bucket,
							type : '',
							bucketId : storageId,
							filename : file.name,
							hierarchyLevel : file.name.split("/").length - 1,
							status : 'ACTIVE',
							contentType : file.metadata.contentType,
							size : file.metadata.size,
							createdOn : file.metadata.timeCreated
						});
					});

					console.log(fileList.size);

					var size = 500; var arrayOfArrays = [];
					for (var i=0; i<fileList.length; i+=size) {
						arrayOfArrays.push(fileList.slice(i,i+size));
					}

					console.log(arrayOfArrays);

					arrayOfArrays.forEach(function(item){

						Files
						.bulkCreate(item)
						.then(function(err, GoogleAccounts) {
							console.log("Insert Success");
						});

					})

					res.json({status : "Completed Second"});

				})
				.catch(err => {
					console.error('ERROR:', err);
				});

			}
		});

	});

	
});


function refreshStorage(storageId, res){


}


module.exports = router;
