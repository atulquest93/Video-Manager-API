const request = require('request');
const fs = require('fs');
const path = require('path');

var functions = {};
var server = "http://206.189.225.246";

var coreObj = null;

functions.convert = function(data){

	request({
		url: server+"/grabber/t/tr.php",
		method: 'POST',
		form:data,
	}, (error, response, body) => {
		if (error) {
			console.log("Error while downloading Image to Server.");
			console.log(error);
		} else {
			return response.body.toString();
		}
	});

};

functions.generateTitle = function(obj, callback){

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

			callback({title : title, description : desc});
		});

	});
};

module.exports = functions;
