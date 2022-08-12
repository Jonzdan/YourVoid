const mysql2 = require('mysql2');
const pool = mysql2.createPool({
    connectionLimit: 100,
    host: 'us-cdbr-east-06.cleardb.net',
    user: 'ba21c6470393b0',
    password: 'aca45a73',
    database: 'heroku_aa6c97d55ecec6f',
})

//FASDHvnauycHHAFJSHDvlASDBJCA MYSQL MASTER PASSWORD
module.exports = pool;
