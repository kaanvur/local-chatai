import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
};

export const OPTIONS: RequestHandler = async () => {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
    });
};

export async function POST({ request }) {
	try {
		const { text } = await request.json();

		const response = await fetch(`${env.VITE_PLAYHTTP_URL}`, {
			method: 'POST',
			headers: {
				'accept': 'audio/mpeg',
				'content-type': 'application/json',
				'AUTHORIZATION': `${env.VITE_PLAYHTTTP_API_KEY}`,
				'X-USER-ID': `${env.VITE_PLAYHTTTP_USER_ID}`
			},
			body: JSON.stringify({
				text: text,
				voice:
					's3://voice-cloning-zero-shot/285900ed-b758-4abb-a4ef-e7295741d97d/erasmosaad/manifest.json',
				voice_engine: 'PlayDialog',
				language: 'turkish'
			})
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error('Play.ht API error:', {
				status: response.status,
				statusText: response.statusText,
				error: errorData
			});
			return json(
				{
					error: 'API Error',
					details: errorData
				},
				{ status: response.status }
			);
		}

		const audioBuffer = await response.arrayBuffer();

		return new Response(audioBuffer, {
			headers: {
				...CORS_HEADERS,
				'Content-Type': 'audio/mpeg'
			}
		});
	} catch (error) {
		console.error('Server error:', error);
		return json({ error: 'Failed to generate audio' }, { 
            status: 500,
            headers: CORS_HEADERS 
        });
	}
}