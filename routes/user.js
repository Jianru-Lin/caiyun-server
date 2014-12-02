var db = require('./lib/db')
var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
	res.render('user');
});

router.get('/create', function(req, res) {
	res.render('user-create');
});

router.post('/create', function(req, res) {
	var user = check(req.body)
	db.createUser(user, function(err, _id) {
		if (err) {
			res.end(err.toString())
		}
		else {
			res.render('user-create', {_id: _id})
		}
	})

	function check(user) {
		// TODO
		return user
	}
});

router.get('/retrive', function(req, res) {
	db.retriveUser(function(err, users) {
		if (err) {
			res.end(err.toString())
		}
		else {
			res.render('user-retrive', {users: users})
		}
	})
});

router.get('/update', function(req, res) {
	res.render('user-update');
});

router.get('/delete', function(req, res) {
	res.render('user-delete');
});

module.exports = router;
