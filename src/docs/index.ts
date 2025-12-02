// TODO: grab comments from the class - e.g. a Stream is x.

import { marked } from 'marked';
import 'highlight.js/styles/github-dark.min.css';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';

import Pattern from './Pattern.json'
import Stream from './Stream.json'
import './style.css';

import miniNotation from './mini-notation';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('javascript', javascript);

// extract all Pattern methods
const patternMethods: Record<string, any> = (Pattern.children.find((item) => item.name === 'methods')?.type?.declaration?.children || [])
    .reduce((obj, item) => ({
        ...obj,
        [item.name]: {
            description: item.comment?.summary
                .filter((comment) => comment.kind === 'text')
                .reduce((desc, comment) => desc + comment.text, '') || '',
            examples: (item.comment?.blockTags || [])
                .filter((example) => example.tag === '@example')
                .map((example) => example.content[0]?.text || '')
        }
    }), {} as Record<string, any>);

const streamMethods: Record<string, any> = (Stream.children[0]?.children?.filter((item) => ['set'].includes(item.name)) || [])
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

// get element with id 'help
const helpElement = document.getElementById('help');
let currentArticle = 'docs__quick-start';

const renderDocs = (streamMethods: Record<string, any>, patternMethods: Record<string, any>) => {
    // fill with pattern methods
    if (helpElement) {
        helpElement.innerHTML = `<div>
            <h2>Docs</h2>
            <button class="active"><h3>Quick Start</h3></button>
            <button><h3>Stream</h3></button>
            <button><h3>Pattern</h3></button>
            <button><h3>Mini-Notation</h3></button>
            `

            + `
            <article id="docs__quick-start">
            <p>Streams are musical layers, represented by <code>s0</code>, <code>s1</code>, ... <code>s15</code>. Parameters are determined by an object passed to the <code>.set()</code> method.</p>
            <p>Parameter values can be raw:</p>
            ${marked(`\`\`\`typescript
s0.set({ inst: 'synth', note: 60, dur: 0.5 })
\`\`\``)}
            <p>patterns:</p>
            ${marked(`\`\`\`typescript
s1.set({ note: seq(60,62,64,65), dur: sine().add(.25) })
\`\`\``)}   
            <p>or mini-notation:</p>
            ${marked(`\`\`\`typescript
s2.set({ note: 'Ddor%16..' })
\`\`\``)}   
            <p>Trigger an event using <code>.e</code>:</p>
            ${marked(`\`\`\`typescript
s3.set({ ..., e: seq(1,0,1) })
\`\`\``)}
            <p>Mutations modulate all active voices on a Stream, with parameters prefixed by <code>_</code>. Trigger a mutation using <code>.m</code>:</p>
            ${marked(`\`\`\`typescript
s4.set({ 
    n: 'Cmi..', // doesn't mutate
    _pan: sine(), // does mutate
    e: seq(1,0,1,0), // use e to trigger an event
    m: 1*8 // use m to trigger a mutation every 8 steps
})
\`\`\``)}
            </article>
            `
            
            + `
            <article id="docs__stream">
                <p>A Stream represents a musical layer. There are 16 instrument streams (s0 to s15) and 4 fx streams (fx0 to fx3).</p>
                <ul class="help__list">
                    <li>
                        <h4>set</h4>
                        <p>Set parameters on the Stream.</p>
                        ${marked(streamMethods['set'].examples.join('\n'))}
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
                </ul>
            </article>`
            
            + `
            <article id="docs__pattern">
                <ul class="help__list">
                    <p>Patterns are the building blocks of Sartori. They can be used to control any parameter on a Stream.</p>
                    ${marked(`\`\`\`typescript
s0.set({  
    inst: 'synth',
    n: seq(60,62,64,65),
    fx0: sine().fast(2),
    e: seq(1,seq(1,1,1,1),1,1)
})
\`\`\``)}
                    ${Object.entries(patternMethods).map(([name, info]) => `
                        <li>
                            <h4>${name}</h4>
                            <p>${info.description}</p>
                            ${info.examples.length > 0 ? `
                                ${marked(info.examples.join('\n'))}
                            ` : ''}
                        </li>
                    `).join('')}
                    <li>
                        <h4>Operators</h4>
                        <p>Every operator from the JS <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math" target="_blank">Math object</a> is a Pattern method.</p>
                        ${marked(`\`\`\`typescript
s0.set({  
    inst: 'synth',
    n: seq(60,62,64,65).add(12), // transposes up an octave
    amp: random().mul(0.5).add(0.5), // random amplitude between 0.5 and 1
    e: seq(1,1,1,1)
})
\`\`\``)}
                    </li>
                </ul>
            </article>`

            + `<article id="docs__mini-notation">
                ${marked(miniNotation)}
                </article>`
        + `</div>`;
    }
    hljs.highlightAll();
};

renderDocs(streamMethods, patternMethods);

// add event listeners to buttons
document.querySelectorAll('#help button').forEach((button) => {
    button.addEventListener('click', () => {
        const articleId = `docs__${button.textContent?.toLowerCase().replace(' ', '-')}`;
        const previousArticle = document.getElementById(currentArticle);
        const nextArticle = document.getElementById(articleId);
        if (previousArticle) previousArticle.style.display = 'none';
        if (nextArticle) nextArticle.style.display = 'block';
        currentArticle = articleId;
        // update button styles
        document.querySelectorAll('#help button').forEach((btn) => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
    });
});