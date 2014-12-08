var db = require('./lib/db')
var express = require('express');
var router = express.Router();
var fs = require('fs')
var path = require('path')

var router_pattern = /^\/([_a-zA-Z]+)\/(create|retrive|update|delete)/

function loadDef(target) {
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

	return def
}

router.get(router_pattern, function(req, res) {
	var target = req.params[0]
	var action = req.params[1]

	res.render('crud', {
		target: target,
		action: action,
		targetDef: loadDef(target),
		result: {}
	})
});

router.post(router_pattern, function(req, res) {
	var target = req.params[0]
	var action = req.params[1]

	switch (action) {
		case 'create':
			db.create(target, req.body, createCb)
			break
		case 'retrive':
			db.retrive(target, retriveCb)
			break
		case 'update':
			var _id = req.body._id
			var item = ((delete req.body._id), req.body)
			db.update(target, _id, item, updateCb)
			break
		case 'delete':
			db.delete_(target, req.body._id, deleteCb)
			break
		default:
			throw new Error('stupid programmer')
	}

	function createCb(err, _id) {
		res.render('crud', {
			target: target,
			action: action,
			targetDef: loadDef(target),
			result: {
				err: err,
				_id: _id
			}
		})
	}

	function retriveCb(err, list) {
		res.render('crud', {
			target: target,
			action: action,
			targetDef: loadDef(target),
			result: {
				err: err,
				list: list
			}
		})
	}

	function updateCb(err, count) {
		res.render('crud', {
			target: target,
			action: action,
			targetDef: loadDef(target),
			result: {
				err: err,
				count: count
			}
		})
	}

	function deleteCb(err, count) {
		res.render('crud', {
			target: target,
			action: action,
			targetDef: loadDef(target),
			result: {
				err: err,
				count: count
			}
		})
	}
})

module.exports = router;
