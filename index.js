var fs = require("fs");
var path = require("path");
var express = require("express");

var browserify;

var app = express();

app.use(express.static('assets'));

app.set('view engine', 'ejs');

app.get("/", function(req, res){
	var d = (new Date()).toDateString().replace(/ /g, '');

	res.render("index", {
		turfModules: turfModules,
		turfVersion: turfVersion,
		placeholder: "turf_" + d
	});
});

app.get("/build", function(req, res){
	var requiredModules = req.query.modules.split(",");
	var outputFileString = "module.exports = {";
	var name_id = null;

	if (!req.query.fn) {
		var d = (new Date()).toDateString().replace(/ /g, '');
		name_id = "turf_" + d;
	} else {
		name_id = req.query.fn.toString();
	}

	var orig_name_id = name_id;
	var ct = 0;

	// If somebody else created a file at the exact same time, add an additional
	// number on the end to prevent clashing
	while (fs.existsSync('./outputs/temp-'+name_id+".js")) {
		name_id = orig_name_id+"-"+ct;
		ct++;
	}

	var temp = __dirname+'/outputs/temp-'+name_id+".js";
	var filename = __dirname+'/outputs/'+name_id+'.min.js';

	for (var i = 0; i < requiredModules.length; i++ ) {
		var plainModuleName = requiredModules[i].replace("turf-","");
		plainModuleName = plainModuleName.split("-").map(function(elem, ind) {
			if (ind > 0) { 
				return elem.slice(0, 1).toUpperCase()+elem.slice(1); 
			}
			return elem;
		}).join("");
		
		outputFileString += plainModuleName + ": require('"+ requiredModules[i] +"'),";
	}

	outputFileString = outputFileString.substring(0, outputFileString.length - 1);
	outputFileString += "}";

	fs.writeFileSync(temp, outputFileString);

	var b = browserify(temp,{
		standalone:"turf",
		paths: ['./node_modules/turf/node_modules']
	});

	b.transform({
		global: true
	}, 'uglifyify');
	
	var writeFile = fs.createWriteStream(filename);

	b.bundle().pipe(writeFile);

	writeFile.on('finish', function(){

		res.download(filename, function(err){
			if (err) {
				console.log("Hmm error occurred");
			} 
			else {
				fs.unlink(temp);
				fs.unlink(filename);
			}
		});
	});
});

var turfModules =[];
var turfLocation = 'node_modules/turf/node_modules';

var turfVersion;

var startup = (function checkExistance(){

	var pjson = require(__dirname+'/node_modules/turf/package.json');
	turfVersion = pjson.version;

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

	var server_port = process.env.PORT || 3000;

	app.listen(server_port, function() {
		console.log("The Turf build tool has been started at port "+server_port);
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