import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    input: 'http://localhost:8080/v3/api-docs', // 백엔드 서버의 OpenAPI 문서 URL (또는 로컬 파일 경로)
    output: 'src/client',
    plugins: [
        '@hey-api/client-fetch',
        '@hey-api/typescript',
        '@hey-api/sdk',
    ],
});
