import { Pattern, methods, type Hap } from './Pattern';

export interface Stream extends Record<string, any> {
    id: string;
}

/**
 * A Stream is a musical layer. You can think of it as a track in a DAW, or a channel in a mixer.
 * It can be used to control multiple instruments, effects, and routing.
 * Stream instances are stored as `s0`, `s1`, `s2`, `s3`, `s4`, `s5`, `s6`, `s7` etc.
 * @example
 * s0.set({
    inst: 0, 
    reverb: sine(),
    e: seq(1,0,1) })
 */
export class Stream {
    constructor(id: string) {
        this.id = id;
    }

    /**
     * Set parameters on the Stream.
     * @param params - A record of parameter names and their values (Patterns or static values).
     * @example
     * s0.set({
        inst: 0, 
        reverb: sine(),
        e: seq(1,0,1) })
     */
    set(params: Record<string, any>) {
        Object.entries(params)
            .filter(([key]) => !['id', 'set', 'query', '__reset'].includes(key))
            // @ts-ignore
            .forEach(([key, value]) => this[key] = (value instanceof Pattern 
                ? value 
                : methods.set(value)));
    }
    
    /**
     * Compile events and parameters in a given time range.
     * @ignore - internal use only
     * @param from 
     * @param to 
     * @returns An array of events with their associated parameters.
     */
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
                    // query each Pattern and...
                    .map(([key, pattern]) => [key, (pattern as Pattern<any>)
                        .query(e.from, e.to)
                        // ...find the hap in which the event starts
                        .find(hap => e.from >= hap.from && e.from < hap.to) 
                        // ...and get its value
                        ?.value
                    ])
                )
            }));
    }

    /**
     * Reset the Stream to its initial state.
     * @ignore - internal use only
     */
    __reset() {
        Object.keys(this).forEach(key => {
            if (['id', 'set', 'query', '__reset'].includes(key)) return;
            delete this[key];
        });
    }
}