const certificatesList = document.getElementById('certificates-list');
const certificatesSearch = document.getElementById('certificates-search');
const certificatePreviewDialog = document.querySelector('.certificate-preview-dialog');
const certificatePreviewImage = certificatePreviewDialog.querySelector('img');
let certificates = [];

function formatCertificateDate(issueDate) {
    if (issueDate === null) {
        return 'not specified';
    }

    const date = new Date(issueDate);
    if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid certificate issue date: ${issueDate}`);
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
    });
}

function createCertificateCard(certificate) {
    const card = document.createElement('article');
    card.classList.add('certificate-card');

    const header = document.createElement('div');
    header.classList.add('certificate-card-header');
    header.textContent = `[${certificate.id}] ${certificate.name.toLowerCase().replace(/\s+/g, '-')}/`;

    const preview = document.createElement('button');
    preview.classList.add('certificate-preview');
    preview.type = 'button';
    preview.setAttribute('aria-label', `Preview ${certificate.name}`);

    const previewLabel = document.createElement('span');
    previewLabel.classList.add('certificate-preview-label');
    previewLabel.textContent = certificate.image_url ? 'click to preview' : 'preview unavailable';
    preview.append(previewLabel);

    const title = document.createElement('h3');
    title.classList.add('certificate-title');
    title.textContent = `[${certificate.name}]`;

    const description = document.createElement('p');
    description.classList.add('certificate-description');
    description.textContent = certificate.description;

    const metadata = document.createElement('dl');
    metadata.classList.add('certificate-metadata');
    [
        ['issuer', certificate.issuer],
        ['issued', formatCertificateDate(certificate.issue_date)]
    ].forEach(([label, value]) => {
        const row = document.createElement('div');
        row.classList.add('certificate-metadata-row');

        const term = document.createElement('dt');
        term.textContent = label;

        const detail = document.createElement('dd');
        detail.textContent = value;

        row.append(term, detail);
        metadata.append(row);
    });

    if (certificate.image_url) {
        const image = document.createElement('img');
        image.alt = certificate.name;

        image.addEventListener('load', () => {
            const orientation = image.naturalHeight > image.naturalWidth
                ? 'portrait'
                : 'landscape';
            preview.dataset.orientation = orientation;
            preview.style.aspectRatio = `${image.naturalWidth} / ${image.naturalHeight}`;
        }, { once: true });
        image.addEventListener('error', () => {
            preview.dataset.orientation = 'unavailable';
            preview.disabled = true;
            previewLabel.textContent = 'preview unavailable';
            image.alt = `${certificate.name} image could not be loaded`;
            console.error(`Failed to load certificate image: ${image.src}`);
        }, { once: true });

        image.src = certificate.image_url;
        preview.prepend(image);
        preview.addEventListener('click', () => {
            certificatePreviewImage.src = image.src;
            certificatePreviewImage.alt = certificate.name;
            certificatePreviewDialog.showModal();
        });
    } else {
        preview.disabled = true;
        preview.dataset.orientation = 'unavailable';
    }

    const skills = document.createElement('div');
    skills.classList.add('certificate-skills');
    certificate.skills.forEach(skill => {
        const tag = document.createElement('span');
        tag.classList.add('certificate-skill');
        tag.textContent = skill;
        skills.append(tag);
    });

    card.append(header, preview, title, description, metadata, skills);
    return card;
}

function renderCertificates() {
    const terms = certificatesSearch.value
        .split(',')
        .map(term => term.trim().toLowerCase())
        .filter(Boolean);
    const filteredCertificates = certificates.filter(certificate => {
        const searchableText = [
            certificate.name,
            certificate.description,
            certificate.issuer,
            formatCertificateDate(certificate.issue_date),
            ...certificate.skills
        ].join(' ').toLowerCase();

        return terms.every(term => searchableText.includes(term));
    });

    if (!filteredCertificates.length) {
        certificatesList.textContent = certificates.length
            ? 'No certificates match your search.'
            : 'No certificates have been added yet.';
        return;
    }

    certificatesList.replaceChildren(...filteredCertificates.map(createCertificateCard));
}

certificatesSearch.addEventListener('input', renderCertificates);

async function loadCertificates() {
    try {
        const response = await fetch('http://localhost:3000/api/certificates');

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data) || data.some(certificate =>
            !Number.isInteger(certificate.id) ||
            typeof certificate.name !== 'string' ||
            typeof certificate.description !== 'string' ||
            typeof certificate.issuer !== 'string' ||
            (certificate.issue_date !== null && typeof certificate.issue_date !== 'string') ||
            (certificate.image_url !== null && typeof certificate.image_url !== 'string') ||
            !Array.isArray(certificate.skills) ||
            certificate.skills.some(skill => typeof skill !== 'string')
        )) {
            throw new Error('The certificates API returned invalid data.');
        }

        certificates = data.map(certificate => ({
            ...certificate,
            image_url: certificate.image_url
                ? new URL(certificate.image_url, document.baseURI).href
                : null
        }));
        renderCertificates();
    } catch (error) {
        console.error('Failed to load certificates:', error);
        certificatesList.textContent = 'Failed to load certificates.';
    }
}

loadCertificates();
