import Stream from './Stream.json'
import { marked } from 'marked';

export const streamMethods: Record<string, any> = (Stream.children[0]?.children?.filter((item) => ['set'].includes(item.name)) || [])
    .reduce((obj, item) => ({
        ...obj,
        [item.name]:
        {
            // @ts-ignore
            description: (item.signatures[0]?.comment?.summary || [])
                // @ts-ignore
                .filter((comment) => comment.kind === 'text')
                // @ts-ignore
                .reduce((desc, comment) => desc + comment.text, ''),
            // @ts-ignore
            examples: (item.signatures[0]?.comment?.blockTags || [])
                // @ts-ignore
                .filter((example) => example.tag === '@example')
                // @ts-ignore
                .map((example) => example.content[0]?.text || '')
        }
    }), {} as Record<string, any>);

export const streamDoc = `
<p>A Stream represents a musical layer. There are 16 instrument streams (s0 to s15) and 4 fx streams (fx0 to fx3).</p>
    <ul class="docs__list">
        <li>
            <h4>set</h4>
            <p>Set parameters on the Stream.</p>
            ${marked(streamMethods['set'].examples.join('\n'))}
        </li>
        <li>
            <h4>Fx streams</h4>
            <p>Send signal to an fx stream:</p>
            ${marked(`\`\`\`typescript
s0.set({  
    inst: 'synth',
    n: 'Ddor%16..',
    fx0: 0.5, // send 50% of signal to fx0
    e: '1*2',
})

fx0.set({
    reverb: 1, // set reverb on the fx stream
    delay: 0.5, // set delay
    e: '1*8', // fx streams are regular streams, so need to be triggered
})
\`\`\``)}
        </li>
        <li>
            <h4>Special Parameters</h4>
            <p>Some parameters effect the behaviour of the stream:</p>
${marked(`\`\`\`typescript
s0.set({ mute: '0 1 0 1' )} // mute stream
\`\`\``)}
${marked(`\`\`\`typescript
s0.set({ cut: 's0' )} // cut self when an event is triggered
\`\`\``)}
${marked(`\`\`\`typescript
s0.set({ cut: ['s0', 's1', 's2'] )} // cut self and other streams
\`\`\``)}
${marked(`\`\`\`typescript
s0.set({ cut: 'all' )} // cut all other streams
\`\`\``)}
        </li>
    </ul>`