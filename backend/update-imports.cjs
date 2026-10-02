const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) walk(p, callback);
        else if (p.endsWith('.ts')) callback(p);
    });
}

function replaceInFile(file, replacements) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    for (const [search, replace] of replacements) {
        // use regex to replace all occurrences globally
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        if (regex.test(content)) {
            content = content.replace(regex, replace);
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated ' + file);
    }
}

const replacements = [
    ['../auth/', '../autenticacion/'],
    ['./auth/', './autenticacion/'],
    ['../groups/', '../grupos/'],
    ['./groups/', './grupos/'],
    ['../users/', '../usuarios/'],
    ['./users/', './usuarios/'],
    ['../notifications/', '../notificaciones/'],
    ['./notifications/', './notificaciones/']
];

walk('src', file => {
    replaceInFile(file, replacements);
});
