const educationList = document.getElementById('education-list');

function createEducationEntry(education) {
    const entry = document.createElement('article');
    entry.classList.add('education-entry');

    const year = document.createElement('span');
    year.classList.add('education-year');
    year.textContent = education.year;

    const content = document.createElement('div');
    content.classList.add('education-entry-content');

    const category = document.createElement('h3');
    category.classList.add('education-category');
    category.textContent = `[${education.category}]`;

    const name = document.createElement('p');
    name.classList.add('education-name');
    name.textContent = education.name;

    const specialization = document.createElement('p');
    specialization.classList.add('education-specialization');
    specialization.textContent = education.specialization;

    const status = document.createElement('span');
    status.classList.add('education-status');
    status.dataset.status = education.status.toLowerCase();
    status.textContent = education.status;

    content.append(category, name, specialization, status);
    entry.append(year, content);
    return entry;
}

async function loadEducation() {
    try {
        const response = await fetch('http://127.0.0.1:8081/api/education');

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const education = await response.json();
        if (!Array.isArray(education) || education.some(entry =>
            typeof entry.name !== 'string' ||
            typeof entry.category !== 'string' ||
            typeof entry.specialization !== 'string' ||
            typeof entry.status !== 'string' ||
            typeof entry.year !== 'string'
        )) {
            throw new Error('The education API returned invalid data.');
        }

        const header = document.createElement('div');
        header.classList.add('education-list-header');
        header.textContent = '[1] Education.log';

        educationList.replaceChildren(header, ...education.map(createEducationEntry));
    } catch (error) {
        console.error('Failed to load education:', error);
        educationList.textContent = 'Failed to load education.';
    }
}

loadEducation();

