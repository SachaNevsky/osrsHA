import { copyFileSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buildDir = join(__dirname, '..', 'build', 'client');

// Function to find index.html recursively
function findIndexHtml(dir) {
    const indexPath = join(dir, 'index.html');
    if (existsSync(indexPath)) {
        return indexPath;
    }

    // Check subdirectories
    try {
        const items = readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            if (item.isDirectory()) {
                const found = findIndexHtml(join(dir, item.name));
                if (found) return found;
            }
        }
    } catch (err) {
        // Directory doesn't exist or can't be read
    }

    return null;
}

const indexPath = findIndexHtml(buildDir);

if (!indexPath) {
    console.error('Could not find index.html in build directory');
    process.exit(1);
}

console.log('Found index.html at:', indexPath);

// Copy to the root of build/client
const fallbackPath = join(buildDir, '404.html');
copyFileSync(indexPath, fallbackPath);
console.log('Created 404.html at:', fallbackPath);

// Also copy index.html to root if it's not already there
const rootIndexPath = join(buildDir, 'index.html');
if (indexPath !== rootIndexPath) {
    copyFileSync(indexPath, rootIndexPath);
    console.log('Copied index.html to:', rootIndexPath);
}