import type { Config } from './client/client/types.gen';

export const createClientConfig = (config: Config): Config => {
    return {
        ...config,
        baseUrl: process.env.NEXT_PUBLIC_API_URL || config.baseUrl,
    };
};
