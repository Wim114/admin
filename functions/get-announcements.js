const faunadb = require('faunadb');
const q = faunadb.query;

exports.handler = async (event, context) => {
    // Allow CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    const client = new faunadb.Client({
        secret: process.env.FAUNA_SECRET_KEY
    });

    try {
        const result = await client.query(
            q.Map(
                q.Paginate(q.Documents(q.Collection('announcements'))),
                q.Lambda('X', q.Get(q.Var('X')))
            )
        );

        const announcements = result.data.map(item => ({
            id: item.ref.id,
            ...item.data
        }));

        // Filter active announcements
        const now = new Date();
        const activeAnnouncements = announcements.filter(ann => {
            const start = new Date(ann.startDate);
            const end = new Date(ann.endDate);
            return now >= start && now <= end && ann.isActive;
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(activeAnnouncements)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to fetch announcements' })
        };
    }
};