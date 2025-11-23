// TODO: everything!
import { Pattern, methods, type Hap } from '../Pattern/Pattern';

export interface Stream extends Record<string, any> {
    id: string;
}


/**
 * A Stream is a musical layer. You can think of it as a track in a DAW, or a channel in a mixer.
 * It can be used to control multiple instruments, effects, and routing.
 * Streams are available within Zen as `s0`, `s1`, `s2`, `s3`, `s4`, `s5`, `s6`, `s7` and are simply objects whose properties return a `Pattern` instance.
 * @example
 * s0.set({inst:0,cut:0,reverb:.5,delay:.25,vol:.5,modi:1.25,mods:0.1})
 * s0.n.set('Cpro%16..*16 | Cpro%16..?*16').sub(12),
 * s0.s.noise(.25,0.05,0.5)
 * s0.e.every(4).or(every(3))
 */
export class Stream {
    constructor(id: string) {
        this.id = id;
    }

    set(params: Record<string, any>) {
        Object.entries(params)
            .filter(([key]) => !['id', 'set', 'query'].includes(key))
            // @ts-ignore
            .forEach(([key, value]) => this[key] = (value instanceof Pattern 
                ? value 
                : (new Pattern()).set(value)));
    }
    
    query(from: number, to: number) {
        // gather the events from .e pattern
        const events = this.e?.query(from, to) || [];
        return events
            // only keep events with a value
            .filter((e: Hap<any>) => !!e.value)
            // iterate over events and build param sets
            .map((e: Hap<any>) => ({
                time: e.from,
                params: Object.fromEntries(Object.entries(this)
                    // only keep Patterns
                    .filter(([_, value]) => value instanceof Pattern)
                    // query each Pattern and keep the closes Hap to the event start time
                    .map(([key, pattern]) => [key, (pattern as Pattern<any>).query(e.from, e.to)[0]?.value ])
                )
            }));
    }
}

const s0 = new Stream('s0');
const s1 = new Stream('s1');

s0.set({
    inst:1, 
    reverb: methods.sine(),
    e: methods.seq(1,0,1)});

s1.set({
    e:s0.e.degrade()}) // nice! because everything is immutable, we can reference patterns from other streams


console.log(s0.query(0,10), s1.query(0,10)); // but the results aren't as expected

// TODO: s0.reverb.sine() not working.
// We should be able to do something like this s0.e.coin().repeat(8), or repeat(8, coin()).