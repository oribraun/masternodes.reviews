var Block = require('../models/block');
var db = require('./../db');

function getAll(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    Block[db.getCurrentConnection()].find({}).sort(sort).limit(limit).exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb();
        }
    });
}

function getAll1(sortBy, order, limit, offset, cb) {
    var sort = {};
    sort[sortBy] = order;
    Block[db.getCurrentConnection()].find({}).sort(sort).limit(limit).skip(offset).exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb();
        }
    });
}

function getAll2(where, fields, sortBy, order, limit, offset, cb) {
    var sort = {};
    sort[sortBy] = order;
    Block[db.getCurrentConnection()].find(where, fields).sort(sort).limit(limit).skip(offset).exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb();
        }
    });
}

function updateOne(obj, cb) { // update or create
    Block[db.getCurrentConnection()].findOne({blockhash: obj.blockhash}, function(err, block) {
        if(err) {
            return cb(err);
        }
        if(block) { // exist
            block.blockhash = obj.blockhash;
            block.timestamp = obj.timestamp;
            block.blockindex = obj.blockindex;
            block.save(function(err) {
                if (err) {
                    return cb(err);
                } else {
                    //console.log('txid: ');
                    return cb();
                }
            })
        } else { // create new
            // console.log('new')
            var newTx = new Block[db.getCurrentConnection()]({
                blockhash: obj.blockhash,
                timestamp: obj.timestamp,
                blockindex: obj.blockindex,
            });
            newTx.save(function(err) {
                if (err) {
                    return cb(err);
                } else {
                    //console.log('txid: ');
                    return cb();
                }
            });
        }
    });
}

function getOne(blockindex, cb) {
    Block[db.getCurrentConnection()].findOne({blockindex: blockindex}, function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb(null);
        }
    });
}

function deleteOne(txid, cb) {
    Block[db.getCurrentConnection()].deleteOne({txid: txid}, function(err, tx) {
        if(tx) {
            return cb();
        } else {
            return cb(null);
        }
    });
}

function deleteAll(cb) {
    Block[db.getCurrentConnection()].deleteMany({},function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function deleteAllWhereGte(blockindex, cb) {
    Block[db.getCurrentConnection()].deleteMany({blockindex: { $gte: blockindex }}, function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function getBlockByHash(blockhash, cb) {
    Block[db.getCurrentConnection()].findOne({blockhash: blockhash}, function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb(null);
        }
    });
}

function update(coin, options, cb) {
    Block[db.getCurrentConnection()].updateOne({coin: coin}, options, function(err) {
        if(err) {
            return cb(err);
        }
        return cb();
    })
}

function count(cb) {
    Block[db.getCurrentConnection()].countDocuments({}, function (err, count) {
       if(err) {
           cb()
       } else {
           cb(count);
       }
    });
}

function estimatedDocumentCount(cb) {
    Block[db.getCurrentConnection()].estimatedDocumentCount({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

module.exports.getAll = getAll;
module.exports.getAll1 = getAll1;
module.exports.getAll2 = getAll2;
module.exports.updateOne = updateOne;
module.exports.getOne = getOne;
module.exports.deleteOne = deleteOne;
module.exports.deleteAll = deleteAll;
module.exports.deleteAllWhereGte = deleteAllWhereGte;
module.exports.getBlockByHash = getBlockByHash;
module.exports.update = update;
module.exports.count = count;
module.exports.estimatedDocumentCount = estimatedDocumentCount;