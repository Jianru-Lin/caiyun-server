var MongoClient = require('mongodb').MongoClient
var assert = require('assert')

var dbUrl = 'mongodb://localhost:27017/caiyun'

// # cb(err, db)
function connectDb(cb) {
	cb = cb || _cb
	log('[connectDb] start')
	MongoClient.connect(dbUrl, condition(
		// success
		function(err, db) {
			log('[connectDb] success')
		},
		// failure
		function(err, db) {
			log('[connectDb] error: ' + err)
		},
		// always
		function(err, db) {
			log('[connectDb] end')
			cb(err, db)
		})
	)
}

function insertDb(db, collectionName, item, cb) {
	log('[insertDb] start')
	log('[insertDb] collectionName=' + collectionName)
	log('[insertDb] item=' + item)
	db.collection(collectionName).insert(item, function(err, result) {
		if (err) {
			log('[insertDb] error:', err)
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
		var cursor = db.collection(collectionName).find(criteria || {}, projection || {})
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
exports.createUser = function createUser(user, cb) {
	cb = cb || _cb
	
	log('[createUser] start')
	log('[createUser] user=' + user)
	user = safeCopy(user)

	connectDb(condition(connectDbSuccess, connectDbFailure))

	function connectDbSuccess(err, db) {
		var id = undefined
		insertDb(db, 'user', user, condition(insertDbSuccess, insertDbFailure, insertDbFinally))

		function insertDbSuccess(err, result) {
			id = result.ops[0]._id
			p(createUser, 'success, id=' + id)
		}

		function insertDbFailure(err, result) {
			// nothing to do
		}

		function insertDbFinally(err, result) {
			p(createUser, 'end')
			closeDb(db)
			cb(err, id)
		}
	}

	function connectDbFailure(err, db) {
		p(createUser, 'end')
		cb(err, undefined)
	}

	function safeCopy(user) {
		// todo
		return user
	}
}

// # cb(err, userList)
exports.retriveUser = function retriveUser(cb) {

	cb = cb || _cb

	p(retriveUser, 'start')

	connectDb(function(err, db) {
		if (err) {
			p(retriveUser, 'end')
			cb(err, undefined)
			return
		}

		try {
			retriveDb(db, 'user').toArray(function(err, list) {

				if (err) {
					p(retriveUser, 'end')
					closeDb(db)
					cb(err, undefined)
					return
				}

				p(retriveUser, 'list=' + JSON.stringify(list))
				closeDb(db)
				p(retriveUser, 'end')
				cb(undefined, list)
			})
		}
		catch (ex) {
			p(retriveUser, 'end')
			closeDb(db)
			return
		}

	})

	function ifNoError(next) {
		return errorHandler

		// # errorHandler(err, ...)
		function errorHandler(err) {
			if (err) {
				closeDb()
				p(retriveUser, 'end')
				cb(err, undefined)
			}
			else {
				next([].slice.apply(arguments, [1]))
			}
		}
	}
}

// scb -> success callback
// fcb -> failure callback
// acb -> always callback
function condition(scb, fcb, acb) {
	scb = scb || _cb
	fcb = fcb || _cb
	acb = acb || _cb

	return proxy

	function proxy(err) {
		try {
			if (err) {
				log(err.toString())
				fcb.apply(this, arguments)
			}
			else {
				scb.apply(this, arguments)
			}
		} finally {
			acb.apply(this, arguments)
		}
	}
}

// p(func, ...)
function p() {
	var args = [].slice.apply(arguments)
	if (args.length > 0) {
		args[0] = '[' + args[0].name + ']'
	}
	log.apply(this, args)
}

function log() {
	return console.log.apply(console, arguments)
}

function _cb() {

}

exports.createUser({})

//exports.retriveUser()