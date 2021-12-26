document.querySelector('body').style.opacity = 1;

var settingsHidden = false;

open_button.onchange = function() {
	var files = this.files;
	var name = files[0].name;
	dataTransfer(files);
	loadSource(name);
	saveSettings();
	RESULT.ARRAY = [];
}


restore_button.onclick = function() {
	if (settings.BACKUP_FILE_NAME != "") {
		var name = settings.BACKUP_FILE_NAME;
		loadSource(name);
		//RESULT.ARRAY = loadXLSX('files/result/result.xlsx');
		reloadResult();
	} else {
		document.getElementsByClassName('file_name_string_text')[0].innerText = 'Файла нет, загрузите новый';
	}
}

enter_button.onclick = async function() {
	if (document.getElementById('auth__login').value != '' && document.getElementById('auth__password').value != '') {
		AUTH_DATA.LOGIN = document.querySelector('#auth__login').value;
		AUTH_DATA.PASSWORD = document.querySelector('#auth__password').value;
		AUTH_DATA.LOGINED = await login(PAGE);
		if(AUTH_DATA.LOGINED) {
			document.querySelector('.auth_message').innerHTML = '<img src="../images/manager_image.svg" height = "20px"> ' + AUTH_DATA.LOGIN;
			document.querySelector('.right__auth__input_block').style.display = 'none';
			document.querySelector('.auth_message').style.color = '#5e5e5e';
		} else {
			document.querySelector('.auth_message').innerText = 'Логин или пароль указаны неверно';
			// document.querySelector('.auth_message').style.color = 'red';
		}
	} else {
		message('Введите логин и пароль');
	}
}


save_button.onclick = function() {
	var login = document.querySelector('#auth__login').value;
	var password = document.querySelector('#auth__password').value;
	if (login != '' && password != '') {
		var authData = {LOGIN:login, PASSWORD:password};
		settings.AUTH.push(authData);
		saveSettings();
	} else {
		message('Введите логин и пароль');
	}
}

start_stop_button.onclick = function() {
	if (SOURCE.ARRAY.length != 0) {
		if (STOP) {
			if (userDefinedSettings.USE_AUTH) {
				if (AUTH_DATA.LOGINED) {
					STOP = false;
					start();
				} else {
					errMessage('Авторизуйтесь на сервисе');
				}
			} else {
				STOP = false;
				start();
			}
		} else {
			STOP = true;
			disableButton('#start_stop_button');
			if (checkArticleFlag(artCounter) == 'loading') {	
				setArticleFlag(artCounter, 'warning')
			}
      		finish();
		}
	} else {
		message('Файл не загружен.\nОткройте или восстановите файл');
	}
}

//
function dataTransfer(file) {
	var content = fs.readFileSync(file[0].path);
	var name = file[0].name;
	try {
		if (settings.BACKUP_FILE_NAME != "") {
			fs.unlinkSync('files/source/' + settings.BACKUP_FILE_NAME);
		}
		fs.writeFileSync('files/source/' + name, content);
		settings.BACKUP_FILE_NAME = name;
	} catch (err) {
		console.log(err);
	}
}

function loadSource(name) {
	SOURCE.ARRAY = loadXLSX('files/source/' + name);
	SOURCE.PATH = 'files/source/' + name;
	showTable(SOURCE.ARRAY);
	var ext = path.extname(name);
	switch(ext) {
		case '.xlsx': document.getElementsByClassName('file_icon')[0].setAttribute('src', '../images/icons/excel_icon.svg'); break;
		case '.xls': document.getElementsByClassName('file_icon')[0].setAttribute('src', '../images/icons/excel_icon.svg'); break;
		case '.csv': document.getElementsByClassName('file_icon')[0].setAttribute('src', '../images/icons/csv_icon.svg'); break;
		case '.txt': document.getElementsByClassName('file_icon')[0].setAttribute('src', '../images/icons/txt_icon.svg'); break;
		default: break;
	}
	document.getElementsByClassName('file_name_string_text')[0].innerText = name + ' открыт';
}

function status(amountOfDone, amountOfAll) {
	var n = amountOfDone/amountOfAll*100;
	var percent = Math.round(n*10)/10;
	percent = percent.toString();
	document.getElementsByClassName('percents')[0].innerText = percent;
	document.getElementsByClassName('footer__status-filler')[0].style.width = percent + "%";
}

function details(text) {
	document.getElementsByClassName('footer__detail_text')[0].innerText = text;
}

function message(text, time) {
	if (time == undefined) {time = 3000;}
	var htmlContent = document.querySelector('.error_message').innerHTML;
	document.querySelector('.error_message').innerText = text;
	setTimeout(()=>{
		document.querySelector('.error_message').innerHTML = htmlContent;
	}, time);
}

function errMessage(text, time) {
	if (time == undefined) {time = 3000;}
	var htmlContent = document.querySelector('.error_message').innerHTML;
	document.querySelector('.error_message').innerText = text; 
	document.querySelector('.error_message').style.color = 'red';
	setTimeout(()=>{
		document.querySelector('.error_message').innerHTML = htmlContent;
		document.querySelector('.error_message').removeAttribute("style");
	}, time);
}

function showTable(aoa) {
	var table_header = document.getElementsByClassName('table_header')[0];
	var table_container = document.getElementsByClassName('table_container')[0];
	var table = '<table>\n';
	var line;
	for (var i = 0; i < aoa.length; i++) {
		line = '<tr>';
		for (var j = 0; j < 4; j++) {
			if(j == 0) {
				line += '<td>' + (i + 1) + '</td>';
			} else {
				line += '<td>' + ((aoa[i][j-1] != undefined)?aoa[i][j-1]:"") + '</td>';
			}
		}

		line += '</tr>\n';
		table += line;
	}
	table += '</table>\n';

	table_header.style.display = 'table';
	table_container.style.display = 'block';
	table_header.innerHTML = '<tr><th>№</th><th>Артикул</th><th>Категория</th><th>Статус</th></tr>';
	table_container.innerHTML = table;
	updateTableStatus(aoa);
	document.querySelector('.visual_container').style.display = 'none';
	document.querySelector('#upload_container').style.justifyContent = 'flex-start';
}


function loadXLSX(filePath) {
	var workBook = XLSX.readFile(filePath);
	var workSheet = workBook.Sheets[workBook.SheetNames[0]];
	var aoa = XLSX.utils.sheet_to_json(workSheet, {header:1, raw: false});
	return aoa;
}

function writeXLSX(aoa, filename) {
	var workbook = XLSX.utils.book_new();
	var worksheet = XLSX.utils.aoa_to_sheet(aoa);
	XLSX.utils.book_append_sheet(workbook, worksheet, 'List_1');  
	XLSX.writeFile(workbook, filename);
}


//Обновляет изображение-статус флажков
function updateTableStatus(aoa, i) {
	// console.log('arguments.length: ' + arguments.length);
	var fileStatusField;
	if (arguments.length == 2) {
		fileStatusField = document.querySelector('.table_container tr:nth-of-type(' + (i+1) + ') td:nth-of-type(4)');
		switch(aoa[i][2]) {
			case TODAY() + ' warning': fileStatusField.innerHTML = '<img src = "../images/icons/warn_icon.svg" height = "25px" title="Загружен не полностью">'; break;
			case TODAY() + ' error': fileStatusField.innerHTML = '<img src = "../images/icons/err_icon.svg" height = "25px" title="Артикул не найден">'; break;
			case TODAY() + ' loading': fileStatusField.innerHTML = '<img src = "../images/icons/loading_icon.svg" height = "25px" title="Загрузка">'; rotateLoadingIcon(aoa, i); break;	
			case TODAY() + ' good': fileStatusField.innerHTML = '<img src = "../images/icons/good_icon.svg" height = "25px" title="Загружен успешно">'; break;
			default: fileStatusField.innerHTML = '';
		}
	} else {
		for (var i = 0; i < aoa.length; i++) {
			fileStatusField = document.querySelector('.table_container tr:nth-of-type(' + (i+1) + ') td:nth-of-type(4)');
			switch(aoa[i][2]) {
			case TODAY() + ' warning': fileStatusField.innerHTML = '<img src = "../images/icons/warn_icon.svg" height = "25px" title="Загружен не полностью">'; break;
			case TODAY() + ' error': fileStatusField.innerHTML = '<img src = "../images/icons/err_icon.svg" height = "25px" title="Артикул не найден">'; break;
			case TODAY() + ' loading': fileStatusField.innerHTML = '<img src = "../images/icons/loading_icon.svg" height = "25px" title="Загрузка">'; rotateLoadingIcon(aoa, i); break;	
			case TODAY() + ' good': fileStatusField.innerHTML = '<img src = "../images/icons/good_icon.svg" height = "25px" title="Загружен успешно">'; break;
			default: fileStatusField.innerHTML = '';
		}
		}
	}
}

async function rotateLoadingIcon(aoa, articleNum) {
	var step = 4;
	var loadingTimer = setInterval(()=>{
			if(aoa[articleNum][2] == TODAY() + ' loading'){
				if (step == 16) {step = 4;}
				var degrees = (30*step) + 'deg'
				document.querySelector('.table_container tr:nth-of-type(' + (articleNum+1) + ') td:nth-of-type(4) img').style.transform = "rotate("+degrees+")";
				step++;
			} else {
				clearInterval(loadingTimer);
			}
	}, 100);
}


var dropArea = document.querySelector('#upload_container');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults (e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, unhighlight, false);
});
function highlight(e) {
  dropArea.classList.add('highlight');
}
function unhighlight(e) {
  dropArea.classList.remove('highlight');
}

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
  var files = e.dataTransfer.files;
  var name = files[0].name;
  dataTransfer(files);
  loadSource(name);
  saveSettings();
  RESULT.ARRAY = [];
}


auth__login.onfocus = function() {
	var loginOptions = '';
	if (settings.AUTH.length != 0) {
		for (var i = 0; i < settings.AUTH.length; i++) {
			loginOptions += '<div>' + settings.AUTH[i].LOGIN + '</div>';
		}
		document.querySelector('#saved_login_elements').innerHTML = loginOptions;
	}
	// document.querySelectorAll('#saved_login_elements div')[1].style.height = '25px';
}

auth__login.onblur = function() {
	if (settings.AUTH.length != 0) {
		setTimeout(()=>{
			document.querySelector('#saved_login_elements').innerHTML = '';

		}, 50);
	}
}

// auth__login.keyup = function() {
// 		document.querySelector('#saved_login_elements').innerHTML = '';
// 		document.querySelector('#saved_login_elements').style.height = '0px';
// }


saved_login_elements.onmousedown = function(event) {
	var target = event.target.innerText;
	document.querySelector('#auth__login').value = target;
	var regular = new RegExp(target);
	for (var i = 0; i < settings.AUTH.length; i++) {
		if (settings.AUTH[i].LOGIN.search(regular) != -1) {
			document.querySelector('#auth__password').value = settings.AUTH[i].PASSWORD;
		}
	}
}

open_settings.onclick = function() {
	(()=>{userDefinedSettings = JSON.parse(fs.readFileSync('system/userDefinedSettings.json'));})(); //Подтягиваем последние сохраненные настройки
	updateSwitchStatus();
	document.getElementsByClassName('body__settings_page')[0].style.visibility = "visible";
	setTimeout(()=>{
		document.getElementsByClassName('body__main_page')[0].style.transform = "translateX(-100%)";
		document.getElementsByClassName('body__settings_page')[0].style.transform = "translateX(-100%)";
		setTimeout(()=>{
			document.getElementsByClassName('body__main_page')[0].style.visibility = "hidden";
		}, 500);
	}, 50);
}

function disableButton(selector) {
	for (var i = 0; i < arguments.length; i++) {
		document.querySelector(arguments[i]).disabled = true;
		document.querySelector(arguments[i]).classList.add('disabled');
	}
}

function enableButton(selector) {
	for (var i = 0; i < arguments.length; i++) {
		document.querySelector(arguments[i]).disabled = false;
		document.querySelector(arguments[i]).classList.remove('disabled');
	}
}


function showSettings() {
	document.querySelector('#open_settings').style.transform = "translateX(0%)";
	settingsHidden = false;
}

function hideSettings() {
	document.querySelector('#open_settings').style.transform = "translateX(150%)";
	settingsHidden = true;
}

function showResultFile() {
	document.querySelector('.result_file').style.display = 'flex';
	setTimeout(()=>{
		document.querySelector('.result_file').style.opacity = 1;
	}, 50);
}

function hideResultFile() {
	document.querySelector('.result_file').style.opacity = 0;
	setTimeout(()=>{
		document.querySelector('.result_file').style.display = 'none';
	},400);
}

function showStartButton() {
	// STOP = true;
	document.getElementById('start_stop_button').innerText = 'Запустить';
	document.getElementById('start_stop_button').setAttribute('title', 'Начать выполнение загрузки');
}

function showStopButton() {
	// STOP = false;
	document.getElementById('start_stop_button').innerText = 'Остановить';
	document.getElementById('start_stop_button').setAttribute('title', 'Остановить загрузку и сохранить результат');

}


function start() {
	if (BROWSER_CLOSED) {
		restartSession();
	} else {
		startScrape(PAGE);
	}
	showStopButton();
	hideSettings();
	hideResultFile();
	disableButton('#enter_button', '#save_button', '#open_button', '#restore_button', '#open_button_wrap');
}

function finish() {
	STOP = true;
	showStartButton();
	showSettings();
	showResultFile();
	enableButton('#enter_button', '#save_button', '#open_button', '#restore_button', '#open_button_wrap'/*, '#start_stop_button'*/);
	pr.write('Script execution finished.');
    details('Загрузка завершена');
	writeXLSX(SOURCE.ARRAY, SOURCE.PATH);
    writeXLSX(RESULT.ARRAY, RESULT.PATH);
}

async function finishAndClose() {
	finish();
    await BROWSER.close();
    BROWSER_CLOSED = true;   	
}


/****************************************************  FLAGS   *****************************************************/


  function setArticleFlag(step, status) {
      switch(status) {
        case 'warning': SOURCE.ARRAY[step][2] = TODAY() + ' warning'; break;
        case 'error': SOURCE.ARRAY[step][2] = TODAY() + ' error'; break;
        case 'loading': SOURCE.ARRAY[step][2] = TODAY() + ' loading'; break;
        case 'good': SOURCE.ARRAY[step][2] = TODAY() + ' good'; break;
        default: SOURCE.ARRAY[step][2] = TODAY() + ' good'; break;
      }
      updateTableStatus(SOURCE.ARRAY, step);
  }


  function checkArticleFlag(articleNumber) {
    switch (SOURCE.ARRAY[articleNumber][2]) {
      case TODAY() + ' warning': return 'warning'; break;
      case TODAY() + ' error': return 'error'; break;
      case TODAY() + ' loading': return 'loading'; break;
      case TODAY() + ' good': return 'good'; break;
      default: return 'empty'; break;
    }
  }


(showHideAuth = function() {
	if (userDefinedSettings.USE_AUTH) {
		if(AUTH_DATA.LOGINED) {
			document.querySelector('.auth_message').innerHTML = '<img src="../images/manager_image.svg" height = "20px"> ' + AUTH_DATA.LOGIN;
			document.querySelector('.right__auth__input_block').style.display = 'none';
			document.querySelector('.auth_message').style.color = '#5e5e5e';
			document.querySelector('.auth_message').style.fontSize = '15px';
		} else {
			document.querySelector('.right__auth__input_block').style.display = 'flex';
			document.querySelector('.auth_message').innerHTML = '';
			document.querySelector('.auth_message').removeAttribute('style');
		}
	} else {
		document.querySelector('.right__auth__input_block').style.display = 'none';
		document.querySelector('.auth_message').innerHTML = 'Авторизация отключена в настройках';
		document.querySelector('.auth_message').style.fontSize = '13px';
	}
})();


function reloadResult() {
	var temp = loadXLSX('files/result/result.xlsx');
	for (var i = 0; i < SOURCE.ARRAY.length; i++) {
		if (SOURCE.ARRAY[i][2] != undefined) {
			if (SOURCE.ARRAY[i][2].substr(0, 10) == TODAY()) {
				for (var j = 0; j < temp.length; j++) {
					if(temp[j][0] == SOURCE.ARRAY[i][0]) {
						RESULT.ARRAY.push(temp[j]);
					} else {
						break;
					}
				}
			} else {
				break;
			}
		} else {
			break;
		}
	}

	
}


win.on('close', async function () {
  this.hide(); // Pretend to be closed already
  await BROWSER.close();
  pr.end('Exit program');
  this.close(true); // then close it forcefully
});



