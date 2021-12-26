apply.onclick = function() {
	installTimeout();
	saveUserDefindSettings();
	showHideAuth();
}

ok.onclick = function() {
	installTimeout();
	saveUserDefindSettings();
	showHideAuth();
	document.getElementsByClassName('body__main_page')[0].style.visibility = "visible";
	setTimeout(()=>{
		document.getElementsByClassName('body__main_page')[0].style.transform = "translateX(0%)";
		document.getElementsByClassName('body__settings_page')[0].style.transform = "translateX(0%)";
		setTimeout(()=>{
			document.getElementsByClassName('body__settings_page')[0].style.visibility = "hidden";
		}, 500);
	}, 50);
}

cancel.onclick = function() {
	document.getElementsByClassName('body__main_page')[0].style.visibility = "visible";
	setTimeout(()=>{
		document.getElementsByClassName('body__main_page')[0].style.transform = "translateX(0%)";
		document.getElementsByClassName('body__settings_page')[0].style.transform = "translateX(0%)";
		setTimeout(()=>{
			document.getElementsByClassName('body__settings_page')[0].style.visibility = "hidden";
		}, 500);
	}, 50);
}

open_password_manager.onclick = function() {
	showPasswordsTable(settings.AUTH);
	showElement('.settings_page__blur', 'block');	
}

password_manager__save.onclick = function() {
	for (var i = 0; i < settings.AUTH.length; i++) {
		settings.AUTH[i].LOGIN = document.querySelector('.password_manager__table tr:nth-of-type('+(i+1)+') td:nth-of-type(2) input').value;
		settings.AUTH[i].PASSWORD = document.querySelector('.password_manager__table tr:nth-of-type('+(i+1)+') td:nth-of-type(3) input').value;
	}
	saveSettings();
	hideElement('.settings_page__blur');
}

password_manager__cancel.onclick = function() {
	hideElement('.settings_page__blur');
}

var useAuth = document.querySelector('.user_settings tr:nth-of-type(2) td:nth-of-type(2)');
var useCategory = document.querySelector('.user_settings tr:nth-of-type(3) td:nth-of-type(2)');

var updateSwitchStatus;

(updateSwitchStatus = function() {
	if(userDefinedSettings.USE_AUTH) {
		useAuth.innerHTML = '<img src="../images/icons/on_icon.svg" height = "50px">';
	} else {
		useAuth.innerHTML = '<img src="../images/icons/off_icon.svg" height = "50px">';
	}

	if(userDefinedSettings.USE_CATEGORY) {
		
		useCategory.innerHTML = '<img src="../images/icons/on_icon.svg" height = "50px">';
	} else {
		useCategory.innerHTML = '<img src="../images/icons/off_icon.svg" height = "50px">';
	}
})();

(showTimeout = function() {
	document.getElementById('timeout').value = userDefinedSettings.BEETWIN_REQUEST_TIMEOUT;
	document.getElementById('min_timeout').value = userDefinedSettings.PAGE_TIMEOUT_MIN;
	document.getElementById('max_timeout').value = userDefinedSettings.PAGE_TIMEOUT_MAX;
})();

installTimeout = function() {
	userDefinedSettings.BEETWIN_REQUEST_TIMEOUT = document.getElementById('timeout').value;
	userDefinedSettings.PAGE_TIMEOUT_MIN = document.getElementById('min_timeout').value;
	userDefinedSettings.PAGE_TIMEOUT_MAX = document.getElementById('max_timeout').value;
}

useAuth.onclick = function() {
	if (userDefinedSettings.USE_AUTH) {
		userDefinedSettings.USE_AUTH = false;
		useAuth.innerHTML = '<img src="../images/icons/off_icon.svg" height = "50px">';
	} else {
		userDefinedSettings.USE_AUTH = true;
		useAuth.innerHTML = '<img src="../images/icons/on_icon.svg" height = "50px">';
	}
}

useCategory.onclick = function() {
	if (userDefinedSettings.USE_CATEGORY) {
		userDefinedSettings.USE_CATEGORY = false;
		useCategory.innerHTML = '<img src="../images/icons/off_icon.svg" height = "50px">';
	} else {
		userDefinedSettings.USE_CATEGORY = true;
		useCategory.innerHTML = '<img src="../images/icons/on_icon.svg" height = "50px">';
	}
}





function showElement(selector, display) {
	var block = document.querySelector(selector);
	block.style.opacity = 0;
	setTimeout(()=>{
		block.style.display = display;
	}, 10);
	setTimeout(()=>{
		block.style.opacity = 1;
	}, 20);
}	

function hideElement(selector) {
	var block = document.querySelector(selector);
	block.style.opacity = 0;
	setTimeout(()=>{
		block.style.display = 'none';
	}, 500);
}

function showPasswordsTable(aoa) {
	var table_container = document.getElementsByClassName('password_manager__table')[0];
	var table = '';
	var line;
	for (var i = 0; i < aoa.length; i++) {
		line = '<tr><td>' + (i + 1) + '</td><td><input type="text" value="' + aoa[i].LOGIN + '"></td><td><input type="password" value="' + aoa[i].PASSWORD + '"></td><td><img class="remove_password_image" src="../images/icons/bin_icon.svg" title="Удалить логин/пароль" height="20px" alt="' + i +'""></td></tr>';
		table += line;
	}
	table_container.innerHTML = table;
}

passwords_table.onclick = function(event) {
	var target = event.target;
	if (target.tagName == 'IMG') {
		if (confirm('Вы уверены, что хотите удалить логин/пароль?\nЭто действие необратимо!')) {
			settings.AUTH.splice([+target.alt],1);
			console.log(document.querySelector('.password_manager__table tr:nth-of-type('+(+target.alt+1)+')'));
			document.querySelector('.password_manager__table tr:nth-of-type('+(+target.alt+1)+')').outerHTML = null;
			saveSettings();
		}
	}
}