require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const dialect = (process.env.DB_DIALECT || 'mysql').toLowerCase();
const dbHost = process.env.DB_HOST || '127.0.0.1';
const isLocalDbHost = ['127.0.0.1', 'localhost'].includes(dbHost);
const shouldUseSsl = dialect === 'postgres' && (process.env.DB_SSL === 'true' || !isLocalDbHost);

const sharedDialectOptions = shouldUseSsl
    ? {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
    : undefined;

module.exports = {
    development: {
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dfs_dev',
        host: dbHost,
        port: Number(process.env.DB_PORT) || 3306,
        dialect: process.env.DB_DIALECT || 'mysql',
        dialectOptions: sharedDialectOptions
    },
    test: {
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dfs_test',
        host: dbHost,
        port: Number(process.env.DB_PORT) || 3306,
        dialect: process.env.DB_DIALECT || 'mysql',
        dialectOptions: sharedDialectOptions
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
        dialectOptions: sharedDialectOptions || {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    }
};
