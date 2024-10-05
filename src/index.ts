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

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url); // request의 url object를 만들어 줌
		// console.log(url);

		// pathname을 설정해 url 접근을 통제
		if (url.pathname === '/') {
			await env.DB.put('hello', 'how are you');
			// Response로 home만 보내면 text로 인식함. headers를 함께 보내서 브라우저가 실행할 수 있도록 함.
			return new Response(home, {
				headers: {
					'Content-Type': 'text/html;chartset=utf-8',
				},
			});
		}
		return new Response(null, {
			status: 404,
		});
	},
} satisfies ExportedHandler<Env>;
