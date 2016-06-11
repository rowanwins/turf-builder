var fs = require("fs");
var path = require("path");
var express = require("express");
var bodyParser = require('body-parser')

var browserify = require('browserify');

var app = express();

app.use(express.static('assets'));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.get("/", function(req, res){
	res.render("index", {
		turfModules: turfModules,
		turfVersion: turfVersion
	});
});

app.post("/build", function(req, res){
	var requiredModules = req.body.modules.split(",");
	var name_id = req.body.fn.toString();
	var orig_name_id = name_id;
	var ct = 0;
	while (fs.existsSync('./outputs/temp-'+name_id+".js")) {
		name_id = orig_name_id+"-"+ct;
		ct++;
	}
	var holderFile = __dirname+'\\outputs\\'+name_id+'Main.js';
	var outputFileString = "module.exports = {";
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
	
	fs.writeFile(holderFile, outputFileString, function (err) {
		if (err) return console.log(err);
	});

	var b = browserify(holderFile, {
		standalone: "turf",
		paths: ['./node_modules/turf/node_modules']
	});

	b.transform({
		global: true
	}, 'uglifyify');

	var filename = __dirname+'\\outputs\\'+name_id+'.min.js';
	var outFile = fs.createWriteStream(filename)
	b.bundle().pipe(outFile);

	outFile.on('finish', function(){
		res.download(filename, function(err){
			if (err) {
				console.log("Hmm error occurred");
			} 
			else {
				fs.unlink(filename);
				fs.unlink(holderFile);
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