var db = require('./lib/db')
var express = require('express');
var router = express.Router();
var fs = require('fs')
var path = require('path')

var router_pattern = /^\/([_a-zA-Z]+)\/(create|retrive|update|delete)/

function loadFormDef(target, action) {
	var def

	try {
		def = fs.readFileSync(path.resolve(__dirname, 'crud-def.json'), {encodind: 'utf8'})
		def = JSON.parse(def)
		console.log('def:', JSON.stringify(def))
		def = def[target]
		console.log('def of ' + target + ':', JSON.stringify(def))
	}
	catch (err) {
		console.log(err.toString())
		return
	}

	var formDef

	switch (action) {
		case 'create':
			formDef = def
			break
		case 'retrive':
			formDef = []
			break
		case 'update':
			formDef = def
			formDef.unshift('_id')
			break
		case 'delete':
			formDef = ['_id']
			break
		default:
			throw new Error('stupid programmer')
	}

	return formDef
}

router.get(router_pattern, function(req, res) {
	var target = req.params[0]
	var action = req.params[1]

	res.render('crud', {
		target: target,
		action: action,
		formDef: loadFormDef(target, action)
	})
});

router.post(router_pattern, function(req, res) {
	var target = req.params[0]
	var action = req.params[1]

})

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

router.post('/update', function(req, res) {
	var form = check(req.body)
	var _id = form._id
	var user = (delete form._id, form)

	db.updateUser(_id, user, function(err, count) {
		if (err) {
			res.end(err.toString())
		}
		else {
			res.render('user-update', {count: count})
		}
	})

	function check(form) {
		// TODO
		return form
	}
})

router.get('/delete', function(req, res) {
	res.render('user-delete');
});

router.post('/delete', function(req, res) {
	var _id = check(req.body._id)

	db.deleteUser(_id, function(err, count) {
		if (err) {
			res.end(err.toString())
		}
		else {
			res.render('user-delete', {count: count})
		}
	})

	function check(_id) {
		// TODO
		return _id
	}
})

module.exports = router;
