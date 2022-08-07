class mySession {

    constructor(hex, user, online) {
        this.hexString = hex;
        this.username = user;
        this.online_status = online;
    }

    getUser() {
        return this.username;
    }

    getHex() {
        return this.hexString;
    }

    getSTATUS() {
        return this.online_status;
    }

    setHex(hex) {
        this.hexString = hex;
    }

    setUser(users) {
        this.username = users
    }

    setSTATUS(status) {
        this.online_status = status;
    }


}

module.exports = mySession;