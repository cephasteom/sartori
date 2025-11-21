declare type Hap<T> = { from: number; to: number; value: T };

// Pattern creation shortcut:
const P = <T>(q: (from: number, to: number) => Hap<T>[]) => new Pattern(q);

// base cycle function which checks for nested Patterns
const cycle = (callback: (from: number, to: number) => Hap<any>[]) => P((from,to) => {
    from = Math.floor(from);
    to = Math.ceil(to);
    let bag: Hap<any>[] = [];
    while (from < to) {
        const haps = callback(from, from + 1);
        // iterate over haps to check whether there are any nested patterns
        for(let hap of haps) {
            // if the value is a pattern, query it and add its haps to the bag
            if(hap.value instanceof Pattern) {
                bag = bag.concat(hap.value.query(hap.from, hap.to));
            // otherwise, just add the hap to the bag
            } else {
                bag.push(hap)
            }
        }
        from++;
    }
    return bag;
})

// Pattern methods - add each to the exported methods obj, which should be added to the global scope as functions
// These are then added to the Pattern class methods
const fast = (factor: number, pattern: Pattern<any>) => P((from, to) => 
    pattern.query(from * factor, to * factor).map(hap => ({
        from: hap.from / factor,
        to: hap.to / factor,
        value: hap.value
    }))
);
const slow = (factor: number, pattern: Pattern<any>) => fast(1 / factor, pattern);

const cat = (...values: any[]) => cycle((from, to) => {
    let value = values[from % values.length];
    return [{ from, to, value }];
})

const seq = (...values: any[]) => fast(values.length, cat(...values));

const choose = (...values: any[]) => cycle((from, to) => {
    let value = values[Math.floor(Math.random() * values.length)];
    return [{ from, to, value }];
});

export const methods = {
    fast,
    slow,
    cat,
    seq,
    choose
};


export class Pattern<T> {
    query: (from: number, to: number) => Hap<T>[];
    constructor(query: (from: number, to: number) => Hap<T>[]) {
        this.query = query;

        // add all of the pattern functions to the class
        Object.entries(methods).forEach(([name, method]) => {
            // @ts-ignore - we know this is a method
            this[name] = (...args: any[]) => method(...args, this);
        } );
    }

    fast(factor: number): Pattern<T> { return fast(factor, this) }
}

console.log( choose(seq('A', 'B', 'C').fast(1), seq('A', 'B', 'C').fast(2), seq('A', 'B', 'C').fast(3)).query(0, 4) );