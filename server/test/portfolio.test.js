const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const getSafeExternalUrl = require('../../js/safe-external-url');
const { createApp } = require('../server');

const projectRoot = path.resolve(__dirname, '../..');

function localPathHasExactCase(filePath) {
    const relativePath = path.relative(projectRoot, filePath);
    let currentPath = projectRoot;

    for (const part of relativePath.split(path.sep)) {
        if (!fs.readdirSync(currentPath).includes(part)) {
            return false;
        }

        currentPath = path.join(currentPath, part);
    }

    return fs.existsSync(currentPath);
}

function localPathExistsIgnoringCase(filePath) {
    const relativePath = path.relative(projectRoot, filePath);
    let currentPath = projectRoot;

    for (const part of relativePath.split(path.sep)) {
        const matchingEntry = fs.readdirSync(currentPath).find(
            entry => entry.toLowerCase() === part.toLowerCase()
        );
        if (!matchingEntry) {
            return false;
        }

        currentPath = path.join(currentPath, matchingEntry);
    }

    return fs.existsSync(currentPath);
}

function findHtmlFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            return entry.name === 'node_modules' ? [] : findHtmlFiles(entryPath);
        }

        return entry.isFile() && entry.name.endsWith('.html') ? [entryPath] : [];
    });
}

test('project links only allow HTTP and HTTPS URLs', () => {
    assert.equal(getSafeExternalUrl('https://github.com/heldoreik'), 'https://github.com/heldoreik');
    assert.equal(getSafeExternalUrl('http://example.com/project'), 'http://example.com/project');
    assert.equal(getSafeExternalUrl('javascript:alert(1)'), null);
    assert.equal(getSafeExternalUrl('data:text/html,hello'), null);
    assert.equal(getSafeExternalUrl('/relative/path'), null);
    assert.equal(getSafeExternalUrl('not a URL'), null);
    assert.equal(getSafeExternalUrl(''), null);
    assert.equal(getSafeExternalUrl(null), null);
});

test('HTML links to existing local pages use the exact case of their target files', () => {
    const htmlFiles = [
        path.join(projectRoot, 'index.html'),
        ...findHtmlFiles(path.join(projectRoot, 'pages'))
    ];
    const brokenLinks = [];

    for (const htmlFile of htmlFiles) {
        const html = fs.readFileSync(htmlFile, 'utf8');
        const links = html.matchAll(/\bhref=["']([^"']+\.html(?:[?#][^"']*)?)["']/gi);

        for (const [, href] of links) {
            if (/^(?:[a-z]+:|\/\/|#)/i.test(href)) {
                continue;
            }

            const targetPath = path.resolve(path.dirname(htmlFile), href.split(/[?#]/, 1)[0]);
            if (
                localPathExistsIgnoringCase(targetPath) &&
                !localPathHasExactCase(targetPath)
            ) {
                brokenLinks.push(`${path.relative(projectRoot, htmlFile)} -> ${href}`);
            }
        }
    }

    assert.deepEqual(brokenLinks, []);
});

test('certificate API responds to local page origins and rejects remote CORS origins', async t => {
    const certificate = {
        id: 1,
        name: 'Test certificate',
        description: 'Test description',
        issuer: 'Test issuer',
        issue_date: '2026-01-01',
        image_url: null,
        skills: []
    };
    const app = createApp({
        async query() {
            return { rows: [certificate] };
        }
    });
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
    }));

    const address = server.address();
    const endpoint = `http://127.0.0.1:${address.port}/api/certificates`;
    const localOrigin = 'http://127.0.0.1:3000';
    const localResponse = await fetch(endpoint, { headers: { Origin: localOrigin } });

    assert.equal(localResponse.status, 200);
    assert.equal(localResponse.headers.get('access-control-allow-origin'), localOrigin);
    assert.deepEqual(await localResponse.json(), [certificate]);

    const remoteResponse = await fetch(endpoint, {
        headers: { Origin: 'https://example.com' }
    });
    assert.equal(remoteResponse.status, 200);
    assert.equal(remoteResponse.headers.get('access-control-allow-origin'), null);
});
