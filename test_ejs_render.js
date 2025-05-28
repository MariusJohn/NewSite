// test_ejs_render.js
import ejs from 'ejs';
import { promises as fs } from 'fs'; // Use promises API for async/await
import path from 'path';
import { fileURLToPath } from 'url'; // For __dirname in ESM

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatePath = path.join(__dirname, 'views', 'bodyshop', 'dashboard.ejs');

async function renderTestTemplate() {
    try {

        const data = await fs.readFile(templatePath, 'utf8');
        const renderedHtml = ejs.render(data, { /* no data needed for this simple template */ });
        console.log('EJS template rendered successfully!');
        // console.log(renderedHtml); // Uncomment to see the output if successful
    } catch (renderError) {
        console.error('EJS Rendering Error (from test script):', renderError);
        console.error('Error message:', renderError.message);
        console.error('Stack:', renderError.stack);
    }
}

renderTestTemplate();