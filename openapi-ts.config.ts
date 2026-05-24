import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    input: 'http://168.110.106.79:8080/v3/api-docs', // 백엔드 서버의 OpenAPI 문서 URL (또는 로컬 파일 경로)
    output: 'src/client',
    plugins: [
        '@hey-api/typescript',
        '@hey-api/sdk',
        {
            name: '@hey-api/client-fetch',
            baseUrl: 'http://168.110.106.79:8080',
        },
    ],
});
