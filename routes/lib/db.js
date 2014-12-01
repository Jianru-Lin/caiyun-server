var MongoClient = require('mongodb').MongoClient
var assert = require('assert')

var dbUrl = 'mongodb://localhost:27017/caiyun'

function vstr(v) {
	switch (v) {
		case undefined:
			return 'undefined'
		case null:
			return 'null'
		default:
			return v.toString()
	}
}

function connectDb(cb) {
	console.log('[connectDb] start')
	MongoClient.connect(dbUrl, function(err, db) {
		if (err) {
			console.log('[connectDb] error: ' + vstr(err))
		}
		else {
			console.log('[connectDb] success')
		}
		console.log('[connectDb] end')
		if (cb) cb(err, db)
	})
}

function insertDb(db, collectionName, item, cb) {
	console.log('[insertDb] start')
	console.log('[insertDb] collectionName=' + vstr(collectionName))
	console.log('[insertDb] item=' + vstr(item))
	db.collection(collectionName).insert(item, function(err, result) {
		if (err) {
			console.log('[insertDb] error:', vstr(err))
		}
		else {
			console.log('[insertDb] success')
		}
		console.log('[insertDb] end')
		if (cb) cb(err, result)
	})
}

function closeDb(db) {
	console.log('[closeDb] start')
	db.close()
	console.log('[closeDb] end')
}

exports.createUser = function (user, cb) {
	
	console.log('[createUser] start')
	console.log('[createUser] user=' + vstr(user))
	user = safeCopy(user)

	connectDb(function(err, db) {
		insertDb(db, 'user', user, function(err, result) {
			closeDb(db)
			if (err) {
				console.log('[createUser] error:', err)
			}
			else {
				console.log('[createUser] success, id:', result.ops[0]._id)
			}
			console.log('[createUser] end')
			if (cb) cb(err, err ? undefined : result.ops[0]._id)
		})
	})

	function safeCopy(user) {
		// todo
		return user
	}
}

exports.createUser({}, function(err, id) {
})