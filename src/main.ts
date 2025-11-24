import { evaluate } from './core/compile';
import { Scheduler } from './core/Scheduler';
import './editor';
import './normalize.css'
import './style.css'

// Listen for 'executeCode' events from the editor and evaluate the code
window.addEventListener("executeCode", (e) => {
    const customEvent = e as CustomEvent<{ code: string }>;
    evaluate(customEvent.detail.code);
});

// Set up AudioContext and Scheduler -
const ac = new AudioContext();
const scheduler = new Scheduler(ac, (hap: any, time: number) => {
    console.log(hap, time); // handle the hap (event) here
});

// Play / stop on Ctrl+Enter / Escape
window.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' && e.ctrlKey) scheduler.play();
    if(e.key === 'Escape') scheduler.stop();
});