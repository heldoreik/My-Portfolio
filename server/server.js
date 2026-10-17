const express = require('express');
const cors = require('cors');
const pool = require('./db');

function createApp(databasePool = pool) {
    const app = express();

    app.use(cors({
        origin(origin, callback) {
            const isLocalOrigin = !origin ||
                /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin);
            callback(null, isLocalOrigin);
        }
    }));

    app.get('/', (req, res) => {
        res.send('Portfolio server is running!');
    });

    app.get('/api/projects', async (req, res) => {
        try {
            const { name, skill, status } = req.query;
            const conditions = [];
            const values = [];

            if (name) {
                values.push(`%${name}%`);
                conditions.push(`name ILIKE $${values.length}`);
            }

            if (skill) {
                values.push(skill);
                conditions.push(`EXISTS (
                SELECT 1
                FROM unnest(skills) AS item(skill_name)
                WHERE item.skill_name ILIKE $${values.length}
            )`);
            }

            if (status) {
                values.push(status);
                conditions.push(`status = $${values.length}`);
            }

            const where = conditions.length
                ? `WHERE ${conditions.join(' AND ')}`
                : '';
            const result = await databasePool.query(
                `SELECT * FROM projects ${where} ORDER BY id`,
                values
            );

            res.json(result.rows);
        } catch (error) {
            console.error('Database query failed:', error.message);
            res.status(500).json({
                error: 'Failed to fetch projects'
            });
        }
    });

    app.get('/api/skills', async (req, res) => {
        try {
            const result = await databasePool.query(
                'SELECT name, level, category FROM skills ORDER BY category, id'
            );

            res.json(result.rows);
        } catch (error) {
            console.error('Database query failed:', error.message);
            res.status(500).json({
                error: 'Failed to fetch skills'
            });
        }
    });

    app.get('/api/education', async (req, res) => {
        try {
            const result = await databasePool.query(
                'SELECT id, name, category, specialization, status, year FROM education ORDER BY id'
            );

            res.json(result.rows);
        } catch (error) {
            console.error('Database query failed:', error.message);
            res.status(500).json({
                error: 'Failed to fetch education'
            });
        }
    });

    app.get('/api/experience', async (req, res) => {
        try {
            const result = await databasePool.query(
                'SELECT id, name, category, organization, specialization, status, year FROM experience ORDER BY id'
            );

            res.json(result.rows);
        } catch (error) {
            console.error('Database query failed:', error.message);
            res.status(500).json({
                error: 'Failed to fetch experience'
            });
        }
    });

    app.get('/api/certificates', async (req, res) => {
        try {
            const result = await databasePool.query(
                'SELECT id, name, description, issuer, issue_date::text AS issue_date, image_url, skills FROM certificates ORDER BY issue_date DESC NULLS LAST, id'
            );

            res.json(result.rows);
        } catch (error) {
            console.error('Database query failed:', error.message);
            res.status(500).json({
                error: 'Failed to fetch certificates'
            });
        }
    });

    return app;
}

if (require.main === module) {
    const port = Number(process.env.PORT) || 3000;
    createApp().listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

module.exports = { createApp };