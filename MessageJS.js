let errorCount = 3;
document.addEventListener('DOMContentLoaded', domLoad)
window.addEventListener('resize', (e) => {
    updateMessageBoxWidthAndHeight();
})
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
    ajax.send(JSON.stringify(new Array('return')));
    ajax.onload = () => {
        let cookie = ajax.responseText.slice(ajax.responseText.indexOf("=")+1)
        let end = ajax.responseText.indexOf(";")
        if (end !== -1) {
            cookie = ajax.responseText.slice(ajax.responseText.indexOf("=")+1, end);
        }
        (cookie.length != 0) ? document.querySelector("body").insertAdjacentHTML("beforeend", `<input type='hidden' name='csrf' content="${cookie}">`) : document.location.href = '/';
    }
})

document.querySelector("#logout").addEventListener("click", (e) => {
    
    const ajax = new XMLHttpRequest();
    ajax.open("POST", "./app.js");
    ajax.onload = () => {
        socket.close()
        document.location.href = './'
        
    }
    ajax.send(JSON.stringify(new Array('clearEverything')));
})

document.querySelector("#settings").addEventListener("click", (e) => {
    document.location.href = './settings.html'
})

document.querySelector("#alerts").addEventListener("click", openDropDown);


function openDropDown(e) {  
    let dropdown = document.querySelector("#alertsDropDown");
    dropdown.style.display = 'block';
    dropdown.scrollTop = 2000;
    socket.send(JSON.stringify(new Array('alerts')));
    document.querySelector("#alerts").className = '';
    document.addEventListener("click", clear);
    document.querySelector("#alertsDropDown").removeEventListener("click", openDropDown);
}

function clear(e) {
    let l = ['check', 'X', 'subMessage', 'friendRequestMessage', 'standardMsg'];
    if (e.target.id !== 'alertsDropDown' && e.target.id != 'alerts' && l.indexOf(e.target.className) === -1) {
        document.querySelector("#alertsDropDown").style.display = 'none';
        let child = document.querySelector("#alertsDropDown").children;
        for(let i = child.length - 1; i >= 0; i--) {
            child[i].remove();
        }
        document.querySelector("#alertsDropDown").addEventListener("click", openDropDown);
        document.removeEventListener("click", clear);
    }
}
document.querySelector("#switchmodes").addEventListener("click", lightDarkMode);

function lightDarkMode(e) { //work on this next
    if (document.querySelector(".messageBoxes").className.indexOf('invert_color') === -1) {
        document.querySelector(".messageBoxes").className += ' invert_color';
        document.querySelector(".sidePanelFriends").className += ' invert_color';
        document.querySelector(".sidePanelSuggestions").className += ' invert_color';
        document.querySelector(".contact").className += ' invert_color';
        document.querySelector(".topMainPage").style.backgroundImage = 'linear-gradient(90deg, rgba(34, 6, 36), black)';
        document.body.style.backgroundColor = 'black';
        document.querySelector("#logout").className = ' invert_color';
        document.querySelector(".talkingTo").style.backgroundImage = `linear-gradient(90deg, #2c1c3b52, #18171a52)`;
    }
    else {
        reverseContrast('.messageBoxes');
        reverseContrast('.sidePanelFriends');
        reverseContrast('.sidePanelSuggestions');
        reverseContrast('.contact');
        document.body.style.backgroundColor = 'initial';
        document.querySelector(".topMainPage").style.backgroundImage = 'var(--navColor)';
        document.querySelector("#logout").className = '';
        document.querySelector(".talkingTo").style.backgroundImage = `var(--box)`;
    }
    
}

function reverseContrast(name) {
    let temp = document.querySelector(name); 
    let subTemp = temp.className; 
    subTemp = subTemp.replace(' invert_color', ''); 
    temp.className = subTemp;
}

document.querySelector("#textbox").addEventListener("onkeydown", (e) => { 
    let prev = 0;
    for (let i = 20; e.value.length % 20 === 0; i+=20) {
        e.value = e.value.slice(prev, i) + '\n' + e.value.slice(i+1);
    }
})

document.querySelector('#search').addEventListener('keyup', (e) => {
    let string = document.querySelector('#search').value;
    string.trim();
    if (!/[-$\%^\&\*(){}[\]"'\?\><,.\+=_@!#;\:|\\]/.test(string)) {
        socket.send(JSON.stringify(new Array('searching', string)));
    }
    else { //doesnt pass
        if (errorCount <= 0) {
            alert('Byebye bitch');
            localStorage.clear();
            document.location.href = './IntroHTML.html';
        }
        alert(`Invalid Character: ${errorCount} warnings left`);
        document.querySelector("#search").value = '';
        errorCount -= 1;
    }
} )

function domLoad() {
    constantViewPort();
    updateMessageBoxWidthAndHeight();
    document.removeEventListener('DOMContentLoaded', domLoad);
}

function constantViewPort() {
    let x = window.pageX;
    let y = window.pageY;
    document.querySelector("body").style.maxWidth = x + 'px';
    document.querySelector("body").style.maxHeight = y + 'px';
}

function updateMessageBoxWidthAndHeight(e) {
    const x = window.innerWidth;
    const y = window.innerHeight;
    const startX = x * (1/8);
    const startY = y * (1/11.7);
    const endX = x * (7/8);
    const endY = y * (11/11.7);
    const width = endX - startX;
    const height = endY - startY;
    let m = document.querySelector("#history");
    document.querySelector(".messageBoxes").style.width = `${width}px`;
    document.querySelector(".messageBoxes").style.height = `${height}px`;
    m.scrollTop = 2000;
}   

function switchChat(e) {
    const user = e.target.textContent; 
    let friendChildren = document.querySelector('#friendBox').children;
    for (const child of friendChildren) {
        child.style.fontSize = 'initial'
        child.style.fontWeight = 'initial'
    }
    e.target.style.fontWeight = 'bold';
    e.target.style.fontSize = '2em';
    document.querySelector(".talkingTo").textContent = user;
    socket.send(JSON.stringify(new Array('changeChat', user)));
}

function addFriend(e) {
    //update with dimensions of suggestions PANEL ONLY
    const target = e.target.textContent;
    var children = document.querySelector(".suggestionBox").children;
    var children1 = document.querySelector("#friendBox").children;
    let names = [];
    let friends = [];
    let specificElement = [];
    for (let i = children.length - 1; i >= 0; i--) {
        if (children[i].className === 'addFriendBox') {
            children[i].remove();
            continue;
        }
        if (children[i].textContent === target) {
            specificElement.push(children[i])
        }
        names.push(children[i].textContent);
    }
    for (const fr of children1) {
        friends.push(fr.textContent)
    }
    
    let x = e.pageX;
    let y = e.pageY;
    let button = document.createElement("button");
    let ratioX = window.innerWidth * .07;
    button.style.left =  x + 'px';
    button.style.top =  y + 'px';
    button.className = 'addFriendBox';
    button.textContent = 'Add Friend';
    if (ratioX + x <= window.innerWidth) { // OFF THE SCREEN DUMBASS
        specificElement[0].insertAdjacentElement('afterend', button);
            button.addEventListener('click', () => {
                socket.send(JSON.stringify(new Array('newAlerts', target, names, friends)));
            })
            //click something else
            // msgs, suggestions, friend panel, top main, or footer
            let msg = document.querySelector(".messageHistory");
            let suggestions = document.querySelector(".sidePanelSuggestions");
            let friend = document.querySelector(".sidePanelFriends");
            let top = document.querySelector(".topMainPage");
            let footer = document.querySelector(".contact");
            msg.addEventListener('click', removeAddFriendBox);
            friend.addEventListener('click', removeAddFriendBox);
            top.addEventListener('click', removeAddFriendBox);
            footer.addEventListener('click', removeAddFriendBox);
            suggestions.addEventListener('click', removeAddFriendBox1);
            
    }
    
}

function removeAddFriend() {
    var children = document.querySelector(".suggestionBox").children;
            for (let i = children.length - 1; i >= 0; i--) {
                if (children[i].className === 'addFriendBox') {
                    children[i].remove();
                    break;
                }
            }
}

function removeAddFriendBox1(e) {
    if (e.target.className === 'suggestionBox') { //so no suggestion is clicked 
        let suggestions = document.querySelector(".sidePanelSuggestions");
        suggestions.removeEventListener('click', removeAddFriendBox1);
        removeAddFriend();
    }
}
function removeAddFriendBox(e) {
    removeAddFriend();
    let msg = document.querySelector(".messageHistory");
    let friend = document.querySelector(".sidePanelFriends");
    let top = document.querySelector(".topMainPage");
    let footer = document.querySelector(".contact");
    msg.removeEventListener('click', removeAddFriendBox);
    friend.removeEventListener('click', removeAddFriendBox);
    top.removeEventListener('click', removeAddFriendBox);
    footer.removeEventListener('click', removeAddFriendBox);
}

const socket = new WebSocket('wss://yourvoid.herokuapp.com/MessageHTML.html');

socket.onopen = (event) => {
    socket.send(JSON.stringify(new Array('begin')));
}

socket.onmessage = (event) => {
    let msg = JSON.parse(event.data);
    let identity = msg[0];
    let other = msg.slice(1);
    switch (identity) {
        case('curUser'):
            document.querySelector("#user").textContent= 'Current User: ' + other;
            break;
        case('friends'): 
            for (let i = 0; i < other.length; i++) {
                document.querySelector("#friendBox").insertAdjacentHTML('beforeend', `<button type='button' class='aFriendPanel'> </button>`);
                document.querySelector("#friendBox").lastElementChild.textContent = other[i];
                document.querySelector("#friendBox").lastElementChild.addEventListener("click", switchChat);
            }
            break;
        case('suggestions'):
            for(let i = 0; i < other.length; i++) {
                document.querySelector(".suggestionBox").insertAdjacentHTML('beforeend', `<button type='button' class='aSuggestionBox'> </button>`);
                document.querySelector(".suggestionBox").lastElementChild.textContent = other[i];
                document.querySelector(".suggestionBox").lastElementChild.addEventListener("click", addFriend);
            }
            break;
        case('activeChat'):
            console.log(other)
            let us = other[0];
            let them = other.slice(1,2);
            document.querySelector("#user").textContent = 'Current User: ' + us;
            other = other.slice(2);
            let hist = document.querySelector(".messageHistory");
            if (other.length > 0) { //valid messages
                let bol = true;
                for(let i = other.length-1; i >= 0; i--) {
                    const username = other[i]['Username'];
                    const uuid = other[i]['uuid'];
                    const time = other[i]['timeSent'];
                    const content = other[i]['Content'];
                    //getFriends
                    if (bol) {
                        const children1 = document.querySelector('#friendBox').children;
                        for (const fr of children1) {
                            if (bol && them != '' && fr.textContent === username && username != us && username === them) {
                                bol = false;
                                fr.style.fontWeight = 'bold';
                                fr.style.fontSize = '2em';
                                break;
                            }
                        }
                        
                    }
                    if (them !== '') {
                        document.querySelector(".talkingTo").textContent = them;
                    }
                    if (us === username) { //a match (other person)
                        hist.insertAdjacentHTML('beforeend', `<h3 class='aMessageBoxTo'> </h3>`);
                        document.querySelector('.messageHistory').lastElementChild.textContent = content;
                    }
                    else {
                        hist.insertAdjacentHTML('beforeend', `<h3 class='aMessageBoxFrom'></h3>`);
                        hist.lastElementChild.textContent = content;
                    }
                    updateMessageBoxWidthAndHeight();
                }
            }
            break;
        case('msg'):
            let secondIdentifier = other[0]
            other = other.slice(1)
            let val = '';
            if (secondIdentifier === 'me') {
                val = `<h3 class="aMessageBoxFrom"> </h3>`;
            }
            else if (secondIdentifier === 'you') {
                val = `<h3 class="aMessageBoxTo"> </h3>`
            }
            else {
                alert('error dumbass')
            }
            const w = document.querySelector('.messageHistory');
            w.insertAdjacentHTML('beforeend', val);
            w.lastElementChild.textContent = other[0];
            break;
        case('changeChat'):
            //either nothing is done or there are messages to load
            let history = document.querySelector(".messageHistory");
            let myID = other[0];
            other = other.slice(1);
            let histChildren = history.children;
            while (histChildren.length != 0) {
                histChildren[0].remove();
            }
            if (other != undefined && other.length > 0) { //valid messages
                let theirUsername = '';
                for(let i = other.length-1; i >= 0; i--) {
                    const username = other[i]['Username'];
                    const uuid = other[i]['uuid'];
                    const time = other[i]['timeSent'];
                    const content = other[i]['Content'];
                    //if uuids match, its from us
                    //if uuids dont match, its from someone else
                    if (myID !== uuid) { //a match (other person)
                        history.insertAdjacentHTML('beforeend', `<h3 class='aMessageBoxTo'> </h3>`);
                        document.querySelector('.messageHistory').lastElementChild.textContent = content;
                        if (theirUsername === '') {
                            theirUsername = username;
                        }
                        
                    }
                    else {
                        history.insertAdjacentHTML('beforeend', `<h3 class='aMessageBoxFrom'></h3>`);
                        history.lastElementChild.textContent = content;
                    }
                }
                if (theirUsername !== '' && document.querySelector('.talkingTo').textContent !== '') {
                    document.querySelector(".talkingTo").textContent = theirUsername;
                }
            }
            updateMessageBoxWidthAndHeight();
            break;
        case('addFriend'): 
            let addedUser = other[0];
            console.log('added: ', addedUser)
            let maybeNewSuggestion = other[1]; 
            console.log(maybeNewSuggestion);
            //add the friend
            document.querySelector('#friendBox').insertAdjacentHTML('beforeend', `<button class='aFriendPanel'> </button>`);
            document.querySelector('#friendBox').lastElementChild.textContent = addedUser;
            if (maybeNewSuggestion === undefined) { //no new suggestions
                var sugg = document.querySelector('.suggestionBox').children;
                for (const button of sugg) {
                    if (button.textContent === addedUser) {
                        button.remove();
                        break;
                    }
                }
            }
            else { 
                console.log(addedUser);
                var sugg = document.querySelector('.suggestionBox').children;
                for (const button of sugg) {
                    if (button.textContent === addedUser) {
                        button.remove();
                        break;
                    }
                }
                let button = document.createElement("button");
                button.className = 'aSuggestionBox';
                var fren = document.querySelector('.suggestionBox');
                fren.appendChild(button);
                fren.lastElementChild.textContent = maybeNewSuggestion;
            }
            removeAddFriend();
            break;
        case('addFriendOther'):
            let userToAdd = other[0];
            other = other.slice(1);
            var children = document.querySelector(".suggestionBox").children;
            var children1 = document.querySelector("#friendBox").children;
            let names = [];
            let friends = [];
            let specificElement = [];
            for (let i = children.length - 1; i >= 0; i--) {
                if (children[i].className === 'addFriendBox') {
                    children[i].remove();
                    continue;
                }
                if (children[i].textContent === userToAdd) {
                    specificElement.push(children[i])
                }
                names.push(children[i].textContent);
            }
            for (const fr of children1) {
                friends.push(fr.textContent)
            }
            socket.send(JSON.stringify(new Array('addFriendOther', userToAdd, names, friends)));
            break;
        case('results'):
            let c = document.querySelector('.suggestionBox').children;
            for (let i = c.length - 1; i >= 0; i--) {
                c[i].remove();
            }
            for (const newSugg of other) {
                document.querySelector('.suggestionBox').insertAdjacentHTML('beforeend', `<button type='button' class='aSuggestionBox'></box>`);
                document.querySelector('.suggestionBox').lastElementChild.textContent = newSugg['Username'];
            }
            break;
        case('newFriendRequestAlert1'):
            let alert = document.querySelector("#alertsDropDown");
            let receiveUser = other[1];
            let string = other[0];
            //add red notification circle only if the thing isnt already open
            if (alert.style.display !== 'block') {
                document.querySelector("#alerts").className = 'notification';
            }
            
            addFriendRequestDiv(alert, string, receiveUser);
            break;
        case('newFriendRequestAlert0'):
            document.querySelector("#alertsDropDown").insertAdjacentHTML("beforeend", `<button class='standardMsg'></button>`);
            document.querySelector("#alertsDropDown").lastElementChild.textContent = other[0];
            //add red notification circle -- this appears manually...
            if (document.querySelector("#alertsDropDown").style.display  !== 'block') {
                document.querySelector("#alerts").className = 'notification';
            }
            removeAddFriend();
            break;
        case('alerts'): //received all users
            //other is basically all users
            let child = document.querySelector("#alertsDropDown").children;
            for(let i = child.length - 1; i >= 0; i--) {
                child[i].remove();
            }
            let a = document.querySelector("#alertsDropDown");
            for (const alert of other) {
                if (alert['type'] === 'friend_request') {
                    addFriendRequestDiv('#alertsDropDown', alert['Content'], alert['Username']);
                }
                else if (alert['type'] === 'standard') {
                    a.insertAdjacentHTML("beforeend", `<button class='standardMsg'></button>`);
                    a.lastElementChild.textContent = alert['Content'];
                }
            }
            break;
        case('updateAlerts'):
            let temp = document.querySelector("#alertsDropDown").children
            for(let i = temp.length - 1; i >= 0; i--) {
                temp[i].remove();
            }
            socket.send(JSON.stringify(new Array('alerts')));
            break;
        case('500x'):
            document.location.href = './505.html';
            break;
        case('Error'):
            console.log('error buddy');
            break;
}
    }
socket.onclose = (e) => {
    //when the close event is emitted, check if cookie is available **later add authentication thing**
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "./app.js")
    xhr.onload = () => {
        let headers = xhr.getAllResponseHeaders();
        if (headers.indexOf("Cookie") === -1){ //this val does not exist
            document.location.href = './'
        }
    }
    xhr.send(JSON.stringify(new Array('authenticate')))
}

socket.onerror = (e) => {
    //document.location.href = './Error.html';
    throw e;
}


function addFriendRequestDiv(loc, msg, name) {
    let suggestionChildren = document.querySelector(".suggestionBox").children;
    let friendChildren = document.querySelector("#friendBox").children;
    let newPpl = [];
    let fr = [];
    for (const sugg of suggestionChildren) {
        newPpl.push(sugg.textContent);
    }
    for (const f of friendChildren) {
        fr.push(f.textContent);
    }
    console.log(fr, newPpl)
    document.querySelector(loc).insertAdjacentHTML("beforeend", `<div class='friendRequestMessage'></div>`);
    document.querySelector(loc).lastElementChild.insertAdjacentHTML("beforeend", `<button class='subMessage'></button>`);
    document.querySelector(loc).lastElementChild.lastElementChild.textContent = msg;
    document.querySelector(loc).lastElementChild.insertAdjacentHTML("beforeend", `<button class='check'> ✔ </button>`);
    document.querySelector(loc).lastElementChild.lastElementChild.addEventListener("click", (e) => {
        socket.send(JSON.stringify(new Array('addFriend', name, newPpl, fr)));
        //remove friend request
        let frq = `${name} has sent a friend request.`;
        //loop through alertdropdown children
        let ADD = document.querySelector("#alertDropDown").children;
        if (ADD !== undefined) {
            for (const children in ADD) {
                if (children.textContent.indexOf(name) !== -1) { //exists
                    children.remove();
                    document.querySelector("#alertDropDown").insertAdjacentHTML("beforeend", `<button class=standardMsg> ${name} is now your friend. </button>`);
                    break;
                }
            }
        }
        else {
            document.querySelector("#alertDropDown").insertAdjacentHTML("beforeend", `<button class=standardMsg> ${name} is now your friend </button>`);
        }
        
    })
    document.querySelector(loc).lastElementChild.insertAdjacentHTML("beforeend", `<button class='X'> ❌ </div>`);
    document.querySelector(loc).lastElementChild.lastElementChild.addEventListener("click", (e) => {
        socket.send(JSON.stringify(new Array('rejectFriend', name)));
        //remove friend request
    })
}

function checkEnter(e) {
    if (e.code == "Enter" && document.querySelector("#textbox").value.length > 0) {
        let chatBoxMessage = document.querySelector("#textbox");
        const message = chatBoxMessage.value;
        //console.log(message);
        chatBoxMessage.value = "";
        //now textcontent the message
        
        //document.querySelector(".messageHistory").insertAdjacentHTML("beforeend", val);
        //document.getElementById(this.uniqueId.toString()).textContent = message;
     
        //console.log(this.uniqueId);

        //so if enter is hit
        socket.send(JSON.stringify(new Array('msg', message)));


        
    }
}
function checkForTypeInSearch(e) {
    
}
//rows: 10fr/11.7fr
//cols: 1fr/8fr
/*function mousePos(e) {
    let targetAreaX1 = window.innerWidth * (7/8);
    let targetAreaX2 = window.innerWidth;
    let targetAreaY1 = window.innerHeight * (1/11.7);
    let targetAreaY2 = window.innerHeight * (11/11.7);
    let diff = targetAreaY2 - targetAreaY1;
    let y2 = diff * (1/17);
    let newArea = targetAreaY1 + y2;
    let diff2 = targetAreaY2 - newArea;
    let ratio = diff2/10;
    console.log(`ratio : ${ratio} AND beginY: ${newArea}`)
    
    console.log(`Coordinates are: ${e.pageX} and ${e.pageY}; targets are ${targetAreaX1}-${targetAreaX2} by ${targetAreaY1}-${targetAreaY2}`);
} */


 //k
 //K

function errorMsg(ajax) {
    const errorText = document.querySelector("#err1");
            errorText.textContent="The Username or Password provided does not match";
            //check for click in any textbox
            const tempBtn = document.querySelector("#existUsername");
            const tempBtn1 = document.querySelector("#existPass");
            tempBtn.addEventListener("click", (e) => {
                errorText.textContent="";
                tempBtn.removeEventListener();
            });
            tempBtn1.addEventListener("click", (e) => {
                errorText.textContent = "";
                tempBtn1.removeEventListener();
            });
}







/* function changePage2(e) //this happened basically
{
    document.location.href = "RegisterHTML.html";
    registerBtn.removeEventListener();

} */



