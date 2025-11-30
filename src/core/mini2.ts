import { triads } from './chords';
import { modes } from './scales'
import peg from 'pegjs';

// Extensions
export const extensions: Record<string, number[]> = {
  6: [9],
  7: [10],
  "#7": [11],
  b9: [1],
  9: [2],
  11: [5],
  "#11": [6],
  13: [9],
  "#13": [10]
};

// MIDI numbers for root notes
export const noteMap: Record<string, number> = {
  C: 60, "C#":61, Db:61, D:62, "D#":63, Eb:63,
  E:64, F:65, "F#":66, Gb:66, G:67, "G#":68, Ab:68,
  A:69, "A#":70, Bb:70, B:71
};

const grammar = `
{
  // Inject data
  const triads = ${JSON.stringify(triads)};
  const modes = ${JSON.stringify(modes)};
  const extensions = ${JSON.stringify(extensions)};
  const noteMap = ${JSON.stringify(noteMap)};
  function flat(xs) { return xs.filter(Boolean); }

  function buildStack(root, type, ext) {
    const rootMidi = noteMap[root];
    if (rootMidi === undefined) throw new Error("Invalid root note: " + root);

    let intervals = [];
    if (triads[type]) intervals = triads[type];
    else if (modes[type]) intervals = modes[type];
    else throw new Error("Unknown chord/scale type: " + type);

    if (ext && extensions[ext]) {
      intervals = intervals.concat(extensions[ext]);
    }

    return intervals.map(i => rootMidi + i);
  }

  const noteSimpleMap = {
    "C":0,"C#":1,"Db":1,"D":2,"D#":3,"Eb":3,
    "E":4,"F":5,"F#":6,"Gb":6,"G":7,"G#":8,"Ab":8,
    "A":9,"A#":10,"Bb":10,"B":11
  };

  function noteToMidi(noteName, octave) {
    if (!(noteName in noteSimpleMap)) throw new Error("Invalid note: " + noteName);
    return 12 + octave*12 + noteSimpleMap[noteName];
  }
}

Start
  = _ expr:Expression _ { return expr; }

Expression = Choice

Choice
  = first:Sequence rest:(_ "|" _ Sequence)* {
      if (rest.length === 0) return first;
      return { type: "cat", items: [first].concat(rest.map(r => r[3])) };
    }

Sequence
  = first:Term rest:(_ Term)* {
      if (rest.length === 0) return first;
      return { type: "seq", items: [first].concat(rest.map(r => r[1])) };
    }

Term
  = Fast
  / Choose
  / Primary

Fast
  = t:Primary _ "*" _ c:Number {
      return { type: "seq", items: Array(c).fill(t) };
    }

Choose
  = first:Primary rest:(_ "?" _ Primary)+ {
      return { type: "choose", items: [first].concat(rest.map(r => r[3])) };
    }

Primary
  = StackArray
  / Spread
  / StackMusic
  / MidiNote
  / StringToken
  / Number
  / Group

Group
  = "(" _ e:Expression _ ")" { return e; }

Spread
  = id:Identifier ".." { return { type: "spread", name: id }; }

StackArray
  = "[" _ elems:NumberList _ "]" {
      return { type: "stack", items: elems };
    }

NumberList
  = head:Number tail:(_ "," _ Number)* {
      return [head].concat(tail.map(t => t[3]));
    }

StackMusic
  = root:[A-G] type:[a-z]+ ext:Extension? mod:ModLength? spread:SpreadModifier? random:RandomModifier? {
      let notes = buildStack(root, type.join(""), ext ? ext.join("") : null);

      // Apply % length modifier
      if (mod) {
        const len = parseInt(mod, 10);
        const repeated = [];
        while (repeated.length < len) repeated.push(...notes);
        notes = repeated.slice(0, len);
      }

      // Apply spread (flatten)
      if (spread) notes = notes.slice(); // keep as array

      // Apply randomisation
      if (random) {
        return { type: "choose", items: notes.slice() }; // return as choose
      }

      // Decide whether to return seq (spread) or stack
      if (spread) return { type: "seq", items: notes };

      return { type: "stack", name: root + type.join("") + (ext ? ext.join("") : ""), items: notes };
    }

RandomModifier
  = "?"

Extension
  = [0-9#b]+

ModLength
  = "%" digits:[0-9]+ { return digits.join(""); }

SpreadModifier
  = ".."

MidiNote
  = n:NoteName o:Octave {
      return noteToMidi(n, o);
    }

NoteName
  = n:[A-G] acc:("#" / "b")? {
      return n + (acc !== null ? acc : "");
    }

Octave
  = n:[0-9]+ { return parseInt(n.join(""),10); }

Identifier
  = s:[a-zA-Z_./-]+ { return s.join(""); }

StringToken
  = s:[a-zA-Z0-9_./-]+ { return s.join(""); }

Number
  = n:[0-9]+ { return parseInt(n.join(""), 10); }

_ = [ \\t\\n\\r]*
`;

const parser = peg.generate(grammar);

// Examples
console.log(parser.parse('Cma%6..?')); 
console.log(parser.parse('Cma7%6..?'));
