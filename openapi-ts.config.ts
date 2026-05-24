import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    input: 'http://api.atleti.kr/v3/api-docs', // 백엔드 서버의 OpenAPI 문서 URL (또는 로컬 파일 경로)
    output: 'src/client',
    plugins: [
        '@hey-api/typescript',
        '@hey-api/sdk',
        {
            name: '@hey-api/client-fetch',
            baseUrl: 'http://api.atleti.kr',
            runtimeConfigPath: './src/client-config',
        },
    ],
});
