var hello = document.getElementsByClassName('hello')[0];
var chrome = document.getElementsByClassName('find_chrome')[0];
var chrome_input = document.getElementsByClassName('find_chrome_button')[0];
var chrome_link = document.getElementsByClassName('web_link_to_chrome')[0];
var chrome_logo = document.querySelector('.find_chrome img');


setTimeout(()=>{
	hello.style.opacity = 1;
	setTimeout(()=>{
		hello.style.opacity = 0;
	}, 2000);
	setTimeout(()=>{
		hello.style.display = 'none';
	}, 2700)
},100);


setTimeout(()=>{
	chrome.style.display = 'flex';
	chrome_input.style.display = 'block';
	chrome_link.style.display = 'inline';
	setTimeout(()=>{
		chrome.style.opacity = 1;
		chrome_input.style.opacity = 1;
		chrome_logo.style.transform = "rotate(1080deg)";
		setTimeout(()=>{
			chrome_link.style.opacity = 1;
		}, 1000);
	}, 1000);
}, 2800);

chrome_executable_input.onchange = function() {
	var file = this.files[0];
	console.log(file.path);

	if (check(file.path)) {
		//file.path += '/Contents/MacOS/Google Chrome';
		//file.path += '\\Google\\Chrome\\Application\\chrome.exe';
		settings.CHROME_PATH = file.path;
		settings.FIRST_START = false;
		saveSettings();
		document.location.href = 'html/main.html';
	}
}


function check(chromePath) {
	var win = /.*\\Google\\Chrome\\Application\\chrome.exe/i;
	var mac = /.*Google Chrome.app/i;
	if (chromePath.search(win)==-1) {
		document.querySelector('.find_chrome span').innerHTML = 'Выберете Google Chrome';
		document.querySelector('.find_chrome span').style.color = 'red';
		setTimeout(()=> {
			document.querySelector('.find_chrome span').style.color = '#5e5e5e';
			document.querySelector('.find_chrome span').innerHTML = 'Для работы приложения необходим Google Chrome версии не ниже 60';
		}, 2000);
		return false;
	}
	return true;
}