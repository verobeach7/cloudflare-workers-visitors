/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// TypeScript는 home.html이 무엇인지 모르기 때문에 에러를 발생시킴
// @ts-ignore
import home from './home.html';
import { makeBadge } from './utils';

function handleHome() {
	// Response로 home만 보내면 text로 인식함. headers를 함께 보내서 브라우저가 실행할 수 있도록 함.
	return new Response(home, {
		headers: {
			'Content-Type': 'text/html;chartset=utf-8',
		},
	});
}

function handleNotFound() {
	return new Response(null, {
		status: 404,
	});
}

function handleBadRequest() {
	return new Response(null, {
		status: 400,
	});
}

async function handleVisit(searchParams: URLSearchParams, env: Env) {
	console.log(searchParams.toString());
	// search parameters에서 page parameter를 받아옴
	const page = searchParams.get('page');
	console.log(page);
	if (!page) {
		return handleBadRequest();
	}
	const kvPage = await env.DB.get(page);
	let value = 1;
	if (!kvPage) {
		await env.DB.put(page, value + '');
	} else {
		value = parseInt(kvPage) + 1;
		await env.DB.put(page, value + '');
	}
	return new Response(makeBadge(value), {
		headers: {
			'Content-Type': 'image/svg+xml;chartset=utf-8',
		},
	});
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const { pathname, searchParams } = new URL(request.url); // request의 url object를 만들어 줌
		switch (pathname) {
			case '/':
				return handleHome();
			case '/visit':
				// env를 보내 KV Database에 접근할 수 있는 권한을 줌
				return handleVisit(searchParams, env);
			default:
				return handleNotFound();
		}
	},
} satisfies ExportedHandler<Env>;
