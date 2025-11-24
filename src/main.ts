import { compile, evaluate } from './core/compile';
import './style.css'

evaluate(`
    s0.set({
        // inst: 0,
        // reverb: sine().mul(10),
        e: seq(1,1,1)
    })
`)

console.log(compile(0, 2));
console.log(compile(2, 4));