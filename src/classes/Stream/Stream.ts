// TODO: everything!
import { Pattern, type Hap } from '../Pattern/Pattern';

export interface Stream extends Record<string, any> {
    id: string;
    query: (from: number, to: number) => void;
}

// wrap Pattern instance in a Proxy to intercept mutator calls
function wrapPattern(stream: any, key: string, pattern: Pattern<any>) {
    return new Proxy(pattern, {
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);

            if (typeof value === "function") {
                // wrap mutator: call fn → get new Pattern → write back → return proxy
                return (...args: any[]) => {
                    const result = value.apply(target, args);

                    if (result instanceof Pattern) {
                        stream[key] = result;                     // persist mutation
                        return wrapPattern(stream, key, result);  // return wrapped version
                    }
                    return result;
                };
            }

            return value;
        }
    });
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
        const handler = {
            get: (target: Stream, key: string) => {
                if (key in target) return target[key as keyof typeof target];

                // wrap Pattern instance in callable proxy
                const pattern = wrapPattern(target, key, new Pattern());
                
                target[key] = pattern;
                return pattern;
            }
        };

        const init: Stream = { 
            id,
            set: (params: Record<string, any>) => {
                Object.entries(params)
                    .filter(([key]) => !['id', 'query', '__reset', '__clear'].includes(key))
                    // @ts-ignore
                    .forEach(([key, value]) => init[key] = (new Pattern()).set(value));
            },
            query: (from: number, to: number) => {
                // gather the events from .e pattern
                const events = init.e?.query(from, to) || [];
                return events
                    // only keep events with a value
                    .filter((e: Hap<any>) => !!e.value)
                    // iterate over events and build param sets
                    .map((e: Hap<any>) => ({
                        time: e.from,
                        params: Object.fromEntries(Object.entries(init)
                            // only keep Patterns
                            .filter(([_, value]) => value instanceof Pattern)
                            // query each Pattern and keep the closes Hap to the event start time
                            .map(([key, pattern]) => [key, (pattern as Pattern<any>).query(e.from, e.to)[0]?.value])
                        )
                    }));
            },
        };

        return new Proxy(init, handler);
    }
}

const s0 = new Stream('s0');
s0.set({inst:1});
s0.reverb.set(1)
s0.e.coin().fast(16)
console.log(s0.query(0,1))