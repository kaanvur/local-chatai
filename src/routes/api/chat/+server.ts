import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
	try {
		const response = await fetch(`${env.VITE_API_URL}/api/v1/auth`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${env.VITE_API_KEY}`,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return new Response(JSON.stringify({ status: 'online', data }), {
			headers: {
				'Content-Type': 'application/json'
			}
		});
	} catch (error) {
		let errorMessage = 'Server is offline';
		if (error instanceof Error) {
			errorMessage = error.message;
		}
		return new Response(JSON.stringify({ status: 'offline', error: errorMessage }), {
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
};

export const POST: RequestHandler = async ({ request }) => {
	const { message, sessionId } = await request.json();

	try {
		const response = await fetch(`${env.VITE_API_URL}/api/v1/workspace/deneme/stream-chat`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${env.VITE_API_KEY}`,
				accept: 'text/event-stream'
			},
			body: JSON.stringify({
				message,
				sessionId,
				mode: 'query'
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return new Response(response.body, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive'
			}
		});
	} catch (error) {
		let errorMessage = 'An error occurred';
		if (error instanceof Error) {
			errorMessage = error.message;
		}
		return new Response(JSON.stringify({ error: errorMessage }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
};
