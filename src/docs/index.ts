import { marked } from 'marked';
import 'highlight.js/styles/github-dark.min.css';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import quickStart from './quick-start';
import { streamDoc, streamMethods} from './streams';
import { patternDoc, patternMethods } from './patterns';
import miniNotation from './mini-notation';
import { instrumentsDoc, instruments } from './instruments';
import effects from './effects';
import { search } from './utils';
import './style.css';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('javascript', javascript);

const searchable: Record<string, any> = {
    stream: streamMethods,
    pattern: patternMethods,
    ...instruments
};

console.log('searchable', searchable);

const docs = document.getElementById('docs')

const render = (searchResults: Record<string, any> = {}) => {
    docs && (docs.innerHTML = `
        <div>
            <h2>Docs</h2>
            <input type="text" id="docs__search" placeholder="Search..." />
            ${Object.keys(searchResults).length > 0
                ? `<h3>Search Results</h3><p>No results found.</p>`
                : `
                    <button class="active"><h3>Quick Start</h3></button>
                    <button><h3>Stream</h3></button>
                    <button><h3>Pattern</h3></button>
                    <button><h3>Mini-Notation</h3></button>
                    <button><h3>Instruments</h3></button>
                    <button><h3>Effects</h3></button>

                    ${Object.entries({
                        ['quick-start']: quickStart,
                        ['stream']: streamDoc,
                        ['pattern']: patternDoc,
                        ['mini-notation']: marked(miniNotation),
                        ['instruments']: instrumentsDoc,
                        ['effects']: effects
                    }).map(([id, content]) => `
                        <article id="docs__${id}">
                            ${content}
                        </article>
                    `).join('')}
                `}
        </div>`
    )

    hljs.highlightAll();
};

render();

// current active article
let article = 'docs__quick-start';
// add event listeners to buttons
document.querySelectorAll('#docs button').forEach((button) => {
    button.addEventListener('click', () => {
        const articleId = `docs__${button.textContent?.toLowerCase().replace(' ', '-')}`;
        const previousArticle = document.getElementById(article);
        const nextArticle = document.getElementById(articleId);
        if (previousArticle) previousArticle.style.display = 'none';
        if (nextArticle) nextArticle.style.display = 'block';
        article = articleId;
        // update button styles
        document.querySelectorAll('#docs button').forEach((btn) => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
    });
});

// search functionality
const searchInput = document.getElementById('docs__search') as HTMLInputElement;
searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    console.log(search(query));
});