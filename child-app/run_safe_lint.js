import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [];

const collectFiles = (dir) => {
    try {
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                if (file !== 'node_modules' && file !== 'dist') collectFiles(filePath);
            } else {
                if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                    files.push(filePath);
                }
            }
        });
    } catch (e) {
        console.error(`Error reading directory ${dir}:`, e);
    }
}

collectFiles('src');

let allReports = [];

console.log(`Found ${files.length} files to lint.`);

files.forEach((file, index) => {
    try {
        // process.stdout.write(`Linting ${index + 1}/${files.length}: ${file}\r`);
        const result = execSync(`npx eslint "${file}" --format json`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        const json = JSON.parse(result);
        allReports.push(...json);
    } catch (e) {
        // eslint throws on lint errors (exit code 1) but usually still outputs stdout
        if (e.stdout) {
            try {
                const json = JSON.parse(e.stdout);
                allReports.push(...json);
            } catch (parseError) {
                console.error(`\nFailed to parse output for ${file}`);
            }
        } else {
            console.error(`\nCrash/Error on ${file}: ${e.message}`);
        }
    }
});

fs.writeFileSync('full_lint_report.json', JSON.stringify(allReports, null, 2));
console.log('\nLinting complete. Report saved to full_lint_report.json');
