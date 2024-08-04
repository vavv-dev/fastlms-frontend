import fs from 'fs';
import glob from 'glob';

// Define the directories to search in
const SEARCH_DIR = './src';
const API_FILE = './src/api/services.gen.ts';

// Step 1: Extract import statements from all .ts and .tsx files in the directory recursively
const files = glob.sync(`${SEARCH_DIR}/**/*.{ts,tsx}`);

let matches = [];

// Regex to match multiline import statements
const importRegex = /import[^;]+from '@\/api';/gs;

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const importStatements = content.match(importRegex);
  if (importStatements) {
    matches.push(...importStatements);
  }
});

// Step 2: Extract parts between `{` and `}` and filter them
let extracted = matches
  .map((statement) => {
    const match = statement.match(/{([^}]+)}/);
    return match ? match[1] : null;
  })
  .filter(Boolean)
  .join(',')
  .split(',')
  .map((part) => part.trim());

// Step 3: Filter parts that start with a lowercase letter and contain at least one uppercase letter
let filteredResults = extracted.filter((part) => /^[a-z].*[A-Z]/.test(part));

// Step 4: Sort and remove duplicates
let uniqueSortedResults = [...new Set(filteredResults)].sort();

// Display the currently used APIs
console.log("Currently used APIs:");
console.log(uniqueSortedResults.join('\n'));

// Step 5: Extract all exported functions from the api file
const apiFileContent = fs.readFileSync(API_FILE, 'utf8');

// Regex to match exported functions
const exportRegex = /export const (\w+)/g;

let apiExports = [];
let match;

while ((match = exportRegex.exec(apiFileContent)) !== null) {
  apiExports.push(match[1]);
}

// Sort and remove duplicates from API exports
let uniqueApiExports = [...new Set(apiExports)].sort();

// Display all APIs from the server
console.log("\nAll APIs from the server:");
console.log(uniqueApiExports.join('\n'));

// Step 6: Find differences between used APIs and exported APIs
let onlyInUsed = uniqueSortedResults.filter((api) => !uniqueApiExports.includes(api));
let onlyInExported = uniqueApiExports.filter((api) => !uniqueSortedResults.includes(api));

// Display the differences with + and -
console.log("\nDifferent APIs:");
onlyInUsed.forEach(api => console.log(`+ ${api}`));
onlyInExported.forEach(api => console.log(`- ${api}`));
