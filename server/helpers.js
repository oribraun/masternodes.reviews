var obj = {
    get_input_addresses: function(wallet, vin, vout) {
        var promise = new Promise(function(resolve, reject) {
            var addresses = [];
            if (vin.coinbase) {
                var amount = 0;
                for (var i in vout) {
                    amount = amount + parseFloat(vout[i].value);
                }
                addresses.push({hash: 'coinbase', amount: amount});
                resolve(addresses);
            } else {
                // getRawTransaction(wallet, vin.txid).then(function(tx){
                //     if (tx && tx.vout) {
                //         var loop = true;
                //         for(var j = 0; j < tx.vout.length && loop; j++) {
                //             if (tx.vout[i].n == vin.vout) {
                //                 if (tx.vout[i].scriptPubKey.addresses && tx.vout[i].scriptPubKey.addresses.length) {
                //                     addresses.push({hash: tx.vout[i].scriptPubKey.addresses[0], amount: tx.vout[i].value});
                //                 }
                //                 loop = false;
                //             }
                //         }
                //         resolve(addresses);
                //     } else {
                //         resolve();
                //     }
                // }).catch(function(err) {
                //     resolve(addresses);
                // })
            }
        })
        return promise;
    },
    convert_to_satoshi: function(amount) {
        var promise = new Promise(function(resolve, reject) {
            // fix to 8dp & convert to string
            var fixed = amount.toFixed(8).toString();
            // remove decimal (.) and return integer
            resolve(parseInt(fixed.replace('.', '')));
        });
        return promise;
    },
    is_unique: function(array, object) {
        var promise = new Promise(function(resolve, reject) {
            var unique = true;
            var index = null;
            var loop = true;
            // for(var i = 0; i < array.length && loop; i++) {
            //     if (array[i].addresses == object) {
            //         unique = false;
            //         index = i;
            //         loop = false;
            //     }
            // }
            var map = array.map(function(o) { return o.addresses});
            var i = map.indexOf(object);
            if(i > -1) {
                index = i;
            }
            resolve(unique, index);
        });
        return promise;
    },
    prepare_vin:  function(wallet,tx) {
        var promise = new Promise(function(resolve, reject) {
            var arr_vin = [];
            for (var i = 0; i < tx.vin.length; i++) {
                (function(i) {
                    obj.get_input_addresses(wallet,tx.vin[i], tx.vout).then(function (addresses) {
                        obj.is_unique(arr_vin, addresses[0].hash).then(function (unique, index) {
                            if (unique == true) {
                                obj.convert_to_satoshi(parseFloat(addresses[0].amount)).then(function (amount_sat) {
                                    arr_vin.push({addresses: addresses[0].hash, amount: amount_sat});
                                });
                            } else {
                                obj.convert_to_satoshi(parseFloat(addresses[0].amount)).then(function (amount_sat) {
                                    arr_vin[index].amount = arr_vin[index].amount + amount_sat;
                                });
                            }
                            if (i === tx.vin.length - 1) {
                                resolve(arr_vin)
                            }
                        }).catch(function (err) {

                        })
                    }).catch(function (err) {

                    })
                })(i)
            }
        });
        return promise;
    },
    prepare_vout: function(vout, txid, vin) {
        var promise = new Promise(function(resolve, reject) {
            var arr_vout = [];
            var arr_vin = [];
            arr_vin = vin;
            if(!vout.length) {
                resolve({vout: arr_vout, nvin: arr_vin});
            }
            for (var i = 0; i < vout.length; i++) {
                (function(i) {
                    if (vout[i].scriptPubKey.type != 'nonstandard' && vout[i].scriptPubKey.type != 'nulldata' && vout[i].scriptPubKey.addresses && vout[i].scriptPubKey.addresses.length) {
                            obj.is_unique(arr_vout, vout[i].scriptPubKey.addresses[0]).then(function (unique, index) {
                                if (unique == true) {
                                    // unique vout
                                    obj.convert_to_satoshi(parseFloat(vout[i].value)).then(function (amount_sat) {
                                        arr_vout.push({addresses: vout[i].scriptPubKey.addresses[0], amount: amount_sat});
                                        if(i === vout.length - 1) {
                                            cont();
                                        }
                                    });
                                } else {
                                    // already exists
                                    obj.convert_to_satoshi(parseFloat(vout[i].value)).then(function (amount_sat) {
                                        arr_vout[index].amount = arr_vout[index].amount + amount_sat;
                                        if(i === vout.length - 1) {
                                            cont();
                                        }
                                    });
                                }
                            })
                    } else {
                        if(i === vout.length - 1) {
                            cont();
                        }
                    }
                })(i)
            }
            function cont()
            {
                if (vout[0].scriptPubKey.type == 'nonstandard') {
                    if (arr_vin.length > 0 && arr_vout.length > 0) {
                        if (arr_vin[0].addresses == arr_vout[0].addresses) {
                            //PoS
                            arr_vout[0].amount = arr_vout[0].amount - arr_vin[0].amount;
                            arr_vin.shift();
                            resolve({vout: arr_vout, nvin: arr_vin});
                        } else {
                            resolve({vout: arr_vout, nvin: arr_vin});
                        }
                    } else {
                        resolve({vout: arr_vout, nvin: arr_vin});
                    }
                } else {
                    resolve({vout: arr_vout, nvin: arr_vin});
                }
            }
        });
        return promise;
    },
    calculate_total: function(vout) {
        var promise = new Promise(function(resolve, reject) {
            var total = 0;
            for (var i in vout) {
                total = total + vout[i].amount;
            }
            resolve(total);
        });
        return promise;
    },
    getFinishTime: function(startTime) {
        var endTime = new Date();
        // console.log('startTime', startTime)
        // console.log('endTime', endTime)
        var diff = endTime - startTime;
        var msec = diff;
        var hh = Math.floor(msec / 1000 / 60 / 60);
        msec -= hh * 1000 * 60 * 60;
        var mm = Math.floor(msec / 1000 / 60);
        msec -= mm * 1000 * 60;
        var ss = Math.floor(msec / 1000);
        msec -= ss * 1000;
        // console.log('endTime - startTime', hh + ":" + mm + ":" + ss + "." + msec);
        // console.log('blocks.length', blocks.length);
        return (hh + ":" + mm + ":" + ss + "." + msec);
    }
}

module.exports = obj;
