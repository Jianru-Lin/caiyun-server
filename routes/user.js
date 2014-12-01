var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
	res.render('user');
});

router.get('/create', function(req, res) {
	res.render('user-create');
});

router.get('/retrive', function(req, res) {
	res.render('user-retrive');
});

router.get('/update', function(req, res) {
	res.render('user-update');
});

router.get('/delete', function(req, res) {
	res.render('user-delete');
});

module.exports = router;
