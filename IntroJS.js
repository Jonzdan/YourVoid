const startBtn = document.querySelector("#startBTN");
startBtn.addEventListener("click", changePage1);
document.querySelector('#aboutUs').addEventListener("click", (e) => {
    e.preventDefault(); //temp measure
})
document.querySelector("#introSignIn").addEventListener("click", changePage1);
document.querySelector("#here").addEventListener("click", changePage1);
document.addEventListener("DOMContentLoaded", setViewPort);

//add eventlisteners for every object for animation end
document.querySelector("#welcomeText").addEventListener("animationstart", one)

function one(e) {
    if (e['srcElement'].nextElementSibling != null) {
        e['srcElement'].nextElementSibling.className = "appear";
        e['srcElement'].nextElementSibling.style.animationDelay = '1s';
        e['srcElement'].removeEventListener("animationend", one);
        e['srcElement'].nextElementSibling.addEventListener("animationstart", one);
    }
}



function setViewPort(e) {
    let x = window.innerWidth;
    let y = window.innerHeight;
    console.log(x,y);
    //document.querySelector("body").style.maxWidth = x + 'px';
    //document.querySelector("body").style.maxHeight = y + 'px';
    document.removeEventListener("DOMContentLoaded", setViewPort);
}

function changePage1(e) //this happened basically
{
    document.location.href = "RegisterHTML.html";


} 