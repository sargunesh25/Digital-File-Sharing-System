require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

module.exports = {
    development: {
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dfs_dev',
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        dialect: process.env.DB_DIALECT || 'mysql'
    },
    test: {
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dfs_test',
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        dialect: process.env.DB_DIALECT || 'mysql'
    },
    production: {
        ...(hasDatabaseUrl
            ? { use_env_variable: 'DATABASE_URL' }
            : {
                username: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                host: process.env.DB_HOST,
                port: Number(process.env.DB_PORT) || 5432
            }),
        dialect: process.env.DB_DIALECT || 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    }
};
