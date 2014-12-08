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
			try {
				cb(err, result)
			}
			finally {
				closeDb(db)				
			}
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

// # cb(err, cursor)
function retriveDb(db, collectionName, criteria, projection, cb) {
	cb = cb || _cb

	log('[retriveDb] start')
	log('[retriveDb] collectionName=' + collectionName)
	log('[retriveDb] criteria=' + criteria)
	log('[retriveDb] projection=' + projection)

	try {
		var cursor = db.collection(collectionName).find(criteria || {}, projection || {})
		setTimeout(function() {
			log('[retriveDb] end')
			cb(undefined, cursor)
		}, 0)
	} 
	catch (ex) {
		log('[retriveDb] failure, ' + ex.toString())
		throw ex
	}
}

function retriveDbList(db, collectionName, criteria, projection, cb) {
	cb = cb || _cb

	log('[retriveDbList] start')

	retriveDb(db, collectionName, criteria, projection, condition(retriveDbSuccess, retriveDbFailure))

	function retriveDbSuccess(err, cursor) {
		cursor.toArray(condition(toArraySuccess, toArrayFailure, toArrayFinally))

		function toArraySuccess(err, list) {
			log('[retriveDbList] list=' + jsonstr(list))
		}

		function toArrayFailure(err, list) {
			log('[retriveDbList] failure, ' + err.toString())
		}

		function toArrayFinally(err, list) {
			log('[retriveDbList] end')
			cb(err, list)
		}
	}

	function retriveDbFailure(err, cursor) {
		log('[retriveDbList] end')
		cb(err, cursor)
	}
}

function retriveDbListOnce(collectionName, criteria, projection, cb) {
	cb = cb || _cb

	connectDb(condition(connectDbSuccess, cb))

	function connectDbSuccess(err, db) {
		retriveDbList(db, collectionName, criteria, projection, condition(retriveDbListSuccess, retriveDbListFailure, retriveDbFinally))

		function retriveDbListSuccess(err, list) {
			// nothing to do
		}

		function retriveDbListFailure(err, list) {
			// nothing to do
		}

		function retriveDbFinally(err, list) {
			try {
				cb(err, list)
			}
			finally {
				closeDb(db)
			}
		}
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

	retriveDbListOnce('user', undefined, undefined, condition(retriveDbListOnceSuccess, retriveDbListOnceFailure, retriveDbListOnceFinally))

	function retriveDbListOnceSuccess(err, list) {
		// nothing to do
	}

	function retriveDbListOnceFailure(err, list) {
		// nothing to do
	}

	function retriveDbListOnceFinally(err, list) {
		cb(err, list)
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

// # cb(err, count)
exports.updateUser = function updateUser(_id, user, cb) {
	cb = cb || _cb
	
	log('[updateUser] start')
	log('[updateUser] _id=' + _id)
	log('[updateUser] user=' + jsonstr(user))

	var count = undefined
	_id = check(_id)
	user = safeCopy(user)
	updateDbOnce('user', {_id: new mongodb.ObjectID(_id)}, user, undefined, condition(updateDbOnceSuccess, updateDbOnceFailure, updateDbOnceFinally))

	function updateDbOnceSuccess(err, result) {
		count = parseInt(result.n) > 0 ? result.n : 0
		log('[updateUser] success, count=' + count)
	}

	function updateDbOnceFailure(err, result) {
		// nothing to do
	}

	function updateDbOnceFinally(err, result) {
		log('[updateUser] end')
		cb(err, count)
	}

	function check(_id) {
		// TODO
		return _id
	}

	function safeCopy(user) {
		// TODO
		return user
	}
}


// # cb(err, _id)
exports.create = function create(collectionName, item, cb) {
	cb = cb || _cb
	
	log('[create] start')
	log('[create] collectionName=' + collectionName)
	log('[create] item=' + jsonstr(item))

	var _id = undefined
	insertDbOnce(collectionName, item, condition(insertDbOnceSuccess, insertDbOnceFailure, insertDbOnceFinally))

	function insertDbOnceSuccess(err, result) {
		_id = result.ops[0]._id
		log('[create] success, _id=' + _id)
	}

	function insertDbOnceFailure(err, result) {
		// nothing to do
	}

	function insertDbOnceFinally(err, result) {
		log('[create] end')
		cb(err, _id)
	}
}

// # cb(err, list)
exports.retrive = function retrive(collectionName, cb) {

	cb = cb || _cb

	log('[retrive] start')
	log('[retrive] collectionName=' + collectionName)

	retriveDbListOnce(collectionName, undefined, undefined, condition(retriveDbListOnceSuccess, retriveDbListOnceFailure, retriveDbListOnceFinally))

	function retriveDbListOnceSuccess(err, list) {
		// nothing to do
	}

	function retriveDbListOnceFailure(err, list) {
		// nothing to do
	}

	function retriveDbListOnceFinally(err, list) {
		log('[retrive] end')
		cb(err, list)
	}

}

// # cb(err, count)
exports.update = function update(collectionName, _id, item, cb) {
	cb = cb || _cb
	
	log('[update] start')
	log('[update] collectionName=' + collectionName)	
	log('[update] _id=' + _id)
	log('[update] item=' + jsonstr(item))

	var count = undefined
	updateDbOnce(collectionName, {_id: new mongodb.ObjectID(_id)}, item, undefined, condition(updateDbOnceSuccess, updateDbOnceFailure, updateDbOnceFinally))

	function updateDbOnceSuccess(err, result) {
		count = result.n
		log('[update] success, count=' + count)
	}

	function updateDbOnceFailure(err, result) {
		// nothing to do
	}

	function updateDbOnceFinally(err, result) {
		log('[update] end')
		cb(err, count)
	}
}

// # cb(err, count)
exports.delete_ = function delete_(collectionName, _id, cb) {
	cb = cb || _cb

	log('[delete] start')
	log('[delete] collectionName=' + collectionName)
	log('[delete] _id=' + _id)

	var count = undefined
	deleteDbOnce(collectionName, {_id: new mongodb.ObjectID(_id)}, condition(deleteDbOnceSuccess, deleteDbOnceFailure, deleteDbOnceFinally))

	function deleteDbOnceSuccess(err, result) {
		count = result.n
		log('[delete] success, count=' + count)
	}

	function deleteDbOnceFailure(err, result) {
		// nothing to do
	}

	function deleteDbOnceFinally(err, result) {
		log('[delete] end')
		cb(err, count)
	}
}