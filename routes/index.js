var express = require('express');
var router = express.Router();
const functions = require('./Core/coreFunctions');

const fs = require('fs');
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

const Posts = sequelize.define('Posts', {
	id: {
		type : Sequelize.STRING,
		primaryKey: true,
		autoIncrement: true,
	},
	postedTo: Sequelize.STRING,
	crawler: Sequelize.STRING,
	storage: Sequelize.STRING,
	title : Sequelize.STRING,
	description : Sequelize.STRING,
	originalUrl : Sequelize.STRING,
	imageUrl : Sequelize.STRING,
	videoUrl : Sequelize.STRING
}, {
	tableName: 'posts',
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
	type : Sequelize.STRING
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
	status : Sequelize.STRING,
	fileName : Sequelize.STRING
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
	var fileName = "";

	if(config.crawlers[0].name == req.body.crawler){ //p crawler
		fileName = req.body.videoUrl.split("key=")[1];
	}else if(config.crawlers[1].name == req.body.crawler){ //x crawler
		var tmp = req.body.videoUrl.split("/");
		fileName = "xv_"+tmp[tmp.length-2];
	}else if(config.crawlers[2].name == req.body.crawler){ //365 crawler
		var tmp = req.body.videoUrl.split("/");
		fileName = "po_"+tmp[tmp.length-1];
	}

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
		status : "Pending",
		fileName : fileName
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

router.get('/getAutoPosts', function(req, res, next) {

	sequelize.query("SELECT COUNT(*) as rows FROM `posts` WHERE 1", { type: sequelize.QueryTypes.SELECT})
	.then(count => {

		Posts
		.findAll({
			limit : parseInt(req.query._limit), 
			offset: req.query._page !=1 ? parseInt(req.query._page)*10 : 0,
			attributes: ['id', 'postedTo', 'crawler', 'storage','originalUrl', 'imageUrl', 'videoUrl']
		})
		.then(function(data,err) {
			
			res.setHeader('x-total-count', count[0].rows);
			res.json(data);
			
		});

	});

});

router.post('/saveProxy', function(req, res, next) {

	var proxy = req.body;

	fs.writeFile("./config/proxy.json", JSON.stringify(proxy), 'utf8', function(obj){
		res.json({message: "Proxy Updated", data : proxy});
	});

});

router.post('/checkProxy', function(req, res, next) {

	var ProxyVerifier = require('proxy-verifier');
	var prx = req.body.proxyDetails.split(":");
	var proxy = {
		ipAddress: prx[0],
		port: parseInt(prx[1]),
		protocol: req.body.proxyType
	};

	ProxyVerifier.testAll(proxy, function(error, result) {

		if (error) {
			res.json({status : "Error"});
		} else {
			res.json(result);
		}
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

router.get('/getSignedURL', function(req, res, next) {

	console.log("Hit");
	const options = {
		prefix: "",
	};

	var file = req.query.file;

	GoogleAccounts.findOne({
		where : {
			id : req.query.bucket
		}
	}).then(function(str, error){	
		 console.log(str.fileName);
		 var storage = Storage({keyFilename: "./config/"+str.fileName});

		 var date = new Date();
		 date.setDate(date.getDate() + 1);
		 storage
		 .bucket(str.bucketName)
		 .file(file).getSignedUrl({
		 	action: 'read',
		 	expires: Date.now()+ 6000000
		 }).then(results => {
		 	res.json(results[0]);
		 })
		 .catch(err => {
		 	console.error('ERROR:', err);
		 });
	});

});


router.get('/initQueue', function(req, res, next) {

	var core = {};

	CrawlerQueue
	.findOne({
		where : {
			isProcessed : false,
			status : "Pending"
		}
	})
	.then(function(data,err) {
		console.log(data);
		if(data.fileName.length == 0){

			CrawlerQueue
			.destroy({
				where : {
					id : data.id
				}
			})
			.then(function(data, err) {
				res.json(data);
			});

		}else{
			Wordpress
			.findOne({
				where : {
					name : data.wordpress
				}
			})
			.then(function(wp, err) {

				core.wordpress = wp;
				core.queue = data;

				GoogleAccounts.findOne({
					where : {
						name : core.queue.storage
					}
				}).then(function(storage, error){	


					Crawlers.findOne({
						where : {
							name : core.queue.crawler
						}
					}).then(function(crawl, error){

						core.storage = storage;
						core.crawl = crawl;
						crawlWebsite(core, res);

					});

					

				});

			});
		}

		
	});
});


function crawlWebsite(core, res){
	console.log("Crawling Website");
	console.log({
		url : core.queue.url,
		type : core.crawl.type
	});
	functions.crawlWebsite({
		url : core.queue.url,
		type : core.crawl.type
	}, function(data){
		core.crawled = data;
		generateTitle(core,res);
	});
}

function generateTitle(core,res){
	console.log("Generating Title");
	functions.generateTitle({
		titleFile : core.wordpress.titleFile,
		descFile : core.wordpress.descFile,
	}, function(data){

		core.autoGenerated = data;

		if(core.wordpress.languageConversion){
			convert(core,res);
		}else{
			downloadVideo(core,res);
		}

	});
}

function convert(core,res){
	console.log("Converting Title");
	functions.convert({
		source : 'en',
		target : 'hi',
		data : core.autoGenerated.title
	}, function(data){

		core.autoGenerated.title = data;

		functions.convert({
			source : 'en',
			target : 'hi',
			data : core.autoGenerated.description
		}, function(data){
			
			core.autoGenerated.description = data;
			downloadVideo(core,res);
		});

	});
};

function downloadVideo(core,res){
	console.log("Downloading Video");
	functions.downloadVideo({
		videoURL : core.crawled.url,
		fileName : core.queue.fileName+".mp4"
	}, function(data){
		core.downloadVideo = data;
		downloadImage(core,res);
	});

}

function downloadImage(core,res){
	console.log("DOwnloading Image");
	var fileName = core.crawled.thumbnail.split("/")[core.crawled.thumbnail.split("/").length-1]
	functions.downloadImage({
		imageURL : core.crawled.thumbnail,
		fileName : core.queue.fileName+".jpg"
	},function(data){
		core.imageDownload = data;
		uploadVideo(core,res);
		//res.json(core);
	});
};


function uploadVideo(core,res){
	console.log("UPloading Video");
	functions.uploadToStorage({
		key : core.storage.fileName,
		bucketName : core.storage.bucketName,
		downloadFileName : core.downloadVideo.fileName,
		folderName : 'api/v2/videos'
	}, function(data){
		core.uploadVideo = data;
		//res.json(core);
		uploadImage(core,res);
	});
};

function uploadImage(core,res){
	console.log("Uploading Images");
	functions.uploadToStorage({
		key : core.storage.fileName,
		bucketName : core.storage.bucketName,
		downloadFileName : core.imageDownload.fileName,
		folderName : 'api/v2/images'
	}, function(data){
		core.uploadImage = data;
		wpUploadImage(core,res);
	});
};

function wpUploadImage(core,res){
	console.log("Wp Posting Image");
	functions.wpUploadImage({
		fileName: core.imageDownload.fileName,
		api : core.wordpress.api,
		authorization : core.wordpress.authorization
	}, function(data){
		core.uploadWpImage = data;
		wpCreatePost(core,res);
	});
}

function wpCreatePost(core,res){
	console.log("Wp Creating Post");
	functions.wpCreatePost({
		tags : core.wordpress.tags,
		categories : core.wordpress.categories,
		isSuffixed : core.wordpress.appendSuffx,
		suffixList : core.wordpress.suffixList,
		title : core.autoGenerated.title,
		content : core.autoGenerated.description,
		featured_media : core.uploadWpImage.id,
		api : core.wordpress.api,
		authorization : core.wordpress.authorization
	}, function(data){
		core.wpCreatePost = data;
		wpCreateEmbed(core,res);
		//res.json(core);
	});
};

function wpCreateEmbed(core,res){
	console.log("WP Creating Embed");
	functions.wpCreateEmbed({
		meta : core.wordpress.meta,
		api : core.wordpress.api,
		authorization : core.wordpress.authorization,
		postId : core.wpCreatePost.id,
		gcId : core.storage.id,
		videoFileName : core.uploadVideo.fileName,
		baseDomain : config.playerDomain
	}, function(data){
		core.wpCreateEmbed = data;

		Posts
		.create({
			id: null,
			postedTo: core.queue.wordpress,
			crawler: core.queue.crawler,
			storage: core.queue.storage,
			title : core.autoGenerated.title,
			description : core.autoGenerated.description,
			originalUrl : core.queue.url,
			imageUrl :core.uploadImage.url,
			videoUrl : core.uploadVideo.url
		})
		.then(function(posts, err) {
			
			CrawlerQueue
			.destroy({
				where : {
					id : core.queue.id
				}
			})
			.then(function(data, err) {
				res.json(posts);
			});

			
			
		});
		//res.json(core);
	});
};

var cron = require('cron');
var postJob = cron.job("*/5 * * * *", function(){
	console.log('Starting Cron Execution');
	var server = "http://127.0.0.1:3001";
	request({
		url: server+"/initQueue",
		method: 'GET',
	}, (error, response, body) => {
		if (error) {
			console.log(error);
		} else {
			var elem = JSON.parse(response.body.toString());
			console.log(elem);
		}
	});

	console.log('Cron Completed !');
}); 

module.exports = router;
