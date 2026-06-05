import { readdir, readFile, writeFile } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOOLS_DIR = resolve(__dirname, '../src/pages/tools');
const PUBLIC_DIR = resolve(__dirname, '../public');
const BASE_URL = 'https://tools.iharshgor.com';

async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : res;
    })
  );
  return files.flat();
}

async function generateSitemap() {
  try {
    const allFiles = await getFiles(TOOLS_DIR);
    const metaFiles = allFiles.filter(
      (file) => file.endsWith('meta.ts') || file.endsWith('meta.tsx')
    );

    const categories = new Set();
    const toolPaths = [];

    for (const file of metaFiles) {
      const content = await readFile(file, 'utf-8');
      
      const categoryMatch = content.match(/defineTool\s*\(\s*['"`\`]([^'"`\`]+)['"`\`]/);
      const pathMatch = content.match(/path\s*:\s*['"`\`]([^'"`\`]+)['"`\`]/);

      if (categoryMatch && pathMatch) {
        const category = categoryMatch[1];
        const path = pathMatch[1];
        categories.add(category);
        toolPaths.push(`${category}/${path}`);
      } else {
        console.warn(`Could not parse defineTool options in ${file}`);
      }
    }

    const today = new Date().toISOString().split('T')[0];
    
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // 1. Homepage
    sitemap += '  <url>\n';
    sitemap += `    <loc>${BASE_URL}/</loc>\n`;
    sitemap += `    <lastmod>${today}</lastmod>\n`;
    sitemap += '    <changefreq>daily</changefreq>\n';
    sitemap += '    <priority>1.0</priority>\n';
    sitemap += '  </url>\n';

    // 2. Category Pages
    const sortedCategories = Array.from(categories).sort();
    for (const category of sortedCategories) {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${BASE_URL}/categories/${category}</loc>\n`;
      sitemap += `    <lastmod>${today}</lastmod>\n`;
      sitemap += '    <changefreq>daily</changefreq>\n';
      sitemap += '    <priority>0.8</priority>\n';
      sitemap += '  </url>\n';
    }

    // 3. Tool Pages
    const sortedToolPaths = toolPaths.sort();
    for (const toolPath of sortedToolPaths) {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${BASE_URL}/${toolPath}</loc>\n`;
      sitemap += `    <lastmod>${today}</lastmod>\n`;
      sitemap += '    <changefreq>weekly</changefreq>\n';
      sitemap += '    <priority>0.7</priority>\n';
      sitemap += '  </url>\n';
    }

    sitemap += '</urlset>\n';

    const sitemapPath = join(PUBLIC_DIR, 'sitemap.xml');
    await writeFile(sitemapPath, sitemap, 'utf-8');
    console.log(`Successfully generated sitemap.xml with ${sortedToolPaths.length} tools and ${sortedCategories.length} categories at ${sitemapPath}`);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
}

generateSitemap();
