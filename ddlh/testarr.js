let a = []
a['eth'] = 199
a['btc'] = 899
console.log(a, a.length, typeof (a))
let b = []
b.push('he')
b.push('ok')
console.log(b, b.length, typeof (b))

let c = b.filter((v,i) => i < 0)
console.log(c)