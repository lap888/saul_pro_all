/* 测试并集
 * @Author: topbrids@gmail.com 
 * @Date: 2023-07-13 23:10:45 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2023-07-13 23:19:01
 */


var a = [
    { id: '001', name: 'product01' },
    { id: '002', name: 'product02' },
    { id: '003', name: 'product03' },
    { id: '004', name: 'product04' },
    { id: '005', name: 'product05' }
];
var b = [
    { id: '003', name: 'product03' },
    { id: '006', name: 'product06' },
    { id: '007', name: 'product07' },
    { id: '008', name: 'product08' },

];
var obj = {};
var arr = a.concat(b);
// 交集：定义一个对象，通过其属性值是否出现多次判断交集
let c = arr.reduce(function (pre, cur) {
    obj.hasOwnProperty(cur.id) ? pre.push(cur) : obj[cur.id] = true;
    return pre;
}, []);

// let d = a.filter(v => b.includes(b1 => b1.id == v.id))

console.log(obj)
console.log(arr)
console.log(c)