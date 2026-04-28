import { client } from './client.gen';

// 백엔드 API 주소 설정
client.setConfig({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
});

export { client };
