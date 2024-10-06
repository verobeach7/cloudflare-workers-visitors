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

// Durable Object: Cloudflare가 네트워크 전체에 이 클래스를 저장함
export class ChatRoom {
	state: DurableObjectState;
	// constructor의 state는 storage를 제공함. 이 객체가 삭제되고 다시 생성돼도 계속 지속됨
	constructor(state: DurableObjectState, env: Env) {
		this.state = state;
	}

	// class의 객체지향을 이용하여 함수를 class 내부의 method로 가져옴
	handleHome() {
		// Response로 home만 보내면 text로 인식함. headers를 함께 보내서 브라우저가 실행할 수 있도록 함.
		return new Response(home, {
			headers: {
				'Content-Type': 'text/html;chartset=utf-8',
			},
		});
	}

	handleNotFound() {
		return new Response(null, {
			status: 404,
		});
	}

	/* 브라우저와 서버 사이의 웹소켓 연결 */
	handleConnect(request: Request) {
		/* Step 3: 웹소켓 페어를 생성 */
		const pairs = new WebSocketPair();
		/* Step 4: pairs[1]을 백엔드에서 수락함 */
		this.handleWebSocket(pairs[1]);
		/* Step 5: 유저에게 pairs[0]을 보내줌 */
		// 데이터는 null, status 101은 프로토콜이 변경됨을 의미함(http->ws)
		return new Response(null, { status: 101, webSocket: pairs[0] });
	}

	handleWebSocket(webSocket: WebSocket) {
		// 전달 받은 webSocket을 수락함
		webSocket.accept();
		setTimeout(() => {
			webSocket.send(JSON.stringify({ message: 'hello from backend!' }));
		}, 3000);
	}

	// Durable Object와 소통하기 위해서 Method가 필요함(이 Method는 모든 state 변화를 관리함)
	// Durable Object 안에서 fetch method를 만드는 것이 규칙임
	async fetch(request: Request) {
		const { pathname } = new URL(request.url);
		switch (pathname) {
			case '/':
				return this.handleHome();
			case '/connect':
				/* Step 2: 웹소켓 연결 요청을 처리하기 위해 handleConnect를 호출 */
				return this.handleConnect(request);
			default:
				return this.handleNotFound();
		}
	}
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		/* CounterObject를 이용해 새로운 객체(인스턴스)를 만들고 fetch method를 호출 */
		// Unique ID 생성
		const id = env.CHAT.idFromName('CHAT');
		// new CounterObject(): 이런식으로 사용자가 instance를 만드는 것이 아님. Cloudflare가 대신 이 작업을 해줌
		// Worker가 id를 확인하고 이미 생성되어 있는 id이면 해당 instance를 가져오고, 없으면 해당 id로 새로운 인스턴스를 생성하고 초기화함
		const durableObject = env.CHAT.get(id);
		// durableObject에 fetch request를 보냄
		const response = await durableObject.fetch(request);
		return response;
	},
} satisfies ExportedHandler<Env>;
