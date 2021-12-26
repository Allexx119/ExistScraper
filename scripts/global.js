const puppeteer = require('puppeteer-core');
const XLSX = require('xlsx');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
var win = nw.Window.get();

var SOURCE = {ARRAY:[], PATH:''};
var RESULT = {ARRAY:[], PATH:'files/result/result.xlsx'};
var STOP = true;

var BROWSER;
var BROWSER_CLOSED;
var PAGE;

var AUTH_DATA = {
	LOGIN:'',
	PASSWORD:'',
	LOGINED:false
}

var settings = {
	AUTH:[],
	BACKUP_FILE_NAME:"",
	CHROME_PATH:"",
	FIRST_START:true
};

var userDefinedSettings = {
	USE_AUTH:true,
	USE_CATEGORY: true,
	BEETWIN_REQUEST_TIMEOUT:0,
	PAGE_TIMEOUT_MIN:0,
	PAGE_TIMEOUT_MAX:0
};


//Подтягиваем настройки из файлов
(function() {
	settings = JSON.parse(fs.readFileSync('system/settings.json'));
	userDefinedSettings = JSON.parse(fs.readFileSync('system/userDefinedSettings.json'));
})();


function TODAY() {
	var now = new Date();
	return now.toJSON().substr(0, 10);
}

function saveSettings() {
	fs.writeFileSync('system/settings.json', JSON.stringify(settings));
}

function saveUserDefindSettings() {
	fs.writeFileSync('system/userDefinedSettings.json', JSON.stringify(userDefinedSettings));
}





//Класс протокола
function Protocol(dir) {
  const fs = require('fs');
  var counter = 0;
  
  this.write = function(string) {
    var now = new Date();
    var date = now.toJSON().substr(0, 10);
      var time = now.toJSON().substr(11, 12);
    var content = (++counter) + '\t[' + date + '] [' + time + ']\t' + string + '\n';
    ws.write(content);
  }

  this.end = function(string) {
    var now = new Date();
    var date = now.toJSON().substr(0, 10);
    var time = now.toJSON().substr(11, 12);
    var content = (++counter) + '\t[' + date + '] [' + time + ']\t' + string + '\n';

    ws.end(content);
  }
  var filename = function(dir) {
    var now = new Date();
    var date = now.toJSON().substr(0, 10);
    var logname = dir + 'protocol_[' + date + '].log';
    // var attempt = 1;
    // var fileExist = true;
    // do {
    //   try {
    //     fs.accessSync(logname, fs.constants.F_OK);
    //       logname = dir + 'protocol_[' + date + ']_' + attempt + '.log';
    //       attempt++;
    //   } catch (err) {
    //       fileExist = false;
    //   }
    // } while (fileExist);
    return logname;
  }
  
  var ws = fs.createWriteStream(filename(dir));
}

