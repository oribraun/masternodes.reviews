var AddressToUpdate = require('../models/address_to_update');
const helpers = require('../../helpers');
var db = require('./../db');

function getAll(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    AddressToUpdate[db.getCurrentConnection()].find({}).sort(sort).limit(limit).exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb(null);
        }
    });
}

function updateOne(obj, cb) { // update or create
    AddressToUpdate[db.getCurrentConnection()].findOne({_id: obj._id}, function(err, address) {
        if(err) {
            return cb(err);
        }
        if(address) { // exist
            address.address = obj.address;
            address.txid = obj.txid;
            address.txid_timestamp = obj.txid_timestamp;
            address.amount = obj.amount;
            address.type = obj.type;
            address.blockindex = obj.blockindex;
            address.save(function (err, tx) {
                if (err) {
                    return cb(err);
                } else {
                    return cb();
                }
            });
        } else { // create new
            var newAddress = new AddressToUpdate[db.getCurrentConnection()]({
                address: obj.address,
                txid: obj.txid,
                txid_timestamp: obj.txid_timestamp,
                amount: obj.amount,
                type: obj.type,
                blockindex: obj.blockindex,
            });
            newAddress.save(function(err) {
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

function getOne(address, cb) {
    AddressToUpdate[db.getCurrentConnection()].findOne({address: address}, function(err, address) {
        if(address) {
            return cb(address);
        } else {
            return cb();
        }
    });
}

function deleteOne(id, cb) {
    AddressToUpdate[db.getCurrentConnection()].deleteOne({_id: id}, function(err, tx) {
        if(tx) {
            return cb();
        } else {
            return cb(null);
        }
    });
}

function deleteAll(cb) {
    AddressToUpdate[db.getCurrentConnection()].deleteMany({},function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function count(cb) {
    AddressToUpdate[db.getCurrentConnection()].countDocuments({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function getMany(address, cb) {
    AddressToUpdate[db.getCurrentConnection()].find({address: address}, function(err, address) {
        if(address) {
            return cb(address);
        } else {
            return cb();
        }
    });
}

function getOneJoin(address, limit, offset, cb) {
    AddressToUpdate[db.getCurrentConnection()].aggregate([
        { $match : { address : address } },
        {$sort:{blockindex:-1}},
        {$limit: parseInt(limit) + parseInt(offset)},
        {$skip: parseInt(offset)},
        {
            "$unwind": {
                "path": "$_id",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$group": {
                "_id": "$address",
                "txs" : { "$push": {txid: "$txid", timestamp: "$txid_timestamp", amount: "$amount", type: "$type", blockindex: "$blockindex"} },
                // "received" : { "$first": "$received" },
                // "a_id" : { "$first": "$a_id" },
                // "txid": "4028d18fa7674318ca3b2f9aaf4594125346ffb8b42e2371ca41d0e5ab99c834",
                // "txid_timestamp": "1546794007",
                // "amount": 152207000000,
                // "type": "vout",
                // "blockindex": 5,
                "createdAt" : { "$first": "$createdAt" },
                "updatedAt" : { "$first": "$updatedAt" },
            }
        },
    ]).allowDiskUse(true).exec(function(err, address) {
        if(address && address.length) {
            return cb(address[0]);
        } else {
            return cb(null);
        }
    });
}

function getRichlist(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order == 'desc' ? -1 : 1;
    AddressToUpdate[db.getCurrentConnection()].aggregate([
        // {
        //     "$unwind": {
        //         "path": "$_id",
        //         "preserveNullAndEmptyArrays": true
        //     }
        // },
        {
            "$group": {
                "_id": "$address",
                "txs" : { "$push": {txid: "$txid", timestamp: "$txid_timestamp", amount: "$amount", type: "$type", blockindex: "$blockindex"} },
                // "received" : { "$first": "$received" },
                // "a_id" : { "$first": "$a_id" },
                // "txid": "4028d18fa7674318ca3b2f9aaf4594125346ffb8b42e2371ca41d0e5ab99c834",
                // "txid_timestamp": "1546794007",
                // "amount": 152207000000,
                // "type": "vout",
                "sent" : { "$sum":
                        {$cond:
                                {if: { $eq: [ "$_id", "coinbase" ] },
                                    then: "$amount",
                                    else: {$cond:
                                            {if: { $eq: [ "$type", "vin" ] },
                                                then: "$amount",
                                                else: 0 }} }}
                },
                "received" : { "$sum":
                        {$cond:
                                {if: { $eq: [ "$_id", "coinbase" ] },
                                    then: 0,
                                    else: {$cond:
                                            {if: { $eq: [ "$type", "vout" ] },
                                                then: "$amount",
                                                else: 0 }} }}
                },
                // "blockindex": 5,
                // "balance" : { "$sum": "$received" },
                // "received" : { "$sum": "$received" },
                // "sent" : { "$sum": "$sent" },
            },
        },
        {
            "$project": {
                "_id": "$_id",
                // "txs": "$txs",
                "sent": "$sent",
                "received": "$received",
                "balance": {"$subtract": ['$received', '$sent']},
            }
        },
        {$sort:sort},
        {$limit: parseInt(limit)},
    ]).allowDiskUse(true).exec(function(err, address) {
        if(address && address.length) {
            return cb(address);
        } else {
            return cb(err);
        }
    });
}

function countUnique(cb) {
    AddressToUpdate[db.getCurrentConnection()].aggregate([
        {
            "$group": {
                "_id": "$address"
            }
        },
    ]).allowDiskUse(true).exec(function(err, address) {
        if(address) {
            return cb(address.length);
        } else {
            return cb(null);
        }
    });
}

function deleteAllWhereGte(blockindex, cb) {
    AddressToUpdate[db.getCurrentConnection()].deleteMany({blockindex: { $gte: blockindex }}, function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

module.exports.getAll = getAll;
module.exports.updateOne = updateOne;
module.exports.getOne = getOne;
module.exports.deleteOne = deleteOne;
module.exports.deleteAll = deleteAll;
module.exports.count = count;
module.exports.getMany = getMany;
module.exports.getOneJoin = getOneJoin;
module.exports.getRichlist = getRichlist;
module.exports.countUnique = countUnique;
module.exports.deleteAllWhereGte = deleteAllWhereGte;
