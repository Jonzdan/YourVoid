const goRegister = document.querySelector("#goToRegister")
goRegister.addEventListener("click", preventLink); 
const loginBtn = document.querySelector("#confirmBtn1"); //GET REQUEST FOR USER/PASS IN LOGINPAGE
try {
loginBtn.addEventListener("click", ajaxFunc);
}
catch {  }
const registerBtn = document.querySelector("#confirmBtn2"); //POST REQUEST FOR USER IN REGISTER PAGE
registerBtn.addEventListener("click", ajaxFunc1);
const backTologin = document.querySelector("#goToLogin");
try {
    backTologin.addEventListener("click", changeToLogin);
}
catch (error) {
}
document.addEventListener("DOMContentLoaded", (e) => {
    let a = document.querySelector("body").children;
    for (let i = a.length - 1; i>0; i--) {
        if (a[i].style.cssText === 'position: static !important;') {
            a[i].remove()
            break;
        }
    }
})
document.addEventListener("DOMContentLoaded", () => {
    let ajax = new XMLHttpRequest();
    ajax.open("POST", "./app.js");
    ajax.setRequestHeader('Content-Type', 'application/json')
    ajax.send(JSON.stringify(new Array('return')));
    ajax.onload = () => {
        let cookie = ajax.responseText.slice(ajax.responseText.indexOf("=")+1)
        let end = ajax.responseText.indexOf(";")
        if (end !== -1) {
            cookie = ajax.responseText.slice(ajax.responseText.indexOf("=")+1, end);
        }
        if (cookie.length != 0) {
            document.querySelector("body").insertAdjacentHTML("beforeend", `<input type='hidden' name='csrf' id='csrf_token' content='${cookie}'>`);
        }
        else {
            document.location.href = '/';
        } 
    }
})

function preventLink(e) {
    e.preventDefault();
    const loginSection = document.querySelector(".loginPage");
    goRegister.removeEventListener("click", preventLink);
    loginSection.style.display = 'none';
    document.querySelector(".regPage").style.display = "grid";
    document.querySelector(".regPage").style.gridTemplateColumns = '3fr 3fr 3fr';
    document.querySelector(".regPage").style.gridTemplateRows = '25% 50% 25%';
    document.querySelector(".regPage").style.font = '1.2em Verdana';
    const backTologin1 = document.querySelector("#goToLogin");
    backTologin1.addEventListener("click", changeToLogin);
}

function changeToLogin(e) {
    e.preventDefault();
    document.querySelector(".regPage").style.display="none";
    document.querySelector(".loginPage").style.display="grid";
    document.querySelector(".loginPage").style.gridTemplateColumns = '3fr 3fr 3fr';
    document.querySelector(".loginPage").style.gridTemplateRows = '3fr 5fr 3fr';
    document.querySelector(".loginPage").style.font = '1.2em Verdana';
    document.querySelector("#goToLogin").removeEventListener("click", changeToLogin);
    const goRegister1 = document.querySelector("#goToRegister")
    goRegister1.addEventListener("click", preventLink); 
}


function clientSideVal(info) { //obj info -- dict
    for(const data in info) {
        if (/\s/g.test(info[data])) { //if any whitespace
            whiteSpace('err2');
            return false;
        }
        else if (/[-$\%^\&\*(){}[\]"'\?\><,.\+=_@!#;\:|\\]/.test(info[data])) {
            invalidChar('err2');
            return false;
        }
        else if (data.indexOf('User') != -1 && (info[data].length < 6 || info[data].length > 16 )) { //a password that isn't valid
            tooShort('err2');
            return false;
        }
        else if (data.indexOf('Pass') != -1 && (info[data].length < 6 || info[data].length > 32)) {
            tooShort('err2');
            return false;
        }
        else if (info[data] === null || info[data].length <= 1) { //final resort
            regErrorMsg('something went wrong bitch');
            return false;
        }
    }
    return true;
}

function tooShort(errorID) {
    regErrorMsg('Entered Username or Password must be between 6-16 or 6-32 characters respectively')
}

function invalidChar(errorID) {
    regErrorMsg('Invalid Characters: No Special Characters')
}

function whiteSpace(errorID) {
    regErrorMsg('No spaces allowed')
}

function ajaxFunc1(e) {
    //e.preventDefault();  //apparently you don't need this if you don't have a form attribute
    //create an object that maps user to 
    const entered_User = document.querySelector("#nUsername").value;
    const entered_Pass = document.querySelector("#nPass").value;
    const re_enteredPass = document.querySelector("#rNPass").value;
    parameter = {
        User: entered_User,
        Pass: entered_Pass,
        PassAgain: re_enteredPass
    }
     //so there are no issues
    if (clientSideVal(parameter)) { // passed
        const xhr = new XMLHttpRequest();
            xhr.open("POST", "./app.js");
            xhr.onload = () => { //response should be a simple true or false (boolean)
                if (xhr.responseText === 'true') { //if true, so valid username and pass, then show page saying "you have successfully registered"
                    document.querySelector(".successPage").style.display = "block";
                    document.querySelector(".regPage").style.display = "none";
                    document.querySelector("#confirmBtn2").removeEventListener("click", ajaxFunc1);
                }
                else if (xhr.responseText === 'diffPasswords') {
                    regErrorMsg("Passwords don't match");
                }
                else { //not a valid username
                    //then check if textbox was clicked again
                    regErrorMsg("Username already taken");
                }
                clearTextboxes("nUsername", "nPass", "rNPass");
            }
            const csrf = document.querySelector("#csrf_token").attributes.content.textContent;
            xhr.send(JSON.stringify(new Array("register", entered_User, entered_Pass, re_enteredPass, csrf)));
    }
    
}


function regErrorMsg(errContent) { //this checks for valid username
    const errorText = document.querySelector("#err2");
    errorText.textContent=errContent;
    //check for click in any textbox
    const tempBtn = document.querySelector("#nUsername");
    const tempBtn1 = document.querySelector("#nPass");
    const tempBtn2 = document.querySelector("#rNPass");
    tempBtn.addEventListener("click", regErrText1);
    tempBtn1.addEventListener("click", regErrText2);
    tempBtn2.addEventListener("click", regErrText3);
}



function regErrText1() {
    document.querySelector("#err2").textContent="";
    document.querySelector("#nUsername").removeEventListener("click", regErrText1);
}

function regErrText2() {
    document.querySelector("#err2").textContent="";
    document.querySelector("#nPass").removeEventListener("click", regErrText2);
}

function regErrText3() {
    document.querySelector("#err2").textContent="";
    document.querySelector("#rNPass").removeEventListener("click", regErrText3);
}


function ajaxFunc(e) {
    e.preventDefault();
    const enteredUser = document.querySelector("#existUsername").value;
    const enteredPass = document.querySelector("#existPass").value;
    const ajax = new XMLHttpRequest();
    ajax.open("POST", "../private/app.js");
    ajax.setRequestHeader('Content-Type', 'application/json')
    ajax.onload = () => { // 
        //so the response is true/false
        //get user and pass
        if (ajax.responseText === 'true') { //there was a correct match 
            document.location.href="MessageHTML.html";

            //loginBtn.removeEventListener("click", ajaxFunc);
        }
        else { //incorrect
            errorMsg(ajax);
        }
        
        clearTextboxes("existUsername", "existPass");

    }
    const csrf = document.querySelector("#csrf_token").attributes.content.textContent;
    ajax.send(JSON.stringify(new Array("login", enteredUser, enteredPass, csrf)));
}
 //k
 //K



function clearTextboxes(...idsOfTextboxes) {
    for(const ids of idsOfTextboxes) {
        document.getElementById(ids).value = "";
    }

}
function errorMsg(ajax) {
    const errorText = document.querySelector("#err1");
            errorText.textContent="The Username or Password provided does not match an existing account";
            //check for click in any textbox
            const tempBtn = document.querySelector("#existUsername");
            const tempBtn1 = document.querySelector("#existPass");
            tempBtn.addEventListener("click", errText1);
            tempBtn1.addEventListener("click", errText2);
        }

function errText1() {
            document.querySelector("#err1").textContent="";
            document.querySelector("#existUsername").removeEventListener("click", errText1);
        }

function errText2() {
    document.querySelector("#err1").textContent="";
    document.querySelector("#existPass").removeEventListener("click", errText2);
}

