const skillsList = document.getElementById('skills-list');
const skillsSummary = document.getElementById('skills-summary');
const skillsSearch = document.getElementById('skill-search');
const levelButtons = document.querySelectorAll('.sort-skills [data-level]');
const levelNames = {
    1: 'beginner',
    2: 'junior',
    3: 'middle',
    4: 'senior'
};

let skills = [];
let selectedLevel = null;

function renderSkills() {
    const terms = skillsSearch.value
        .split(',')
        .map(term => term.trim().toLowerCase())
        .filter(Boolean);
    const filteredSkills = skills.filter(skill => {
        if (selectedLevel !== null && skill.level !== selectedLevel) {
            return false;
        }

        const searchableText = `${skill.name} ${skill.category} ${levelNames[skill.level]}`.toLowerCase();
        return terms.every(term => searchableText.includes(term));
    });
    const categories = new Map();

    filteredSkills.forEach(skill => {
        if (!categories.has(skill.category)) {
            categories.set(skill.category, []);
        }

        categories.get(skill.category).push(skill);
    });

    skillsList.replaceChildren();

    categories.forEach((categorySkills, category) => {
        const section = document.createElement('article');
        section.classList.add('skill-category');

        const header = document.createElement('div');
        header.classList.add('skill-category-header');

        const title = document.createElement('span');
        title.textContent = category;

        const count = document.createElement('span');
        count.textContent = String(categorySkills.length);
        header.append(title, count);

        const list = document.createElement('div');
        list.classList.add('skill-category-list');

        categorySkills.forEach(skill => {
            const entry = document.createElement('div');
            entry.classList.add('skill-entry');

            const name = document.createElement('span');
            name.classList.add('skill-name');
            name.textContent = skill.name;

            const level = document.createElement('span');
            level.classList.add('skill-level');
            level.setAttribute('aria-label', levelNames[skill.level]);
            level.title = levelNames[skill.level];

            const label = document.createElement('span');
            label.textContent = levelNames[skill.level];

            const indicators = document.createElement('span');
            indicators.classList.add('skill-level-indicators');
            indicators.setAttribute('aria-hidden', 'true');

            for (let indicator = 1; indicator <= 4; indicator += 1) {
                const square = document.createElement('span');
                if (indicator <= skill.level) {
                    square.classList.add('active');
                }
                indicators.append(square);
            }

            level.append(label, indicators);
            entry.append(name, level);
            list.append(entry);
        });

        section.append(header, list);
        skillsList.append(section);
    });

    if (filteredSkills.length === 0) {
        skillsList.textContent = 'No skills found.';
    }
}

function updateLevelCounts() {
    levelButtons.forEach(button => {
        const level = Number(button.dataset.level);
        const count = skills.filter(skill => skill.level === level).length;
        button.querySelector('span').textContent = String(count);
    });
}

levelButtons.forEach(button => {
    button.addEventListener('click', () => {
        const level = Number(button.dataset.level);
        selectedLevel = selectedLevel === level ? null : level;

        levelButtons.forEach(levelButton => {
            levelButton.setAttribute(
                'aria-pressed',
                String(Number(levelButton.dataset.level) === selectedLevel)
            );
        });

        renderSkills();
    });
});

skillsSearch.addEventListener('input', renderSkills);

async function loadSkills() {
    try {
        const response = await fetch('http://localhost:3000/api/skills');

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const result = await response.json();
        if (!Array.isArray(result) || result.some(skill =>
            typeof skill.name !== 'string' ||
            typeof skill.category !== 'string' ||
            !Number.isInteger(skill.level) ||
            !(skill.level in levelNames)
        )) {
            throw new Error('The skills API returned invalid data.');
        }

        skills = result;
        skillsSummary.textContent = `${skills.length} skills in ${new Set(skills.map(skill => skill.category)).size} categories.`;
        updateLevelCounts();
        renderSkills();
    } catch (error) {
        console.error('Failed to load skills:', error);
        skillsSummary.textContent = 'Skills could not be loaded.';
        skillsList.textContent = 'Failed to load skills.';
    }
}

loadSkills();
