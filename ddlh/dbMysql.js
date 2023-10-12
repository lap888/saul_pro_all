const mysql = require('mysql');
const async = require("async");

const option = {
    host: 'bj-cdb-061ud0fa.sql.tencentcdb.com',
    user: 'hwhj118',
    password: 'Hwhj123---',
    port: '61617',
    database: 'sph_db',
    charset: 'utf8mb4',
    insecureAuth: true,
    connecTimeout: 500,//连接超时
    multipleStatements: true//是否允许一个query中包含多条sql语句
};
let pool;
repool();
//断线重连机制
function repool() {
    //创建连接池
    pool = mysql.createPool({
        ...option,
        waitForConnection: true,//当无连接池可用时，等待(true) 还是抛错(false)
        connectionLimit: 100,//连接限制
        queueLimit: 0//最大连接等待数(0为不限制)
    });
    pool.on('error', err => {
        err.code === 'PROTOCOL_CONNECTION_LOST' && setTimeout(repool, 2000);
    });
    pool.getConnection(err => {
        err && setTimeout(repool, 2000);
    });
}

function doDb(sql, params) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, conn) => {
            if (err) {
                reject(err)
            }
            let sqlParamsList = [sql]
            if (params) {
                sqlParamsList.push(params)
            }
            conn.query(...sqlParamsList, (err, res) => {
                if (err) {
                    reject(err)
                } else {
                    if (res.length == 0) {
                        resolve('')
                    } else if (res.length == 1) {
                        resolve(res[0])
                    } else {
                        resolve(res)
                    }

                }
            })
            pool.releaseConnection(conn);//释放连接池，等待别的连接池使用
        });
    })
}

function doDbExecTrans(sqlparamsEntities) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                reject(err)
            }
            connection.beginTransaction((err) => {
                if (err) {
                    reject(err)
                }
                let funcAry = [];
                sqlparamsEntities.forEach((sql_param) => {
                    let temp = (cb) => {
                        let sql = sql_param.sql;
                        let param = sql_param.params;
                        connection.query(sql, param, function (tErr, rows, fields) {
                            if (tErr) {
                                connection.rollback(function () {
                                    let log = `事务失败,${JSON.stringify(sql_param)} | ${tErr}`
                                    reject(log)
                                });
                            } else {
                                return cb(null, 'ok');
                            }
                        })
                    };
                    funcAry.push(temp);
                });
                async.series(funcAry, (err, result) => {
                    if (err) {
                        connection.rollback((err) => {
                            console.log("transaction error: " + err);
                            connection.release();
                            reject(err)
                        });
                    } else {
                        connection.commit((err, info) => {
                            if (err) {
                                console.log("执行事务失败，" + err);
                                connection.rollback((err) => {
                                    console.log("transaction error: " + err);
                                    connection.release();
                                    reject(err)
                                });
                            } else {
                                connection.release();
                                resolve(true)
                            }
                        })
                    }
                });
            });
        });
    })
}

module.exports = { doDb, doDbExecTrans }