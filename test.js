//const { am2tex } = require('../../note/js/asciimath')
const tex2svg = require('./tex2svg')
setTimeout(() => {
  tex2svg('1+1=2').then(console.log)
}, 300)

//console.log(am2tex('{ x + y = a; x - y = b :}'))
//console.log(am2tex('=|1,0;0,1|'))
//console.log(am2tex('{🦉0;0🦉}'))
/*Error: Command failed: magick tmp.svg /home/zmx/app/mirai/data/net.mamoe.mirai-api-http/images/tmp.png
magick: memory allocation failed `tmp.svg' @ error/svg.c/ReadSVGImage/3447.
magick: no images for write '-write' '/home/zmx/app/mirai/data/net.mamoe.mirai-api-http/images/tmp.png' at CLI arg 2 @ error/operation.c/CLINoImageOperator/4893.

    at ChildProcess.exithandler (node:child_process:326:12)
    at ChildProcess.emit (node:events:369:20)
    at maybeClose (node:internal/child_process:1067:16)
    at Process.ChildProcess._handle.onexit (node:internal/child_process:301:5) {
  killed: false,
  code: 1,
  signal: null,
  cmd: 'magick tmp.svg /home/zmx/app/mirai/data/net.mamoe.mirai-api-http/images/tmp.png'
}
*/
//((((- a^2*a1*a2^2*a3 + a^2*a1*a2*a3^3 + a^2*a1*a2*a3*a4^2 + a1^3*a2^2*a3 + a1*a2^4*a3 + 2*a1*a2^2*a3*a4^2)/(2*a^2*a2) + (- a^2*a1*a2 - a^2*a2^2 - a^2*a2*a3 + a^2*a3^3 + a^2*a3*a4^2 + a1^3*a2 + a1*a2*a4^2 + a2^4 + a2^2*a4^2)^3/(27*a^6*a2^3) + ((- a^2*a1*a2 - a^2*a2^2 - a^2*a2*a3 + a^2*a3^3 + a^2*a3*a4^2 + a1^3*a2 + a1*a2*a4^2 + a2^4 + a2^2*a4^2)*(- a^2*a1*a2^2 - a^2*a1*a2*a3 + a^2*a1*a3^3 + a^2*a1*a3*a4^2 - a^2*a2^2*a3 + a^2*a2*a3^3 + a^2*a2*a3*a4^2 + a1^3*a2^2 + a1^3*a2*a3 + a1*a2^4 + 2*a1*a2^2*a4^2 + a1*a2*a3*a4^2 + a2^4*a3 + a2^2*a3*a4^2))/(6*a^4*a2^2))^2 - ((- a^2*a1*a2^2 - a^2*a1*a2*a3 + a^2*a1*a3^3 + a^2*a1*a3*a4^2 - a^2*a2^2*a3 + a^2*a2*a3^3 + a^2*a2*a3*a4^2 + a1^3*a2^2 + a1^3*a2*a3 + a1*a2^4 + 2*a1*a2^2*a4^2 + a1*a2*a3*a4^2 + a2^4*a3 + a2^2*a3*a4^2)/(3*a^2*a2) + (- a^2*a1*a2 - a^2*a2^2 - a^2*a2*a3 + a^2*a3^3 + a^2*a3*a4^2 + a1^3*a2 + a1*a2*a4^2 + a2^4 + a2^2*a4^2)^2/(9*a^4*a2^2))^3)^(1/2) - (- a^2*a1*a2^2*a3 + a^2*a1*a2*a3^3 + a^2*a1*a2*a3*a4^2 + a1^3*a2^2*a3 + a1*a2^4*a3 + 2*a1*a2^2*a3*a4^2)/(2*a^2*a2) - (- a^2*a1*a2 - a^2*a2^2 - a^2*a2*a3 + a^2*a3^3 + a^2*a3*a4^2 + a1^3*a2 + a1*a2*a4^2 + a2^4 + a2^2*a4^2)^3/(27*a^6*a2^3) - ((- a^2*a1*a2 - a^2*a2^2 - a^2*a2*a3 + a^2*a3^3 + a^2*a3*a4^2 + a1^3*a2 + a1*a2*a4^2 + a2^4 + a2^2*a4^2)*(- a^2*a1*a2^2 - a^2*a1*a2*a3 + a^2*a1*a3^3 + a^2*a1*a3*a4^2 - a^2*a2^2*a3 + a^2*a2*a3^3 + a^2*a2*a3*a4^2 + a1^3*a2^2 + a1^3*a2*a3 + a1*a2^4 + 2*a1*a2^2*a4^2 + a1*a2*a3*a4^2 + a2^4*a3 + a2^2*a3*a4^2))/(6*a^4*a2^2))^(1/3) + ((- a^2*a1*a2^2 - a^2*a1*a2*a3 + a^2*a1*a3^3 + a^2*a1*a3*a4^2 - a^2*a2^2*a3 + a^2*a2*a3^3 + a^2*a2*a3*a4^2 + a1^3*a2^2 + a1^3*a2*a3 + a1*a2^4 + 2*a1*a2^2*a4^2 + a1*a2*a3*a4^2 + a2^4*a3 + a2^2*a3*a4^2)/(3*a^2*a2) + (- a^2*a1*a2 - a^2*a2^2 - a^2*a2*a3 + a^2*a3^3 + a^2*a3*a4^2 + a1^3*a2 + a1*a2*a4^2 + a2^4 + a2^2*a4^2)^2/(9*a^4*a2^2))/((((- a^2*a1*a2^2*a3 + a^2*a1*a2*a3^3 + a^2*a1*a2*a3*a4^2 + a1^3*a2^2*a3 + a1*a2^4*a3 + 2*a1*a2^2*a3*a4^2)/(2*a^2*a2) + (- a^2*a1*a2 - a^2*a2^2 - a^2*a2*a3 + a^2*a3^3 + a^2*a3*a4^2 + a1^3*a2 + a1*a2*a4^2 + a2^4 + a2^2*a4^2)^3/(27*a^6*a2^3) + ((- a^2*a1*a2 - a^2*a2^2 - a^2*a2*a3 + a^2*a3^3 + a^2*a3*a4^2 + a1^3*a2 + a1*a2*a4^2 + a2^4 + a2^2*a4^2)*(- a^2*a1*a2^2 - a^2*a1*a2*a3 + a^2*a1*a3^3 + a^2*a1*a3*a4^2 - a^2*a2^2*a3 + a^2*a2*a3^3 + a^2*a2*a3*a4^2 + a1^3*a2^2 + a1^3*a2*a3 + a1*a2^4 + 2*a1*a2^2*a4^2 + a1*a2*a3*a4^2 + a2^4*a3 + a2^2*a3*a4^2))/(6*a^4*a2^2))^2 - ((- a^2*a1*a2^2 - a^2*a1*a2*a3 + a^2*a1*a3^3 + a^2*a1*a3*a4^2 - a^2*a2^2*a3 + a^2*a2*a3^3 + a^2*a2*a3*a4^2 + a1^3*a2^2 + a1^3*a2*a3 + a1*a2^4 + 2*a1*a2^2*a4^2 + a1*a2*a3*a4^2 + a2^4*a3 + a2^2*a3*a4^2)/(3*a^2*a2) + (- a^2*a1*a2 - a^2*a2^2 - a^2*a2*a3 + a^2*a3^3 + a^2*a3*a4^2 + a1^3*a2 + a1*a2*a4^2 + a2^4 + a2^2*a4^2)^2/(9*a^4*a2^2))^3)^(1/2) - (- a^2*a1*a2^2*a3 + a^2*a1*a2*a3^3 + a^2*a1*a2*a3*a4^2 + a1^3*a2^2*a3 + a1*a2^4*a3 + 2*a1*a2^2*a3*a4^2)/(2*a^2*a2) - (- a^2*a1*a2 - a^2*a2^2 - a^2*a2*a3 + a^2*a3^3 + a^2*a3*a4^2 + a1^3*a2 + a1*a2*a4^2 + a2^4 + a2^2*a4^2)^3/(27*a^6*a2^3) - ((- a^2*a1*a2 - a^2*a2^2 - a^2*a2*a3 + a^2*a3^3 + a^2*a3*a4^2 + a1^3*a2 + a1*a2*a4^2 + a2^4 + a2^2*a4^2)*(- a^2*a1*a2^2 - a^2*a1*a2*a3 + a^2*a1*a3^3 + a^2*a1*a3*a4^2 - a^2*a2^2*a3 + a^2*a2*a3^3 + a^2*a2*a3*a4^2 + a1^3*a2^2 + a1^3*a2*a3 + a1*a2^4 + 2*a1*a2^2*a4^2 + a1*a2*a3*a4^2 + a2^4*a3 + a2^2*a3*a4^2))/(6*a^4*a2^2))^(1/3) - (- a^2*a1*a2 - a^2*a2^2 - a^2*a2*a3 + a^2*a3^3 + a^2*a3*a4^2 + a1^3*a2 + a1*a2*a4^2 + a2^4 + a2^2*a4^2)/(3*a^2*a2)
