var fs = require("fs");
var path = require("path");
var express = require("express");
var opener = require("opener");

var browserify;

var app = express();

app.set('view engine', 'ejs');

app.get("/", function(req, res){
	res.render("index", {
		turfModules: turfModules
	});
});

app.get("/build", function(req, res){

	var requiredModules = req.query.modules.split(",");
	var outputFileString = "module.exports = {";

	for (var i = 0; i < requiredModules.length; i++ ) {
		var plainModuleName = requiredModules[i].replace("turf-","");
		outputFileString += plainModuleName + ": require('"+ requiredModules[i] +"'),";
	}

	outputFileString = outputFileString.substring(0, outputFileString.length - 1);
	outputFileString += "}";

	fs.writeFile(__dirname + '/outputs/temp.js', outputFileString);

	var b = browserify('./outputs/temp.js',{
		standalone:"turf"
	});

	b.transform({
		global: true
	}, 'uglifyify');
	
	var filename;
	if (!req.query.fn){
		var d = new Date();
		d = d.toDateString();
		d = d.replace(/ /g, '');
		filename = "turf_" + d+".min.js"; 
	}
	else {
		filename = req.query.fn.toString()+".min.js";
	}
	var writeFile = fs.createWriteStream(__dirname + '/outputs/'+filename);

	b.bundle().pipe(writeFile);

	writeFile.on('finish', function(){
		fs.unlink(__dirname + '/outputs/temp.js');
	});

	res.render("complete");
});


var turfModules =[];
var turfLocation = '../node_modules';

var startup = (function checkExistance(){
	
	fs.lstat(turfLocation, function (err, inodeStatus) {
		if (err){
			console.log("Hmmm there was an error and we couldn't find any turf modules... please double check the install instuctions");
			return;
		}

		var allModules = getDirectories(turfLocation);
		createModuleArray(allModules);
		checkCreateOutputDirectory();
		startServer();
		
		return "modules could be found";
	});
})();

function getDirectories(srcpath) {
	return fs.readdirSync(srcpath).filter(function(file) {
		return fs.statSync(path.join(srcpath, file)).isDirectory();
	});
}

function createModuleArray(allModules){
	for (i = 0; i < allModules.length; i++) { 
		if (allModules[i].indexOf("turf") > -1){
			turfModules.push(allModules[i]); 
		}
	}
}

function startServer(){
	browserify = require('browserify');
	var port = 5000;
	app.listen(port, function() {
		opener("http://localhost:5000");
		console.log("The Turf build tool has been started at http://localhost:5000, all going well it should open automatically!");
	});
}



function checkCreateOutputDirectory(){
	
	fs.lstat('./outputs', function (err, inodeStatus) {
		if (err){
			fs.mkdir('./outputs');
			return;
		}
		
		return "output directory already exists";
	});
}