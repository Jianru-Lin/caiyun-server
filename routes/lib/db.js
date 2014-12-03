var mongodb = require('mongodb')
var MongoClient = mongodb.MongoClient
var assert = require('assert')

var dbUrl = 'mongodb://localhost:27017/caiyun'

// empty function
function _cb() {

}

function jsonstr(v) {
	return JSON.stringify(v)
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

// args[args.length - 1] must be the 'cb'
// it can be undefiend or null but can not be omit
function dbOnce(action, args) {
	assert(typeof action === 'function')
	assert(Array.isArray(args))
	assert(args.length > 0)

	cb = args[args.length - 1] || _cb

	connectDb(condition(connectDbSuccess, cb))

	function connectDbSuccess(err, db) {

		// after the action executed, we will invoke the callback no matter success or not
		// then closeDb will be invoked

		// prepend 'db' as the first argument
		args.unshift(db)

		// replace the 'callback' with our own one
		args[args.length - 1] = condition(actionSuccess, actionFailure, actionFinally)
		action.apply(this, args)

		function actionSuccess(err, result) {
			// nothing to do
		}

		function actionFailure(err, result) {
			// nothing to do
		}

		function actionFinally(err, result) {
			cb(err, result)
			closeDb(db)
		}
	}
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
	log('[insertDb] item=' + jsonstr(item))

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
	dbOnce(insertDb, [collectionName, item, cb])
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
	catch (ex) {
		log('[retriveDb] failure, ' + ex.toString())
		throw ex
	} 
	finally {
		log('[retriveDb] end')
	}
}

function updateDb(db, collectionName, criteria, item, options, cb) {
	cb = cb || _cb

	log('[updateDb] start')
	log('[updateDb] collectionName=' + jsonstr(collectionName))
	log('[updateDb] criteria=' + jsonstr(criteria))
	log('[updateDb] item=' + jsonstr(item))
	log('[updateDb] options=' + jsonstr(options))

	try {
		db.collection(collectionName).update(criteria, item, options, condition(updateSuccess, updateFailure, updateFinally))
	}
	catch (ex) {
		log('[updateDb] failure, ' + ex.toString())
		log('[updateDb] end')
		throw ex
	}

	function updateSuccess(err, detail) {
		log('[updateDb] success, ' + jsonstr(detail.result))
	}

	function updateFailure(err, detail) {
		log('[updateDb] failure, ' + err.toString())
	}

	function updateFinally(err, detail) {
		log('[updateDb] end')
		cb(err, detail.result)
	}
}

function updateDbOnce(collectionName, criteria, item, options, cb) {
	dbOnce(updateDb, [collectionName, criteria, item, options, cb])
}

// # cb(err, result)
function deleteDb(db, collectionName, criteria, cb) {
	cb = cb || _cb

	log('[deleteDb] start')
	log('[deleteDb] collectionName=' + collectionName)
	log('[deleteDb] criteria=' + jsonstr(criteria))

	try {
		db.collection(collectionName).remove(criteria, condition(removeSuccess, removeFailure, removeFinally))
	}
	catch(ex) {
		log('[deleteDb] failure, ' + ex.toString())
		log('[deleteDb] end')
		throw ex
	}

	function removeSuccess(err, detail) {
		log('[deleteDb] success, ' + jsonstr(detail.result))
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
	dbOnce(deleteDb, [collectionName, criteria, cb])
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
	log('[createUser] user=' + jsonstr(user))
	user = safeCopy(user)
	var id = undefined

	insertDbOnce('user', user, condition(insertDbOnceSuccess, insertDbOnceFailure, insertDbOnceFinally))

	function insertDbOnceSuccess(err, result) {
		id = result.ops[0]._id
		log('[createUser] success, id=' + id)
	}

	function insertDbOnceFailure(err, result) {
		// nothing to do
	}

	function insertDbOnceFinally(err, result) {
		log('[createUser] end')
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

	log('[retriveUser] start')

	connectDb(function(err, db) {
		if (err) {
			log('[retriveUser] end')
			cb(err, undefined)
			return
		}

		try {
			retriveDb(db, 'user').toArray(function(err, list) {

				if (err) {
					log('[retriveUser] end')
					closeDb(db)
					cb(err, undefined)
					return
				}

				log('[retriveUser] list=' + jsonstr(list))
				closeDb(db)
				log('[retriveUser] end')
				cb(undefined, list)
			})
		}
		catch (ex) {
			log('[retriveUser] end')
			closeDb(db)
			return
		}

	})
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

//updateDbOnce('user', {_id: new mongodb.ObjectID('547c779e1ebb30f4149beb4f')}, {$set: {email: 'jianru.lin@gmail.com'}})