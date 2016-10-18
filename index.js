var fs = require("fs");
var path = require("path");
var express = require("express");
var bodyParser = require('body-parser');

var browserify = require('browserify');

var app = express();

app.use(express.static('assets'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.get("/", function(req, res) {
	res.render("index", {
		turfModules: turfModules,
		turfVersion: turfVersion
	});
});

app.post("/build", function(req, res) {
	var requiredModules = req.body.modules.split(",");
	var outputFileString = "module.exports = {";
	for (var i = 0; i < requiredModules.length; i++ ) {
		var plainModuleName = requiredModules[i].split("-").map(function(elem, ind) {
			if (ind > 0) { 
				return elem.slice(0, 1).toUpperCase()+elem.slice(1); 
			}
			return elem;
		}).join("");	
		outputFileString += plainModuleName + ": require('@turf/"+ requiredModules[i] +"'),";
	}
	// outputFileString +=  req.body.modules;
	// console.log(req.body.modules);
	outputFileString = outputFileString.substring(0, outputFileString.length - 1);
	outputFileString += "}";
	console.log(outputFileString);

	fs.writeFile('tmp.txt', outputFileString,  function(err) {
		if (err) {
			return console.error(err);
		}
		var b = browserify('tmp.txt', {
			standalone: "turf",
			paths: ['./node_modules/@turf']
		});

		b.transform({
			global: true
		}, 'uglifyify');
		b.bundle().pipe(res);
	});
});

var turfModules =[];
var turfLocation = 'node_modules/@turf';

var turfVersion;

var startup = (function checkExistance() {
	var pjson = require(__dirname+'/node_modules/@turf/turf/package.json');
	turfVersion = pjson.version;

	fs.lstat(turfLocation, function (err, inodeStatus) {
		if (err) {
			console.log("Hmmm there was an error and we couldn't find any turf modules... please double check the install instructions");
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

function createModuleArray(allModules) {
	for (i = 0; i < allModules.length; i++) { 
		if (allModules[i].indexOf("turf") === -1) {
			turfModules.push(allModules[i]); 
		}
	}
}

function startServer() {
	browserify = require('browserify');

	var server_port = process.env.PORT || 3000;

	app.listen(server_port, function() {
		console.log("The Turf build tool has been started at port " + server_port);
	});
}

function checkCreateOutputDirectory() {
	fs.lstat('./outputs', function (err, inodeStatus) {
		if (err) {
			fs.mkdir('./outputs');
			return;
		}

		return "output directory already exists";
	});
}
