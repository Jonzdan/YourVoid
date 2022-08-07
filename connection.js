const mysql2 = require('mysql2');
const pool = mysql2.createPool({
    connectionLimit: 100,
    host: 'localhost',
    user: 'root',
    password: 'Fjj937637848!',
    database: 'yourvoiddb',
})

//FASDHvnauycHHAFJSHDvlASDBJCA MYSQL MASTER PASSWORD
module.exports = pool;