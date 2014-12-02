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
	log('[connectDb] start')
	MongoClient.connect(dbUrl, function(err, db) {
		if (err) {
			log('[connectDb] error: ' + vstr(err))
		}
		else {
			log('[connectDb] success')
		}
		log('[connectDb] end')
		if (cb) cb(err, db)
	})
}

function insertDb(db, collectionName, item, cb) {
	log('[insertDb] start')
	log('[insertDb] collectionName=' + vstr(collectionName))
	log('[insertDb] item=' + vstr(item))
	db.collection(collectionName).insert(item, function(err, result) {
		if (err) {
			log('[insertDb] error:', vstr(err))
		}
		else {
			log('[insertDb] success')
		}
		log('[insertDb] end')
		if (cb) cb(err, result)
	})
}

function retriveDb(db, collectionName, criteria, projection) {
	log('[retriveDb] start')
	log('[retriveDb] collectionName=' + collectionName)
	log('[retriveDb] criteria=' + criteria)
	log('[retriveDb] projection=' + projection)

	try {
		var cursor = db.collection(collectionName).find(criteria, projection)
		return cursor
	} catch(ex) {
		log('[retriveDb] exception: ' + ex.toString())
		throw ex
	} finally {
		log('[retriveDb] end')		
	}
}

function closeDb(db) {
	log('[closeDb] start')
	db.close()
	log('[closeDb] end')
}

// # cb(err, id)
exports.createUser = function(user, cb) {
	
	log('[createUser] start')
	log('[createUser] user=' + vstr(user))
	user = safeCopy(user)

	connectDb(function(err, db) {
		if (err) {
			log('[createUser] end')
			if (cb) cb(err, undefined)
			return
		}

		insertDb(db, 'user', user, function(err, result) {
			closeDb(db)
			if (err) {
				log('[createUser] error:', err)
			}
			else {
				log('[createUser] success, id:', result.ops[0]._id)
			}
			log('[createUser] end')
			if (cb) cb(err, err ? undefined : result.ops[0]._id)
		})
	})

	function safeCopy(user) {
		// todo
		return user
	}
}

// # cb(err, userList)
exports.retriveUser = function(cb) {

	cb = cb || _cb

	log('[retriveUser] start')

	connectDb(function(err, db) {
		if (err) {
			log('[retriveUser] end')
			cb(err, undefined)
			return
		}


	})
}

function log() {
	return console.log.apply(console, arguments)
}

function _cb() {

}

exports.createUser({}, function(err, id) {
})