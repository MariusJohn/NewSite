// test_ejs_render.js
import ejs from 'ejs';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatePath = path.join(__dirname, 'views', 'email', 'no-quotes.ejs');

const mockData = {
  customerName: 'Test User',
  job: { id: 999 },
  extendUrl: 'http://localhost:3000/jobs/action/999/mock-extend-token?action=extend',
  cancelUrl: 'http://localhost:3000/jobs/action/999/mock-cancel-token?action=cancel',
};

async function renderEjsTemplate(templatePath, data) {
  try {
    const template = await fs.readFile(templatePath, 'utf8');
    const html = ejs.render(template, data);
    console.log('✅ Template rendered successfully.\n');
    console.log(html);
  } catch (err) {
    console.error('❌ Rendering failed:', err.message);
    console.error(err.stack);
  }
}

renderEjsTemplate(templatePath, mockData);
