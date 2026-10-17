const projectsList = document.getElementById('projects-list');
const projectsSearch = document.getElementById('projects-search');
const nameCollator = new Intl.Collator(undefined, { sensitivity: 'base' });
let projects = [];

function renderProjects() {
    const queryParts = projectsSearch.value
        .split(',')
        .map(part => part.trim())
        .filter(Boolean);
    const sortPart = queryParts.find(part => /^sort:/i.test(part));
    const requestedSort = sortPart?.slice(5).toLowerCase();
    const sort = ['name', 'name-desc', 'status'].includes(requestedSort)
        ? requestedSort
        : 'id';
    const searchTerms = queryParts.filter(part => !/^sort:/i.test(part));
    const filteredProjects = projects.filter(project => {
        const searchableText = [
            project.name,
            project.description,
            project.status,
            ...project.skills
        ].join(' ').toLowerCase();

        return searchTerms.every(term => searchableText.includes(term.toLowerCase()));
    });
    const sortedProjects = [...filteredProjects];

    switch (sort) {
        case 'name':
            sortedProjects.sort((a, b) => nameCollator.compare(a.name, b.name));
            break;
        case 'name-desc':
            sortedProjects.sort((a, b) => nameCollator.compare(b.name, a.name));
            break;
        case 'status':
            sortedProjects.sort((a, b) => nameCollator.compare(a.status, b.status));
            break;
        default:
            sortedProjects.sort((a, b) => a.id - b.id);
    }

    projectsList.replaceChildren();

    sortedProjects.forEach(project => {
        const article = document.createElement('article');
        article.classList.add('project-card');

        const header = document.createElement('div');
        header.classList.add('project-card-header');
        header.textContent = `[${project.id}] ${project.name.toLowerCase().replace(/\s+/g, '-')}/`;

        const title = document.createElement('h3');
        title.classList.add('project-title');
        title.textContent = `[${project.name}]`;

        const description = document.createElement('p');
        description.classList.add('project-description');
        description.textContent = project.description;

        const skills = document.createElement('div');
        skills.classList.add('project-skills');

        project.skills.forEach(skill => {
            const tag = document.createElement('span');
            tag.classList.add('project-skill');
            tag.textContent = skill;
            skills.append(tag);
        });

        const status = document.createElement('p');
        status.classList.add('project-status');
        status.dataset.status = project.status;
        status.textContent = `status: ${project.status}`;

        article.append(header, title, description, skills, status);

        const safeUrl = getSafeExternalUrl(project.url);
        if (safeUrl) {
            const link = document.createElement('a');
            link.href = safeUrl;
            link.textContent = 'View on GitHub';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            article.append(link);
        } else {
            if (project.url) {
                console.warn(`Ignored an unsafe URL for project ${project.id}.`);
            }

            const linkPlaceholder = document.createElement('span');
            linkPlaceholder.classList.add('project-card-link-placeholder');
            linkPlaceholder.setAttribute('aria-hidden', 'true');
            linkPlaceholder.textContent = 'View on GitHub';

            article.append(linkPlaceholder);
        }

        projectsList.append(article);
    });
}

projectsSearch.addEventListener('input', renderProjects);

async function loadProjects() {
    try {
        const response = await fetch('http://127.0.0.1:8081/api/projects');

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        projects = await response.json();
        renderProjects();
    } catch (error) {
        console.error('Failed to load projects:', error);
        projectsList.textContent = 'Failed to load projects.';
    }
}

loadProjects();
