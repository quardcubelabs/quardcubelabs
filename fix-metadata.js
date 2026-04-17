const fs = require('fs')
const path = require('path')

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8')
    if (!content.includes('"use client"')) return;

    let hasMetadata = content.includes('export const metadata');
    let metadataRegex = /import type \{? ?Metadata ?\}? from \"next\";?\n+(?:(?:export )?const metadata: Metadata = \{[\s\S]*?\};?)/m
    let metadataBlockRegex = /export const metadata: Metadata = \{[\s\S]*?\};?/m;

    let match = content.match(metadataRegex) || content.match(metadataBlockRegex);
    if (!match && hasMetadata) {
        match = content.match(/export const metadata.*?\{[\s\S]*?\}/m);
    }

    if (match) {
        let metadataString = match[0];
        let newContent = content.replace(metadataString, '');
        
        let importsMetadata = content.includes('import type { Metadata }');
        if (importsMetadata) {
             newContent = newContent.replace(/import type \{? ?Metadata ?\}? from \"next\";?\n+/, '');
        }

        // make sure 'use client' is at the very top.
        if (newContent.indexOf('"use client"') > 0) {
             newContent = newContent.replace(/\"use client\"[\r\n]*/g, '');
             newContent = '"use client"\n\n' + newContent;
        }

        fs.writeFileSync(filePath, newContent.trim() + '\n', 'utf8');
        
        let dir = path.dirname(filePath);
        let layoutPath = path.join(dir, 'layout.tsx');
        
        if (!fs.existsSync(layoutPath)) {
            let layoutContent = `import type { Metadata } from "next"\n\n${metadataString.replace(/import type \{? ?Metadata ?\}? from \"next\";?\n+/, '')}\n\nexport default function Layout({ children }: { children: React.ReactNode }) {\n  return children\n}\n`;
            fs.writeFileSync(layoutPath, layoutContent, 'utf8');
            console.log('Created layout for:', layoutPath);
        } else {
             console.log('Layout already exists for:', layoutPath, '- Please check manually.');
        }
    } else if (content.indexOf('"use client"') > 0) {
        // Just move use client to top
        let newContent = content.replace(/\"use client\"[\r\n]*/g, '');
        newContent = '"use client"\n\n' + newContent;
        fs.writeFileSync(filePath, newContent.trim() + '\n', 'utf8');
        console.log('Moved "use client" to top in:', filePath);
    }
}

function walk(dir) {
    let list = fs.readdirSync(dir)
    for (let file of list) {
        file = path.join(dir, file)
        let stat = fs.statSync(file)
        if (stat && stat.isDirectory()) {
            walk(file)
        } else if (file.endsWith('page.tsx')) {
            fixFile(file)
        }
    }
}

walk('./app')
