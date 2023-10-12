/**
 * 生成随机字符串
 * @param {*} len 
 * @returns 
 */
function randomString(len = 32) {
    let str = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'
    let maxPos = str.length
    let randomStr = ''
    for (let i = 0; i < len; i++) {
        randomStr += str.charAt(Math.floor(Math.random() * maxPos))
    }
    return randomStr.toLowerCase()
}

for (let i = 0; i < 10; i++) {
    console.log(randomString())
}  
