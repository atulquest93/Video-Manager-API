const request = require('request');
const fs = require('fs');
const path = require('path');
const youtubedl = require('@microlink/youtube-dl');
const  Storage  = require('@google-cloud/storage');
var progress = require('request-progress');

var functions = {};
var server = "http://206.189.225.246";

var coreObj = null;

functions.convert = function(data, callback){

	/* 
	 * Function to convert title/desc from one language to another
	 * @Params { source : 'en', target : 'hi', data : 'hello'  }
	 *
	 */

	request({
		url: server+"/grabber/t/tr.php",
		method: 'POST',
		form:data,
	}, (error, response, body) => {
		if (error) {
			console.log(error);
		} else {
			callback(response.body.toString());
		}
	});

};

functions.generateTitle = function(obj, callback){

	/* 
	 * Function to auto generate titles & descriptions from Selected bulk files.
	 * @Params { titleFile : 'bulktitle.txt', descFile : 'bulkDesc.txt'  }
	 *
	 */

	var readStream = fs.createReadStream(path.join(__dirname, './../../config') + '/'+obj.titleFile, 'utf8');

	let data = ''
	readStream.on('data', function(chunk) {
		data += chunk;
	}).on('end', function() {

		var original = data;
		data = data.replace(/\r?\n|\r/g, " ");
		var dataArray = data.split(" ");

		var title = "";
		var desc = "";

		for (var i = 100; i >= 0; i--) {
			title += dataArray[~~(dataArray.length * Math.random())]+" ";
		}

		var descStream = fs.createReadStream(path.join(__dirname, './../../config') + '/'+obj.descFile, 'utf8');

		descStream.on('data', function(chunk) {
			data += chunk;
		}).on('end', function() { 
			de = data.split("\n");
			desc += de[~~(de.length * Math.random())]+" ";
			var dataGenerated = { title : title, description : desc };
			
			callback(dataGenerated);
		});

	});
};

functions.crawlWebsite = function(data, callback){

	/* 
	 * Function to crawl website to generate Image , Video URL, Title.
	 * @Params { url : 'http://www.google.com'  }
	 *
	 */

	var url = data.url;
	var options = ['--username=xxx', '--password=xxx'];
	youtubedl.getInfo(url, options, function(err, info) {
		if (err) throw err;
		callback({
			fulltitle : info.fulltitle,
			url :info.url,
			_filename : info._filename,
			thumbnail : info.thumbnail,
			webpage_url : info.webpage_url
		});
	});

}

functions.downloadVideo = function(data, callback){

	/* 
	 * Function to downloadVideo to server 
	 * @Params { videoURL : 'http://www.google.com', fileName : 'abc.mp4'  }
	 * This will trigger callback as soon download Starts. Keep checking fileName.json file for status.
	 */

	progress(request(data.videoURL), {
	})
	.on('progress', function (state) {
		console.log('progress', state);
		state.status = "progress"
		fs.writeFile('./download/'+data.fileName+".json", JSON.stringify(state), 'utf8', function(){});
	})
	.on('error', function (err) {
		fs.writeFile('./download/'+data.fileName+".json", JSON.stringify({status : "Error"}), 'utf8', function(){});
	})
	.on('end', function (state) {
		fs.writeFile('./download/'+data.fileName+".json", JSON.stringify({status : "End"}), 'utf8', function(){});
	})
	.pipe(fs.createWriteStream('./download/'+data.fileName));

	callback({
		status : "success", 
		type: "downloadTriggered",
	}); 

};

functions.downloadImage = function(data, callback){
	
	/* 
	 * Function to download Image to Server.
	 * @Params { proxyType : 'http', ip, port, imageURL, fileName  }
	 */

	var proxyUrl = data.proxyType+"://"+ data.ip + ":" + data.port;

	var proxiedRequest = request.defaults({
		'proxy': proxyUrl
	});

	progress(request(data.imageURL ), {
	})
	.on('progress', function (state) {

	})
	.on('error', function (err) {
		console.log(err);
		callback({
			status : "error", 
			operation: "download-image",
		});
	})
	.on('end', function (state) {
		callback({
			status : "success", 
			operation: "download-image",
			name : data.fileName
		});
	})
	.pipe(fs.createWriteStream('./download/'+data.fileName));
	
};

functions.uploadToStorage = function(data, callback){

	/* 
	 * Function to upload file to connected Storage
	 * @Params { fileName, bucketName, downloadFileName, folderName  }
	 *
	 */

	 var storage = Storage({keyFilename: "./config/"+data.fileName});
	 var bucketName = data.bucketName;

	 var fileName = "./download/" + data.downloadFileName;
	 var serverFolder = data.folderName + "/" + data.downloadFileName;


	 storage
	 .bucket(bucketName)
	 .upload(fileName, {destination : serverFolder, validation: false})
	 .then(() => {
	 	callback({
	 		fileName : fileName,
	 		bucket : bucketName,
	 		url : "https://storage.googleapis.com/"+bucketName+"/"+serverFolder
	 	});
	 })
	 .catch(err => {
	 	console.log('ERROR:', err);
	 });

	};

functions.makePublic = function(data, callback){

	/* 
	 * Function to make uploaded files public
	 * @Params { fileName, bucketName, downloadFileName, folderName  }
	 *
	 */

	 var storage = Storage({keyFilename: "./keys/"+data.fileName});
	 var bucketName = data.bucketName;

	 var filename = folderName + "/" + data.downloadFileName;


	 storage.bucket(bucketName).file(filename).makePublic()
	 .then(() => {
	 	callback({
	 		name : filename
	 	});
	 })
	 .catch(err => {
	 	console.error('ERROR:', err);
	 });

};

functions.wpUploadImage = function(data, callback){
	
	/* 
	 * Function to upload Image to selected Wordpress
	 * @Params { fileName 'myimage.jpeg', api : 'http://abc.com/wp-json/wp/v2',
	 * authorization : 'Baisc xxx'  }
	 */

	var image = data.fileName;
	var format  = image.split(".")[1];

	request({
		url: data.api+'/media/',
		headers: {
			'cache-control': 'no-cache',
			'content-disposition': 'attachment; filename='+image,
			'content-type' : 'image/'+format,
			'authorization' : data.authorization
		},
		encoding: null,
		method: 'POST',
		body: fs.createReadStream('./../download/'+image),
	}, (error, response, body) => {
		if (error) {
				console.log(error);
			} else {
				callback(JSON.parse(response.body.toString()));
			}
	});
};

functions.wpCreatePost = function(data, callback){

	/* 
	 * Function to create post on selected Wordpress
	 * @Params { tags, categories, isSuffixed, suffixList, 
	 * title, content, featured_media, api, authorization   }
	 */

	var tags = data.tags;
	for(i=0;i<30;i++){
		tags = tags + "," + Math.floor(Math.random()*data.tags.length);
	}

	var tagArray = tags.split(",").slice().splice(1, tags.split(",").length);

	var categories = data.categories;
	for(i=0;i<30;i++){
		categories = categories + "," + Math.floor(Math.random()*data.categories.length);
	}

	var catArray = categories.split(",").slice().splice(1, categories.split(",").length);

	var isSuffixed = data.isSuffixed;
	
	if(isSuffixed){
		var words = data.suffixList;
		var selected = words[Math.floor(Math.random()*words.length)];
		data.title = data.title+" - "+selected;
	}

	var data = {
		title : data.title,
		content : data.content,
		featured_media : data.featured_media,
		format: "video",
		status: "publish",
	  	tags : tagArray[0] == 0 ? [] : tagArray, //[1,2,3,4,5]
	  	categories: catArray[0] == 0 ? [] : catArray //[12,3,4,5,]
	  };

	  request({
	  	url: data.api+'/posts',
	  	headers: {
	  		'cache-control': 'no-cache',
	  		'Content-Type' : 'application/x-www-form-urlencoded',
	  		'authorization' : data.authorization
	  	},
	  	form: data,
	  	method: 'POST'
	  }, (error, response, body) => {
	  	if (error) {
	  		console.log(error);
	  	} else {
	  		callback(JSON.parse(response.body.toString()));
	  	}
	  });
};

functions.wpCreateEmbed = function(data, callback){
	
	/* 
	 * Function to Create Embed corresponding to particular post.
	 * @Params { meta, api, postId, authorization, baseDomain : 'https://foo.bar'
	 * postId, gcId, videoFileName, crawlDomain }
	 */

	if(req.body.gcId == 1024){
		var base = data.baseDomain+"/grabber/nonHostedPlayer.php?server="+crawlDomain+"&id="+data.videoFileName;
	}else{
		var base = data.baseDomain+"/grabber/init.php?id="+data.postId+"&bucket="+data.gcId+"&file="+data.videoFileName;
	}
	
	var data = {
		key : data.meta || "embed",
		value : '<iframe src="'+base+'" scrolling="no" frameborder="0" width="640" height="480" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true"></iframe>'
	};

	request({
		url: api+'/posts/'+data.postId+'/meta',
		headers: {
			'cache-control': 'no-cache',
			'authorization' : data.authorization
		},
		form: data,
		method: 'POST'
	}, (error, response, body) => {
		if (error) {
			console.log({name : error});
		} else {
			callback(JSON.parse(response.body.toString()));
		}
	});

};

module.exports = functions;
