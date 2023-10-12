// const WebSocket = require("ws");
// const https = require("https");

// const APIKey = "";

// const options = {
//     hostname: 'api.binance.com',
//     port: 443,
//     path: '/',
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//         'X-MBX-APIKEY': APIKey
//     }
// };

// options.path = '/api/v3/userDataStream';

// async function updatingListenkey() {

//     return new Promise(function (resolve, reject) {
//         const req = https.request(options, (res) =& gt; {
//             //console.log(&#39;status code:&#39;, res.statusCode);
//             console.log(Date.now(),&#34;listenkey updated &#34;);
//     res.setEncoding(&#39; utf8 &#39;);
//     res.on(&#39; data &#39;, (chunk) =& gt; {
//         resolve(chunk);
//     });
// });

// req.on(&#39; error &#39;, (e) =& gt; {
//     console.error(e);
// });

// req.end();
// })
// }

// async function ws() {
//     let listenkey = await updatingListenkey();
//     listenkey = JSON.parse(listenkey)
//     //console.log(listenkey);
//     let url = "wss://stream.binance.com:9443/stream";
//     let path = url + "?streams=" + listenkey"listenKey";
//     console.log(path)
//     const wss = new WebSocket(path)

//     wss.on(&#39; open &#39;, () =& gt; {
//         console.log(Date.now(),&#34;open successful &#34;);
//     })

//     wss.on(&#39; close &#39;, () =& gt; {
//         console.log(Date.now(),&#34; closed &#34;);
//     })

//     wss.on(&#39; message &#39;, data =& gt; {
//         console.log(Date.now(), data);
//     })
// }

// async function run() {
//     await ws();
//     options.method = "PUT";
//     let time = 30 * 60000;
//     setInterval(updatingListenkey, 2000);

// }

// run()