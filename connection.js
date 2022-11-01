const mysql2 = require('mysql2');
const pool = mysql2.createPool({
    connectionLimit: 1000,
    host: process.env.HOST_NAME,
    user: process.env.USER_NAME,
    password: process.env.PASS_NAME,
    database: process.env.DATABASE,
})

module.exports = pool;
