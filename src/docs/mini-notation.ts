export default `
Sartori parses mini-notation strings into arrays of values to be used as sequences. They can be used for any parameter.

#### Basic syntax
\`\`\`js
s0.set({ e: '1*16' }) // trigger on 16ths
\`\`\`

\`\`\`js
s0.set({ e: '1*3' }) // trigger on triplets
\`\`\`

\`\`\`js
s0.set({ e: '1?0*16' }) // choose randomly between 1 and 0 on 16ths
\`\`\`

\`\`\`js
s0.set({ n: '60..72*16' }) // from 60 to 72 on 16ths
\`\`\`

\`\`\`js
s0.set({ n: '60..72?*16' }) // as above, but choose randomly between values
\`\`\`

\`\`\`js
s0.set({ e: '0,1*4' }) // alternate between 0 and 1 on quarter notes - 0, 1, 0, 1, ...
\`\`\`

\`\`\`js
s0.set({ x: '0..15*16 | 15..0*16 |' }) // bars are separated by |
\`\`\`

\`\`\`js
s0.set({ x: '0..15*16 |*2 15..0*16 |*3' }) // repeat bars using |*<num>
\`\`\`

#### Euclidean rhythms

\`\`\`js
s0.set({ e: '4:16' }) // 4 pulses over 16 divisions
\`\`\`

\`\`\`js
s0.set({ e: '3:8' }) // 3 pulses over 8 divisions
\`\`\`

\`\`\`js
s0.set({ e: '3:8*2' }) // 3 pulses over 8 divisions, twice per bar
\`\`\`

#### Note values
\`\`\`js
s0.set({ n: 'C4 E4 G4 B4' }) // notated as <Root><octave>
\`\`\`

#### Chords and scales
Chords and [scales](https://github.com/tidalcycles/Tidal/blob/fcc4c5d53a72dcf2b8f4c00cc1c1b3c75eef172d/src/Sound/Tidal/Scales.hs#L4) both return an array of note values. Execute \`scales()\` in the editor to show all scales in the console.

\`\`\`js
s0.set({ n: 'Cmi7' }) // Notate chords using \`<Root><triad><extension?>\`
\`\`\`

\`\`\`js
s0.set({ n: 'Cma Ami Ddi Gsu' }) // Triads are \`ma\`, \`mi\`, \`di\`, \`au\`, \`su\` (major, minor, diminished, augmented, suspended).
\`\`\`

\`\`\`js
s0.set({ n: 'Cma#7 Ami7 Ddi7 Gma7b9' }) // Extensions are \`6\`, \`7\`, \`#7\`, \`b9\`, \`9\`, \`11\`, \`#11\`, \`13\`, \`#13\`.
\`\`\`

\`\`\`js
s0.set({ n: 'Cmi7..*8' }) // Turn the chord into a sequence
\`\`\`

\`\`\`js
s0.set({ n: 'Cmi7..?*16' }) // Randomly choose from the chord
\`\`\`

\`\`\`js
s0.set({ n: 'Cmi7%16..?*16' }) // % specifies the length of the chord
\`\`\`

\`\`\`js
s0.set({ n: 'Clyd*16' }) // Notate scales <Root><scale>
\`\`\`

\`\`\`js
s0.set({ n: 'Clyd..*16' }) // scale as a sequence
\`\`\`

\`\`\`js
s0.set({n: 'Clyd..?*16' }) // randomly choose from the scale
\`\`\`

\`\`\`js
s0.set({ n: 'Clyd%16..?*16' }) // % specifies the length of the scale
\`\`\`
`