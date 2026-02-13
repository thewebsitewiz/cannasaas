declare const _default: (() => {
    postgres: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
    };
    mongodb: {
        uri: string;
    };
    redis: {
        host: string;
        port: number;
        password: string;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    postgres: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
    };
    mongodb: {
        uri: string;
    };
    redis: {
        host: string;
        port: number;
        password: string;
    };
}>;
export default _default;
