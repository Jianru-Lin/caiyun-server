var mongodb = require('mongodb')
var MongoClient = mongodb.MongoClient
var assert = require('assert')

var dbUrl = 'mongodb://localhost:27017/caiyun'

// empty function
function _cb() {

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

// shortcut for console.log()
function log() {
	return console.log.apply(console, arguments)
}

// p(func, ...)
function p() {
	var args = [].slice.apply(arguments)
	if (args.length > 0) {
		args[0] = '[' + args[0].name + ']'
	}
	log.apply(this, args)
}

// # cb(err, db)
function connectDb(cb) {
	cb = cb || _cb

	log('[connectDb] start')
	MongoClient.connect(dbUrl, condition(connectSuccess, connectFailure, connectFinally))

	function connectSuccess(err, db) {
		log('[connectDb] success')
	}

	function connectFailure(err, db) {
		log('[connectDb] failure, ' + err)
	}

	function connectFinally(err, db) {
		log('[connectDb] end')
		cb(err, db)
	}
}

function insertDb(db, collectionName, item, cb) {
	cb = cb || _cb

	log('[insertDb] start')
	log('[insertDb] collectionName=' + collectionName)
	log('[insertDb] item=' + JSON.stringify(item))

	db.collection(collectionName).insert(item, condition(insertSuccess, insertFailure, insertFinally))

	function insertSuccess(err, result) {
		log('[insertDb] success')
	}

	function insertFailure(err, result) {
		log('[insertDb] failure, ', err)
	}

	function insertFinally(err, result) {
		log('[insertDb] end')
		cb(err, result)
	}
}

function insertDbOnce(collectionName, item, cb) {
	cb = cb || _cb

	connectDb(condition(connectDbSuccess, cb))

	function connectDbSuccess(err, db) {

		// we will insert the data to database
		// and after that, we will invoke the callback no matter success or not
		// then closeDb will be invoked

		insertDb(db, collectionName, item, condition(insertDbSuccess, insertDbFailure, insertDbFinally))

		function insertDbSuccess(err, result) {
			// nothing to do
		}

		function insertDbFailure(err, result) {
			// nothing to do
		}

		function insertDbFinally(err, result) {
			cb(err, result)
			closeDb(db)
		}
	}
}

function retriveDb(db, collectionName, criteria, projection) {
	log('[retriveDb] start')
	log('[retriveDb] collectionName=' + collectionName)
	log('[retriveDb] criteria=' + criteria)
	log('[retriveDb] projection=' + projection)

	try {
		var cursor = db.collection(collectionName).find(criteria || {}, projection || {})
		return cursor
	} 
	catch(ex) {
		log('[retriveDb] failure, ' + ex.toString())
		throw ex
	} 
	finally {
		log('[retriveDb] end')
	}
}

// # cb(err, result)
function deleteDb(db, collectionName, criteria, cb) {
	cb = cb || _cb

	log('[deleteDb] start')
	log('[deleteDb] collectionName=' + collectionName)
	log('[deleteDb] criteria=' + JSON.stringify(criteria))

	try {
		db.collection(collectionName).remove(criteria, condition(removeSuccess, removeFailure, removeFinally))
	}
	catch(ex) {
		log('[deleteDb] failure, ' + ex.toString())
		log('[deleteDb] end')
		throw ex
	}

	function removeSuccess(err, detail) {
		log('[deleteDb] success, ' + JSON.stringify(detail.result))
	}

	function removeFailure(err, detail) {
		log('[deleteDb] failure, ' + err)
	}

	function removeFinally(err, detail) {
		log('[deleteDb] end')
		cb(err, detail.result)
	}
}

function deleteDbOnce(collectionName, criteria, cb) {
	cb = cb || _cb

	connectDb(condition(connectDbSuccess, cb))

	function connectDbSuccess(err, db) {

		// we will delete the data in the database
		// and after that, we will invoke the callback no matter success or not
		// then closeDb will be invoked

		deleteDb(db, collectionName, criteria, condition(deleteDbSuccess, deleteDbFailure, deleteDbFinally))

		function deleteDbSuccess(err, result) {
			// nothing to do
		}

		function deleteDbFailure(err, result) {
			// nothing to do
		}

		function deleteDbFinally(err, result) {
			cb(err, result)
			closeDb(db)
		}
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
	log('[createUser] user=' + JSON.stringify(user))
	user = safeCopy(user)
	var id = undefined

	insertDbOnce('user', user, condition(insertDbOnceSuccess, insertDbOnceFailure, insertDbOnceFinally))

	function insertDbOnceSuccess(err, result) {
		id = result.ops[0]._id
		p(createUser, 'success, id=' + id)
	}

	function insertDbOnceFailure(err, result) {
		// nothing to do
	}

	function insertDbOnceFinally(err, result) {
		p(createUser, 'end')
		cb(err, id)
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

// # cb(err, count)
exports.deleteUser = function deleteUser(_id, cb) {
	cb = cb || _cb

	log('[deleteUser] start')
	log('[deleteUser] _id=' + _id)
	_id = check(_id)
	var count = undefined

	deleteDbOnce('user', {_id: new mongodb.ObjectID(_id)}, condition(deleteDbOnceSuccess, deleteDbOnceFailure, deleteDbOnceFinally))

	function deleteDbOnceSuccess(err, result) {
		count = parseInt(result.n) > 0 ? result.n : 0
		log('[deleteUser] success, count=' + count)
	}

	function deleteDbOnceFailure(err, result) {
		// nothing to do
	}

	function deleteDbOnceFinally(err, result) {
		log('[deleteUser] end')
		cb(err, count)
	}

	function check(_id) {
		// TODO
		return _id
	}
}

//exports.createUser({})

//exports.retriveUser()

//deleteDbOnce('user', {_id: new mongodb.ObjectID('547d5e784d2ee4c4067db9cc')})

//exports.deleteUser('547d5e784d2ee4c4067db9cc')