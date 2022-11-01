const EventEmitter = require('events');
const http = require('http');
const https = require('https');
const fs = require('fs');
const { triggerAsyncId } = require('async_hooks');
const { userInfo } = require('os');
const pool = require('./connection.js');
const { resolve } = require('path');
const crypto = require('crypto');
const mySession = require('./mySession.js');
const { Http2ServerRequest } = require('http2');
const __GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
const ws = require('ws');
const { WebSocketServer } = require('ws');
const { getSystemErrorMap } = require('util');
const { compileFunction } = require('vm');
const aws = require('aws-sdk');
const s3_bucket = process.env.BUCKET_NAME;
const my_key = 'demo.PNG';
const signedUrlExpireSec = 60
const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    signatureVersion: 'v4',
    region: 'us-east-1',
    secretAccessKey: process.env.SECRET_ACCESS_KEY
})



const server = http.createServer((req, res) => {
    if (req.url == '/') { // START
        fs.readFile('./IntroHTML.html', (error, data) => {
            if (error) {
                res.statusCode = 503;
                res.end();
            }
            //res.setHeader('Set-Cookie',`valid=${generateUniqueHexString}`)
            if (req.headers.cookie === undefined || req.headers.cookie.indexOf("valid=") === -1  ) {
                 res.writeHead(200, {'Set-Cookie': `valid=${generateUniqueHexString(100)}; path='/'; SameSite=Lax; HttpOnly; Secure`});
            }
            res.statusCode = 200;
            res.write(data);
            res.end();
            
        });


    }

    if (req.url.indexOf('.html') != -1 && req.headers.cookie != undefined && req.headers.cookie.indexOf("valid=") != -1) {
        fs.readFile('./' + req.url, (error, data) => {
            if (error) {
                res.write('Error');
            }
            else {
                if (data === undefined) {
                    res.statusCode = 504;
                    res.end()
                }
                else {
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(data);
                }
            }
            
        });
    }
    
    else if (req.url.indexOf('.css') != -1 && req.headers.cookie != undefined && req.headers.cookie.indexOf("valid=") != -1) {
        
        fs.readFile('./MessageCSS.css', (error, data) => {
            
            if (error) {
                res.setStatusCode = 503;
                res.end()
            }
            res.writeHead(200, {"Content-Type" : "text/css" });
            if (data === undefined) {
                res.statusCode = 500;
                res.end()
            }
            else {
                res.statusCode = 200;
                res.write(data);
                res.end();
            }
        });
    } 

    //just regular ass js file requiring-- so to acctually retrieve data another parameter must be set
    else if (req.url.indexOf('.js') != -1 && req.url.indexOf('app') == -1 && req.method == 'GET') { 
        fs.readFile(`./${req.url}`, (error, data) => { 
            if (error) {
                res.statusCode = 501;
                res.end()
            }
            res.writeHead(200, {"Content-Type" : "text/javascript"});
            if (data == undefined) {
                res.statusCode = 500;
                res.end();
            }
            else {
                res.statusCode = 200;
                res.write(data);
                res.end();
            }
        });
          

    } 
    //front -> backend for textbox, submitbtns (user auth) -- LOGIN CHECk; recieves a JSON object
    else if (req.url.indexOf('.js') != -1 && req.method == 'POST' && req.headers.cookie != undefined && req.headers.cookie.indexOf("valid=") !== -1) {
        let dataHolder = [];
        req.on('data', function(chunk) { //recieving data
            dataHolder.push(chunk);
        }).on('end', () => { //scalability
            const sent = JSON.parse(dataHolder);
            const identifier = sent[0];
            const datatypes = sent.slice(1);
            switch (identifier) { //then loginEvent
                case('return'):
                    res.write(req.headers.cookie); //sends only
                    res.end();
                    break;
                case ('login'):
                    const userCheck = datatypes[0];
                    const passCheck = datatypes[1];
                    const csrf_token = datatypes[2];
                    const first_Equal = req.headers.cookie.indexOf("=");
                    let _colon = req.headers.cookie.indexOf(";");
                    if (_colon === -1) {
                        _colon = req.headers.cookie.length;
                    }
                    if (csrf_token !== req.headers.cookie.slice(first_Equal+1, _colon)) {
                        res.statusCode = 403;
                        res.write('CSRF INVALID');
                        res.end();
                        break;
                    }
                    let o = verify(userCheck, 'User');
                    let t = verify(passCheck, 'Pass');
                    if (!o || !t) {
                        res.statusCode = 403;
                        res.write('Unknown Sender');
                        res.end();
                        break;
                    }
                    //query into mysql
                    let mysqlQ1 = `SELECT Username, Password, idUser
                                    FROM user as u
                                    WHERE u.Username = '${userCheck}' AND u.Password = '${passCheck}';`;
                    
                    pool.getConnection((error, con) => {
                        if (error) throw error;
                        con.query(mysqlQ1, (err, data) => {
                            if (err) throw err;
                            
                            if (data[0] === undefined) {
                                res.writeHead(200, {'Set-Cookie': 'session=``; expires=Thu, Jan 01 1970 00:00:00 UTC;'});
                                req.headers.cookie = ''
                                res.write('false');
                                res.end();
                            }
                            else  { //logged in; pull hexcode from server 
                                let bol = true;
                                let hax = generateUniqueHexString(8);
                                while (bol) {
                                    try {
                                        con.query(`UPDATE session SET uuid = '${hax}', START = ${1}  WHERE Username = '${userCheck}'`, (er, da) => {
                                            if (er) throw er;
                                        })
                                    }
                                    catch {
                                        hax = generateUniqueHexString(8);
                                    }
                                    finally {
                                        bol = false;
                                        con.query(`SELECT uuid FROM session WHERE uuid='${hax}'`, (e, d) => {
                                            res.writeHead(200, {'Set-Cookie': `session=${d[0]['uuid']}; Path=/ ; HttpOnly`}) //send cookie containing temp sessionID, notUserID
                                            //res.writeHead(200, {'Upgrade' : `websocket`, 'Connection' : 'Upgrade'})
                                            res.write('true');
                                            res.end();
                                            
                                        })
                                        //this gives a set of all session ids
                                    }
                                
                            }
                            con.release();
                        }
                        })
                    })
                    
                    break;
                case ('register'): //must come from register page 
                    const userValid = datatypes[0];
                    const passValid = datatypes[1];
                    const passValid1 = datatypes[2];
                    const csrf = datatypes[3];
                    const firstEqual = req.headers.cookie.indexOf("=");
                    let colon = req.headers.cookie.indexOf(";");
                    if (colon === -1) {
                        colon = req.headers.cookie.length;
                    }
                    if (csrf !== req.headers.cookie.slice(firstEqual+1, colon)) {
                        res.statusCode = 403;
                        res.write('CSRF INVALID');
                        res.end();
                        break;
                    }
                    //regex here
                    let one = verify(userValid, 'User');
                    let two = verify(passValid, 'Pass');
                    let three = verify(passValid1, 'Pass');
                    if (!one || !two || !three) {
                        res.statusCode = 403;
                        res.write('Unknown Sender');
                        res.end();
                        break;
                    }
                    if (passValid != passValid1) {
                        res.write('diffPasswords');
                        res.end();
                        break;
                    }
                    let mysqlQ2 = `SELECT Username
                                    FROM user as u
                                    WHERE u.Username = ?;`;
                    pool.getConnection((error, con) => {
                        if (error) throw error;
                        con.query(mysqlQ2, userValid , (err, data) => {
                            if (err) throw err;
                            con.release();
                            if (data[0] === undefined) {
                                //alter tempSession to contain values
                                let hex = generateUniqueHexString(16);
                                let tempHex = generateUniqueHexString(8)
                                bol = true;
                                while (bol) {
                                            try { //if repeat/duplicate
                                                con.query(`INSERT INTO session
                                                        VALUES ('${tempHex}', '${hex}', ?, ${1})`, userValid ,(e, d) => {
                                                        })
                                                    }
                                            catch {
                                                hex = generateUniqueHexString(16);
                                                tempHex = generateUniqueHexString(8);
                                            }
                                            finally {
                                                bol = false;
                                                let insertSQL = `INSERT INTO user(idUser, Username, Password)
                                                    VALUES('${hex}', ? , ?)`;
                                                con.query(insertSQL,[userValid, passValid], (err, data) => {
                                                    if (err) throw err;
                                                    con.release();
                                                })
                                            }
                                    res.write('true');
                                    res.end();
                                }
                            }
                            else  {
                                res.write('false');
                                res.end();
                                con.release();
                            }
                        })
                    })
                    break;
                case('clearEverything'):
                    res.writeHead(200,{"Clear-Site-Data": `"cookies", "cache", "storage", "executionContexts"`})
                    res.write('')
                    res.end()
                    break;
                case('authenticate'):
                    res.write('');
                    res.end();
                    break;
                case('getImg'):
                    const url = s3.getSignedUrl('getObject', {
                        Bucket: s3_bucket,
                        Key: my_key,
                        Expires: signedUrlExpireSec
                    })
                    res.write(url);
                    res.end()
                    break;
                default: 
                    res.end();
                
            }

    })
    
        req.on('error', error => {
            console.error(error);
        })
        
        //res.end();
       
     }
     
     //just a regular js file
    
     
});
//https://stackoverflow.com/questions/50093144/mysql-8-0-client-does-not-support-authentication-protocol-requested-by-server


const webServer = new ws.Server( {noServer: true})

function generateUniqueHexString(int) {
    return crypto.randomBytes(int).toString('hex');
}


server.on('upgrade', (req, socket, head) => {
    const path = `./${req.url}`;
    if (path.indexOf('.html') != -1) {
        webServer.handleUpgrade(req, socket, head, (ws) => {   
            if (req.headers.cookie.indexOf("session") !== -1 && req.headers.cookie.indexOf("valid=") !== -1) {
                ws.setCookie = req.headers.cookie.slice(req.headers.cookie.indexOf('session=') + 8);
                ws.csrf = req.headers.cookie.slice(req.headers.cookie.indexOf("=")+1, req.headers.cookie.indexOf(";"));
                webServer.emit('connection', ws, socket, req);
            }
            else { //invalid cookies
                socket.destroy()
            }
            }
        )
    }
    else {
        socket.destroy();
    }
    
})


webServer.on('connection', function connect(ws, socket, req) { //ws is the user websocket
    ws.on('message', function message(data) {
        const newData = JSON.parse(data);
        const identity = newData[0];
        let messages = newData[1];
        let uuid = ws.setCookie;
        let csrf = ws.csrf;
        if (csrf === undefined || uuid === undefined || req.headers.cookie.slice(req.headers.cookie.indexOf("=")+1, req.headers.cookie.indexOf(";")) !== csrf || req.headers.cookie.indexOf("session=") === -1) {
            socket.destroy();
        } else {
        switch (identity) {
            case('begin'): //POOL FRIENDS LIST, MSG HISTORY, ETC.
                pool.getConnection((error, con) => {
                    if (error) throw error;
                    let q1 = `SELECT idUser, Username FROM session WHERE uuid=?`
                        con.query(q1, uuid, (err, data) => {
                        if (err) throw err;
                        let idUser = data[0]['idUser']; let Username = data[0]['Username'];
                        ws.send(JSON.stringify(new Array('curUser',Username)))
                        let qConnections = `SELECT idUser, idUserTo FROM connections WHERE idUser = '${idUser}'` //gives list of connections
                        con.query(qConnections, (err, data) => {
                            if (err) throw err;
                            let connections = []
                            for (let i = 0; i < data.length; i++) {
                                connections.push(data[i]['idUserTo']);
                            }
                            let q = '';
                            let fr = '';
                            for (let i = 0; i < connections.length; i++) {
                                if (i === connections.length-1) {
                                    q = q + `idUser != '${connections[i]}' `;
                                    fr = fr + `idUser = '${connections[i]}' `;
                                }
                                else {
                                    q = q + `idUser != '${connections[i]}' AND `;
                                    fr = fr + `idUser = '${connections[i]}' OR `;
                                }
                            }
                            
                            if (q === '') {
                                q = `SELECT Username FROM user WHERE idUser != '${idUser}' LIMIT 10`
                            }
                            else {
                                q = `SELECT Username FROM user WHERE ${q} AND idUser != '${idUser}' LIMIT 10`;
                            }
                            let newFriends = ['suggestions'];
                            con.query(q, (err, data) => {
                                if(err) throw err;
                                for (let i = 0; i < data.length; i++) {
                                    newFriends.push(data[i]['Username']);
                                }
                                ws.send(JSON.stringify(newFriends));
                            })
                            if (fr !== '') { //we do have friends ---> if we don't have friends dont do anything
                                fr = `SELECT Username FROM user WHERE ${fr} AND idUser != '${idUser}'`;
                                con.query(fr, (err, data) => {
                                    if (err) throw err;
                                    let friends = [];
                                    for (let i = 0; i < data.length; i++) {
                                        friends.push(data[i]['Username']);
                                    }
                                    friends.splice(0,0,'friends');
                                    ws.send(JSON.stringify( friends));
                                })
                            }
                            let activeChat = `SELECT idUserTo FROM connections WHERE idUser = '${idUser}' AND STATUS = 1`
                            con.query(activeChat, (err, data) => {
                                if (err) throw err;
                                if (data[0] === undefined) {
                                    con.release();
                                    ws.send(JSON.stringify('Error'));
                                }
                                else {
                                    let pull = data[0]['idUserTo'];
                                    con.query(`SELECT u.Username, mh.Content, mh.timeSent
                                            FROM message_history AS mh
                                            LEFT JOIN user AS u
                                                ON u.idUser = mh.idUserTo
                                            LEFT JOIN session AS s
                                                ON u.idUser = s.idUser
                                            WHERE (mh.idUser = '${idUser}' AND mh.idUserTo = '${pull}') OR (mh.idUser = '${pull}' AND mh.idUserTo = '${idUser}')
                                            ORDER BY timeSent DESC`, (err, data) => {
                                        if (err) throw err;
                                        if (data[0] === undefined) {
                                            data.splice(0,0,'')
                                        }
                                        else {
                                            for (const obj of data) {
                                                if (obj['Username'] !== Username) {
                                                    data.splice(0,0,obj['Username']);
                                                    break;
                                                }
                                            }
                                        }
                                        data.splice(0,0,Username);
                                        data.splice(0,0,'activeChat');
                                        ws.send(JSON.stringify(data));
                                        con.release();
                                    })
                                }   
                            })
                        })
                        
                    })
                })
                break;
            case('msg'): 
                //then write back actual msgs
                messages = messages.slice(0, 200);
                pool.getConnection((error, con) => {
                    if (error) throw error;
                    //find idUserTo WHERE STATUS in connections = 1
                    con.query(`SELECT c.idUser, c.idUserTo, s.uuid, s.Username, c.STATUS
                                FROM connections as c
                                LEFT JOIN session as s
                                    ON c.idUser = s.idUser
                                WHERE s.uuid = ? AND c.STATUS = 1`, uuid, (err, data) => {
                                    if (err) throw err;
                                    if (data[0] === undefined) {
                                        con.release();
                                        ws.send(JSON.stringify('Error'));
                                    }
                                    else {
                                        const idUser = data[0]['idUser'];
                                        const idUserTo = data[0]['idUserTo'];
                                        let prevLoc = 0;
                                        let temp = messages;
                                        while (true) { //handles ' in string
                                            let loc = messages.indexOf("'", prevLoc);
                                            if (loc === -1) break;
                                            if (loc != -1) {
                                                messages = messages.slice(prevLoc, loc) + "''" + messages.slice(loc+1);
                                                prevLoc = loc + 2;
                                            }
                                        }
                                        con.query(`SELECT * FROM session WHERE idUser = '${idUserTo}'`, (err, data) => {
                                            if (err) throw err;
                                            const otherUser_uuid = data[0]['uuid'];
                                            for (client of webServer.clients) {
                                                if (client.setCookie === otherUser_uuid) { //the other user --- if they're not online, then this line of code doesn't matter
                                                    client.send(JSON.stringify(new Array('msg','you', temp)));
                                                    break;
                                                }
                                            }
                                        })
                                        con.query(`INSERT INTO message_history VALUES('${idUser}', '${idUserTo}', ? , DEFAULT)`, messages, (e, d) => { 
                                            if (e) throw e; con.release(); ws.send(JSON.stringify(new Array('msg','me', temp))); 
                                        })
                                    }
                                })
                                
                })
                break;
            //everytime an alert request is sent, then update seen to yes for all values for current user 
            case('alerts'):   // *     NOTES: accepting a friend request doesn't remove the previous friend alert in real time , order may be messed up for the first requester, and test adding friends while having alerts tab open *
                pool.getConnection((error, con) => {
                    if (error) throw error;
                    con.query(`UPDATE friend_request AS fr
                                LEFT JOIN session AS s
                                    ON s.idUser = fr.idUserTo
                                SET fr.seen = 'yes'
                                WHERE s.uuid = ?`, uuid,  (err, data) => {
                                    if (err) throw err; 
                                con.query(`SELECT u.Username, fr.type, fr.timeSent, fr.Content, fr.seen
                                    FROM friend_request AS fr
                                    LEFT JOIN session AS s
                                        ON s.idUser = fr.idUserTo
                                    LEFT JOIN user AS u 
                                        ON fr.idUser = u.idUser
                                    WHERE s.uuid = ? ORDER BY timeSent `, uuid, (err, data) => {
                                        if (err) throw err;
                                        data.splice(0,0,'alerts');
                                        ws.send(JSON.stringify(data));
                                        con.release();
                                    })
                                })
                  
                })
                break;
            case('newAlerts'): //once again pull from server
                let suggestionList1 = newData[2];
                let friendList1 = newData[3];
                pool.getConnection((error, con) => {
                    if (error) throw error;
                    con.query(`SELECT * FROM session WHERE uuid = ? UNION
                                SELECT * FROM session WHERE Username = ?`, [uuid, messages], (err, data) => {
                                    if (err) throw err;
                                    const our_Username = data[0]['Username'];
                                    const id_User = data[0]['idUser'];
                                    const id_User_To = data[1]['idUser'];
                                    const otherUserUUID = data[1]['uuid'];
                                    const otherUsername = data[1]['Username'];
                                    con.query(`SELECT * FROM friend_request WHERE idUser = '${id_User}' AND idUserTo = '${id_User_To}' AND (type='friend_request' OR type='standard')`, (err, data) => {
                                        if (err) throw err;
                                        if (data[0] !== undefined) { //alr exists
                                            ws.send(JSON.stringify("Error"));
                                        }
                                        else if (id_User === undefined || id_User_To === undefined) { //meaning no such user exists
                                            ws.send(JSON.stringify('500x'));        
                                            con.release();                          
                                        }

                                    //else we good
                                        else { //idUserTo is the client who recieves the request/alert
                                            let newString = `${our_Username} has sent a friend request. `;
                                            con.query(`INSERT INTO friend_request VALUES ('${id_User}', '${id_User_To}', '${newString}', 'friend_request', DEFAULT, DEFAULT)`, (err, data) => {
                                                if (err) throw error;
                                                //now we send the other user the new alert
                                                for (const ws of webServer.clients) {
                                                    if (ws.setCookie === otherUserUUID) {
                                                        ws.send(JSON.stringify(new Array('newFriendRequestAlert1', newString, our_Username)));
                                                        break;
                                                    }
                                                }
                                                
                                            })
                                            let newString1 = `You have sent a friend request to ${otherUsername}.`
                                            con.query(`INSERT INTO friend_request VALUES ('${id_User}', '${id_User}', '${newString1}', 'standard', DEFAULT, DEFAULT)`, (err, data) =>{
                                                if (err) throw err;
                                                con.release();
                                                ws.send(JSON.stringify(new Array('newFriendRequestAlert0', newString1, otherUsername)));
                                            })
                                        }
                                    })
                                        })
                                    
                             
                })
                break;
            case('addFriend'): //get suggestionlist and friendlist from our server... not the frontend
                let suggestionList = newData[2];
                let friendList = newData[3];
                //check messages
                if (/[-$\%^\&\*(){}[\]"'\?\><,.\+=_@!#;\:|\\]/.test(messages)) {
                    break;
                }
                pool.getConnection((error, con) => {
                    if (error) throw error;
                    con.query(`SELECT * FROM session WHERE uuid = ? UNION
                                SELECT * FROM session WHERE Username = ? `, [uuid, messages], (err, data) => {
                                    
                        if (err) throw err;
                        const ourUsername = data[0]['Username'];
                        const idUser = data[0]['idUser'];
                        const idUserTo = data[1]['idUser'];
                        const otherUser_uuid = data[1]['uuid'];
                        con.query(`INSERT INTO connections VALUES ('${idUser}', '${idUserTo}', DEFAULT),
                                    ('${idUserTo}', '${idUser}', DEFAULT)`, (err, data) => {
                            if (err) throw err;
                                let newName = '';
                                con.query(`SELECT Username FROM session WHERE uuid != '${uuid}'`, (err, data) => {
                                    if (err)  throw err;
                                    for (const obj of data) {
                                        if (suggestionList.indexOf(obj['Username']) === -1 && friendList.indexOf(obj['Username']) === -1) { // if the new user isn't in our friends list and if it isn't in our previous suggestions list
                                            newName = obj['Username'];
                                            break;
                                        }
                                    }
                                    
                                    (newName === '') ? ws.send(JSON.stringify(new Array('addFriend', messages))) : ws.send(JSON.stringify(new Array('addFriend', messages, newName)))
                                    //after we send the updates, send new bitchass SHEEE
                                    
                                })
                                con.query(`INSERT INTO friend_request VALUES('${idUser}', '${idUser}', '${messages} is now your friend.','standard', DEFAULT, DEFAULT)`, (err, data) => {
                                    if (err) throw err;
                                }) 
                                con.query(`INSERT INTO friend_request VALUES ('${idUserTo}', '${idUserTo}', '${ourUsername} has accepted your friend request', 'standard', DEFAULT, DEFAULT)`, (err, data) => {
                                    if (err) throw err;
                                })
                                //the person accepting the friend request is the one who received the initial request -- also i think i made sure no duplicate friend requests (yup)- -test tho
                                con.query(`DELETE FROM friend_request WHERE idUser = '${idUserTo}' AND idUserTo = '${idUser}' AND type='friend_request' LIMIT 1`, (err, data) => {
                                    if (err) throw err;
                                    ws.send(JSON.stringify(new Array('updateAlerts')));
                                })
                                con.query(`SELECT * FROM connections WHERE idUser = '${idUser}' AND STATUS = 1`, (err, data) => {
                                    if (err) throw err;
                                    if (data[0] === undefined) { //NO STATUS = 1;
                                        con.query(`UPDATE connections SET STATUS = 1 WHERE idUser = '${idUser}' LIMIT 1`, (err, data) => { if(err) throw err; })
                                    }
                                })
                                con.query(`SELECT * FROM connections WHERE idUser = '${idUserTo}' AND STATUS = 1`, (err, data) => {
                                    if (err) throw err;
                                    if (data[0] === undefined) { //NO STATUS = 1;
                                        con.query(`UPDATE connections SET STATUS = 1 WHERE idUser = '${idUserTo}' LIMIT 1`, (err, data) => { if(err) throw err; })
                                        con.release();
                                    }
                                })
                                for (const wsObj of webServer.clients) { //need to send an update to the new Friend
                                        if (wsObj.setCookie === otherUser_uuid) { // a match
                                            wsObj.send(JSON.stringify(new Array('addFriendOther', ourUsername)));
                                            break;
                                        }
                                    }
                        }) 
                    
                    }) 
                    
                })
                break;
            case('addFriendOther'): //get friendlist and suggestionslist from our server... 
                let suggestionsList = newData[2];
                let friendsList = newData[3];
                if (/[-$\%^\&\*(){}[\]"'\?\><,.\+=_@!#;\:|\\]/.test(messages)) {
                    break;
                }
                pool.getConnection((error, con) => {
                    if (error) throw error;
                    con.query(`SELECT * FROM session WHERE uuid = ? UNION
                                SELECT * FROM session WHERE Username = ? `, [uuid, messages], (err, data) => {
                        if (err) throw err;
                        const idUser = data[0]['idUser'];
                        const idUserTo = data[1]['idUser'];
                        let newName = '';
                        con.query(`SELECT Username FROM session WHERE uuid != ? `,  uuid ,(err, data) => {
                            if (err)  throw err;
                            con.release();
                            for (const obj of data) {
                                if (suggestionsList.indexOf(obj['Username']) === -1 && friendsList.indexOf(obj['Username']) === -1) { // if the new user isn't in our friends list or if it isn't in our previous suggestions list
                                    newName = obj['Username'];
                                    break;
                                }
                            }
                            (newName === '') ? ws.send(JSON.stringify(new Array('addFriend', messages))) : ws.send(JSON.stringify(new Array('addFriend', messages, newName)));
                        })

                    })
                })
                break;
            case('rejectFriend'): //we have uuid, which is the person rejecting the request -- we have username, the identity of the dude who sent the req
                pool.getConnection((error, con) => {
                    if (error) throw error;
                    con.query(`SELECT * FROM session WHERE Username = ? OR uuid = ? `, [messages, ws.setCookie], (err, data) => {
                        if (err) throw err;
                        if (data[1] === undefined)
                            ws.send(JSON.stringify(new Array('error')))
                        else {
                            let idUser = data[0]['idUser'];
                            let idUserTo = data[1]['idUser'];
                            let otherUsername = data[1]['Username'];
                            let otherUUID = data[0]['uuid'];
                            let statement = `DELETE FROM friend_request AS fr
                                            WHERE fr.type = 'friend_request' AND (idUser = ? AND idUserTo = ?) LIMIT 1`
                            con.query(statement, [idUser, idUserTo], (err, data) => {
                                if (err) throw err;
                            })
                            let insertion = `INSERT INTO friend_request VALUES(?, ?, ?, 'standard', DEFAULT, DEFAULT)`
                            con.query(insertion, [idUserTo, idUser, `${otherUsername} has rejected your friend request`], (err, data) => {
                                if (err) throw err;
                                con.release();
                                ws.send(JSON.stringify(new Array('alerts'))); //this is just to update the personwho rejected the request
                            })
                            for (const clients of webServer.clients) {
                                if (clients.setCookie === otherUUID) {
                                    clients.send(JSON.stringify(new Array('alerts')));
                                    break;
                                }
                            }
                        }
                    })         
                }) 
                break;
            case('changeChat'):
                //messages is the user to switch chat to
                //find idUser and idUserTo to log in connections, and change connections STATUS to 0 and 1
                pool.getConnection((error, con) => {
                    if (error) throw error;
                    let bQuery = `SELECT * FROM user WHERE Username = ?`;
                    let query = `SELECT * FROM user AS u 
                                    LEFT JOIN connections AS c
                                        ON c.idUser = u.idUser
                                    LEFT JOIN session AS s
                                        ON s.idUser = u.idUser
                                    WHERE s.uuid = ? AND STATUS = 1`
                    con.query(bQuery, messages ,(err, data) => {
                        if (err) throw err;
                        if (data[0] === undefined) { //not valid username
                            ws.send(JSON.stringify('Error'));
                            con.release();
                        }
                        else {
                            const idUserTo = data[0]['idUser']; //new chat 
                            con.query(query, uuid, (err, data) => {
                                if (err) throw err;
                                if (data[0] === undefined) {
                                    ws.send(JSON.stringify('Error'));
                                    con.release();
                                }
                                else {
                                    const idUser = data[0]['idUser']; //user
                                    const oldUser = data[0]['idUserTo'];
                                    //first clear STATUS of 1
                                    con.query(`UPDATE connections SET STATUS = 0 WHERE idUser = '${idUser}' AND idUserTo = '${oldUser}' AND STATUS = 1`, (err, data) => {
                                        if (err) throw err;
                                    })
                                    con.query(`UPDATE connections SET STATUS = 1 WHERE idUser = '${idUser}' AND idUserTo = '${idUserTo}' AND STATUS = 0`, (err, data) => {
                                        if (err) throw err;
                                    })
                                    con.query(`SELECT * FROM message_history AS mh
                                            LEFT JOIN session AS s
                                                ON s.idUser = mh.idUser
                                            WHERE (mh.idUser = '${idUser}' AND mh.idUserTo = '${idUserTo}') OR (mh.idUser = '${idUserTo}' AND mh.idUserTo = '${idUser}') 
                                            ORDER BY timeSent DESC`, (err,data) => {
                                        if (err) throw err;
                                        if (data[0] === undefined) { //not a single message
                                            ws.send(JSON.stringify(new Array('changeChat')));
                                            con.release();
                                        }
                                        else {
                                            console.log(data)
                                            data.splice(0,0,uuid);
                                            data.splice(0,0,'changeChat');
                                            ws.send(JSON.stringify(new Array(data[0], data[1], data[2]['Username'], data[2]['Content'], data[2]['uuid'], data['timeSent'])));
                                            con.release();
                                        }
                                        
                                    })
                                    
                                }
                            })
                        }
                    })
                })
                break;
            case('searching'):
                //messages is the character/string to look for
                messages.trim();
                if (/[-$\%^\&\*(){}[\]"'\?\><,.\+=_@!#;\:|\\]/.test(messages)) {
                    break;
                }
                pool.getConnection((error, con) => {
                    if (error) throw err;
                    con.query(`SELECT * FROM connections AS c LEFT JOIN session AS s ON s.idUser = c.idUser
                                WHERE s.uuid = ?`, uuid, (err, data) => {
                                    if (err) throw err;
                                    let friends = [];
                                    for (const obj of data) {
                                        friends.push(obj['idUserTo'])
                                    }
                                    let charString = '';
                                    charString = `SELECT u.idUser, s.uuid, u.Username
                                                    FROM user AS u
                                                    LEFT JOIN session AS s
                                                        ON s.idUser = u.idUser
                                                    WHERE s.Username REGEXP ? AND s.uuid != ?`
                                    let hold = [`^${messages}`, uuid];
                                    for (let i = 0; i < friends.length; i++) { //if we have no friends this doesn't do anything
                                        let idUserTo = friends[i];
                                        hold.push(idUserTo)
                                        charString = charString + ` AND u.idUser != ? `
                                    }
                                    charString = charString + ' LIMIT 10'
                                    con.query(charString, hold, (err, data) => {
                                        if (err) throw err;
                                        data.splice(0,0,'results');
                                        ws.send(JSON.stringify(data));
                                        con.release();
                                    })
                                })
                    
                })
                break;
            default:
                ws.send(JSON.stringify(new Array("Error")));
                break;
            
        } }
    })

})

server.listen(process.env.PORT || 3000, '0.0.0.0', function() {
})



//Sec-WebSocket-key as key
function generateAcceptVal(key) {
    return crypto
    .createHash('sha1')
    .update(key + __GUID, 'binary')
    .digest('base64');
}

function verify(info, type) { //obj info -- dict
    if (/\s/g.test(info)) { //if any whitespace
        return false;
    }
    else if (/[-$\%^\&\*(){}[\]"'\?\><,.\+=_@!#;\:|\\]/.test(info)) {
        return false;
    }
    else if (type == 'Pass' && (info.length < 6 || info.length > 16 )) { //a password that isn't valid
        return false;
    }
    else if (type == 'User' != -1 && (info.length < 6 || info.length > 32)) {
        return false;
    }
    else if (info === null || info.length <= 1) { //final resort;
        return false;
    }
    return true;
}
    

