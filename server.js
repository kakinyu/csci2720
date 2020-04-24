var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(__dirname + '/public'));

var mongoose = require('mongoose');
mongoose.connect('mongodb://admin:admin@localhost/csci2720');
var ObjectId = mongoose.Schema.Types.ObjectId;

var multer = require('multer');
var upload = multer({dest: 'uploads/'});

var fs = require('fs');
var csv = require('csvtojson');

var sha256 = require('js-sha256');
var db = mongoose.connection;
// Upon connection failure
db.on('error', console.error.bind(console, 'Connection error:'));
// Upon opening the database successfully
db.once('open', function() {
	console.log("Connection is open...");
});

// Event
var EventSchema = mongoose.Schema({
	eventId: { type: Number, required: true, unique: true },
	activityName: { type: String, required: true },
	dateTime: { type: String, required: true },
	organizationName: { type: String, required: true },
	locationName: { type: String, required: true },
	departmentName: { type: String, required: true },
	enquiryContact: { type: String, required: true }
});
var Event = mongoose.model('Event', EventSchema);

// User
var UserSchema = mongoose.Schema({
	username: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	favourite: { type: String, required: true }
});
var User = mongoose.model('User', UserSchema);

// handle GET requests
app.get('/event/search', function(req, res) {
	var key = Object.keys(req.query)[0];
	if (req.query[key] == '') {
		Event.find({}, function(err, result) {
			if (err) res.send(err);
			else res.send(result);
		});
	} else {
		var query = {};
		query[key] = new RegExp(req.query[key], "i");
		Event.find(query, function(err, result) {
			if (err) res.send(err);
			else res.send(result);
		});
	}
});
app.get('/event/:eventId', function(req, res) {
	Event.findOne(
		{eventId: req.params['eventId']},
		'eventId activityName dateTime organizationName locationName departmentName enquiryContact',
		function(err, result) {
			if (err) res.send(err);
			else res.send(result);
	});
});
app.get('/event', function(req, res) {
	Event.find({}).then(function(result) {
		if (result.length == 0) res.send("No events inside database.");
		else res.send(result);
	});
});

app.get('/user', async function(req, res) {
	var e = await User.find({},'username password favourite',function(err, result) {
			if (err) res.send(err);
			else res.send(result);
		}
	);
	if (e == null) res.send("Get users error");
	else res.send("Get users success");
});
app.get('/user/login', async function(req, res) {
	var hash = sha256.create();
	hash.update(req.query['password']);
	var hashstring = hash.hex().substring(0,20);
	var e = await User.findOne(
		{username: req.query['username'], password: hashstring},
		'username password favourite',
		function(err, result) {
			if (err) res.send(err);
			else res.send(result);
		}
	);
	if (e == null) res.send("Login error");
	else res.send("Login success");
});
app.get('/user/fav', async function(req, res){
	User.find({username: req.query['username']},'username password favourite', function(err, result){
		if (err) res.send(err);
		else res.send(result);
	});
});

app.get('/comment', function(req, res) {
	fs.access("comment/"+req.query["filename"], fs.constants.F_OK, function(err) {
		if (err) res.send("File not found");
		else {
			var data = fs.readFileSync("comment/"+req.query["filename"],"utf8");
			res.send(data);
		}
	});
});

// handle POST requests
app.post('/event', function(req, res) {
	Event.find({}).sort({eventId: -1}).limit(1).exec(function(err, events) {
		if (err) res.send(err);
		else {
			var e = new Event({
				eventId: (events.length == 0 ? 1 : events[0].eventId + 1),
				activityName: req.body['activityName'],
				dateTime: req.body['dateTime'],
				organizationName: req.body['organizationName'],
				locationName: req.body['locationName'],
				departmentName: req.body['departmentName'],
				enquiryContact: req.body['enquiryContact']
			});
			e.save(function(err) {
				if (err) res.send("Event upload error");
				else res.send("Event upload success");
			});
		}
	});
});

app.post('/user', function(req, res) {
	var hash = sha256.create();
	hash.update(req.body['password']);
	var hashstring = hash.hex().substring(0,20);

	var u = new User({
		username: req.body['username'],
		password: hashstring, 
		favourite: req.body['favorite']
	});
	u.save(function(err) {
		if (err) res.send("User create error");
		else res.send("User create success");
	});
});

app.post('/uploadCSV', upload.single('eventsCSV'), function(req, res){
	csv().fromFile(req.file.path)
		.then(function(jsonArrayObj){
			console.log(jsonArrayObj);
			db.collection('events').insert(jsonArrayObj, function(err, docs){
				if (err) res.send(err);
				else res.send (jsonArrayObj.length + " records processed.");
			});
		});
});

app.post('/comment', function(req, res) {
	try {
		fs.writeFileSync("comment/"+req.body["filename"], req.body["data"], 'utf8');
		res.send("Comments create success");
	} catch (err) {
		res.send(err);
	}
});

// handle DELETE requests
app.delete('/event', function(req, res) {
	Event.remove({}, function(err) {
		if (err) res.send("Event delete error");
		else res.send("Event delete success");
	});
});
app.delete('/event/:eventId', function(req, res) {
	Event.deleteOne({eventId: parseInt(req.params['eventId'])}, function(err, result) {
		if (err) res.send(err);
		else if (result.ok == 0) res.send("Event delete error");
		else res.send("Event delete success");
	});
});

app.delete('/user/:username', async function(req, res) {
	console.log(req.params['username']);
	try {
		var u = await User.findOne({username: req.params['username']},'username password');
		console.log(u);
		if (u == null) res.send("Username " + req.params['username'] + " not found!");
		else {
			var deleted = await User.deleteOne({username: req.params['username']});
			if (deleted.ok == 1) res.send("User delete success");
			else res.send("User delete error");
		}
	} catch (err) {
		res.send(err);
	}
});

app.delete('/comment', function(req, res) {
	fs.readdir('comment', function(err, result) {
		if (err) res.send(err);
		else {
			for (var i = 0; i < result.length; i++) fs.unlinkSync('comment/'+result[i]);
			res.send("Comments delete success");
		}
	});
});

// handle PUT requests
app.put('/event/:eventId', function(req, res) {
	Event.findOneAndUpdate(
		{eventId: req.body['eventId']},
		{$set:
			{eventId: req.body['eventId'],
			activityName: req.body['activityName'],
			dateTime: req.body['dateTime'],
			organizationName: req.body['organizationName'],
			locationName: req.body['locationName'],
			departmentName: req.body['departmentName'],
			enquiryContact: req.body['enquiryContact']}
		}, function(err) {
			if (err) res.send(err);
			else res.send("Event update success");
		}
	);
});

app.put('/user/username', function(req, res) {
	var hash = sha256.create();
	hash.update(req.body['password']);
	var hashstring = hash.hex().substring(0,20);
	console.log(hashstring);
	User.findOneAndUpdate(
		{username: req.body['username']},
		{$set:
			{username:req.body['username'],
			password: hashstring}
		}, function(err) {
			if (err) res.send(err);
			else res.send("User update success");
		}
	);
});

app.put('/user/fav', function(req, res){
	// console.log(req.body);
	User.findOneAndUpdate(
		{username: req.body['username']},
		{$set:
			{username: req.body['username'],
			 favourite: req.body['favourite']}
		}, function(err) {
			if (err) res.send(err);
			else res.send("User favourite update success");
		}
	);
});

// load html
app.get('/', function(req, res) {
	res.sendFile(__dirname+"/"+"index.html");
});
app.get('/index.html', function(req, res) {
	res.sendFile(__dirname+"/"+"index.html");
});

// listen to port 3000
var server = app.listen(3000);
