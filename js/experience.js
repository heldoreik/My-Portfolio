const experienceList = document.getElementById('experience-list');

function createExperienceEntry(experience) {
    const entry = document.createElement('article');
    entry.classList.add('experience-entry');

    const year = document.createElement('span');
    year.classList.add('experience-year');
    year.textContent = experience.year;

    const content = document.createElement('div');
    content.classList.add('experience-entry-content');

    const category = document.createElement('h3');
    category.classList.add('experience-category');
    category.textContent = `[${experience.category}]`;

    const name = document.createElement('p');
    name.classList.add('experience-name');
    name.textContent = experience.name;

    content.append(category, name);

    if (experience.organization) {
        const organization = document.createElement('p');
        organization.classList.add('experience-organization');
        organization.textContent = experience.organization;
        content.append(organization);
    }

    const specialization = document.createElement('p');
    specialization.classList.add('experience-specialization');
    specialization.textContent = experience.specialization;

    const status = document.createElement('span');
    status.classList.add('experience-status');
    status.dataset.status = experience.status.toLowerCase();
    status.textContent = experience.status;

    content.append(specialization, status);
    entry.append(year, content);
    return entry;
}

async function loadExperience() {
    try {
        const response = await fetch('http://localhost:3000/api/experience');

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const experience = await response.json();
        if (!Array.isArray(experience) || experience.some(entry =>
            typeof entry.name !== 'string' ||
            typeof entry.category !== 'string' ||
            (entry.organization !== null && typeof entry.organization !== 'string') ||
            typeof entry.specialization !== 'string' ||
            typeof entry.status !== 'string' ||
            typeof entry.year !== 'string'
        )) {
            throw new Error('The experience API returned invalid data.');
        }

        const header = document.createElement('div');
        header.classList.add('experience-list-header');
        header.textContent = '[1] Experience.log';

        experienceList.replaceChildren(header, ...experience.map(createExperienceEntry));
    } catch (error) {
        console.error('Failed to load experience:', error);
        experienceList.textContent = 'Failed to load experience.';
    }
}

loadExperience();
