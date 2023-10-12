const { doDb } = require('./dbMysql')
// let sql3 = "delete from `xq_coin` order by `utime` limit 1"
// doDb(sql3, []).then(dbCoins => {
//     console.log('删除超标元素')
// })

let sql2 = "select * from xq_coin"
doDb(sql2, []).then(dbCoins => {
    let _dbCoins = JSON.stringify(dbCoins)
    if (_dbCoins.startsWith('[')) {
        if (dbCoins.length >= 10) {
            let sql3 = "delete from `xq_coin` order by `utime` limit 1"
            doDb(sql3, []).then(dbCoins => {
                console.log('删除超标元素')
            })
        }
    }
})