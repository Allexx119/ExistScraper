
console.log("Start program");
var pr = new Protocol('system/logs/');
pr.write("Start program");

var URLsite = 'https://www.exist.ru';
var URLmask = '/Price/?pcode=';
var artCounter = 0;


var errCaptcha = {
    name: 'captcha',
    message: 'Поймана Каптча. Текущий результат сохранен.\nДля решения перейдите на сайт ' + URLsite + '.\nЧерез поисковую строку найдите любой артикул.\nПодтвердите что Вы не робот.\nНажмите Запуск.',
    stack:''};

var errAccess = {
  name: 'internetAccess',
  message: 'Нет сетевого доступа к сайту.',
  stack:''};


disableButton('#enter_button', '#save_button', '#start_stop_button');
//Запуск Chrome

(startSession = async function() {
  details("Запуск и подготовка браузера");
  BROWSER = await puppeteer.launch({executablePath: settings.CHROME_PATH, headless: true, args:['--no-sandbox', '--blink-settings=imagesEnabled=false'], ignoreHTTPSErrors:true, ignoreDefaultArgs: ['--disable-extensions', '--disable-popup-blocking']});
  BROWSER_CLOSED = false;
  PAGE = await BROWSER.newPage();
  await PAGE.setViewport({width:1000, height: 1000});//TEMP
  try {
    pr.write("Open: " + URLsite);
    await PAGE.goto(URLsite, {timeout:60000});
    pr.write(URLsite + " successfully opened");
    await PAGE.waitFor(1000);
    enableButton('#enter_button', '#save_button', '#start_stop_button');
    details("Готов");    
  } catch(e) {
    console.log(e);
    pr.white(e);
    errMessage('Нет доступа к сайту.\nЗакройте приложение и повторите попытку позднее', 10000);
    disableButton('#enter_button', '#save_button', '#open_button', '#restore_button', '#open_button_wrap', '#start_stop_button');
    await BROWSER.close();
    pr.end('Exit program');
    throw errAccess;
  }
})();

restartSession = async function() {
  try {
    // await BROWSER.close();
    await startSession();
    // disableButton('#enter_button', '#save_button', '#start_stop_button');   
    if (userDefinedSettings.USE_AUTH) {
      await login(PAGE);
    }
    await startScrape(PAGE);
  } catch(e) {
    console.log(e);
    if (!STOP) {
      restartSession();
    } else {
      await finishAndClose();
    }
  }
}


/****************************************************   AUTH   *****************************************************/


async function login(page) {
  var successfully = false;
  details("Выполняется авторизация на сервисе");
  var navLoginPromise = page.waitForNavigation();
  await page.click('#pnlLogin');
  await page.waitFor(100);
  await page.type('#login', AUTH_DATA.LOGIN, {delay:10});
  await page.type('#pass', AUTH_DATA.PASSWORD, {delay:10});
  await page.waitFor(100);
  await page.click('#btnLogin');
  await navLoginPromise;
  await page.waitFor(1000);
  await page.waitFor('body');
  var content = await page.evaluate(()=> {
    return document.querySelector('body').innerText;
  });
  if(content.search(/.*Ошибка.*/i) != -1) {
    console.log("Login failed.");
    pr.write("Login failed.");
    await page.goBack();
    await page.reload();
    await page.waitFor(500);
  } else {
    successfully = true;
    console.log("Login successfully.");
    pr.write("Login successfully.");
  }
  details("Готов");
  return successfully;
}

async function logout(page) {
  details("Выполняется выход из сервиса"); 
  await page.click('#pnlLogin');
  await page.waitFor(500);
  await page.click('.login-wrapp #logout');
  await page.waitFor(1000);
  await PAGE.goto(URLsite, {timeout:60000});
  await page.waitFor(500);  
  details("Готов");
}


/****************************************************   START SCRAPE   *****************************************************/


async function startScrape(page) {
  try {
    await logic(page);
    enableButton('#start_stop_button');
    pr.write('***');
    await finishAndClose();
  } catch(e) {
    pr.write(e);
    console.log(e);
    if (e.name != 'captcha' && e.name != 'internetAccess') {
      if (!STOP) {
        restartSession();
      } else {
       await finishAndClose();
      }
    } else {
      setArticleFlag(artCounter, 'warning');
      errMessage(e.message, 100000);
      await finishAndClose();
    }
  }
}

/****************************************************   LOGIC   *****************************************************/

async function logic(page) {
  var browser = await page.browser();
  // var WAITING = userDefinedSettings.BEETWIN_REQUEST_TIMEOUT;
  var WAITING = undefined;
  var min = userDefinedSettings.PAGE_TIMEOUT_MIN;
  var max = userDefinedSettings.PAGE_TIMEOUT_MAX;
  var missing = [];

  var currentArticle;
  var currentCategory;

  var now = new Date();
  var today = now.toJSON().substr(0, 10);


  pr.write("Source " + SOURCE.PATH + " loaded, length: " + SOURCE.ARRAY.length);
    
  try {
    await mainSeq(page);
    if (missing.length != 0) {
      pr.write("Missing articles: " + missing);
    }
  } catch(e) {
    throw e;
  }




/******************************************************   MAIN SEQ   *********************************************************/


 async function mainSeq(page) {
      console.log('start mainSeq');
      console.log(STOP);
      pr.write("Start main sequence.");
      for (var i = 0; i < SOURCE.ARRAY.length; i++) { //Перебираем артикулы из исходного файла
      // console.log('i: ' + (i+1) + ' has status: ' + checkArticleFlag(i));
      
        if (!STOP) {
          if(checkArticleFlag(i) != 'good'){
            if (RESULT.ARRAY.length == 0) {
              RESULT.ARRAY.push(['Артикул', 'Искомая категория', 'Производитель', 'Артикул производителя', 'Описание', 'Цена']);
            }
            pr.write('Scraping ' + URLsite + ' from article #' + (i+1) + ' ' + SOURCE.ARRAY[i][0] + ((WAITING != undefined)?(' timeout: ' + (WAITING/1000) + 's'):''));
            status(i,SOURCE.ARRAY.length);
            artCounter = i;
            currentArticle = SOURCE.ARRAY[i][0];
            currentCategory = SOURCE.ARRAY[i][1];

            details("Сейчас загружается: " + currentArticle);
            setArticleFlag(i, 'loading');

            var currentURL = URLsite + URLmask + currentArticle;
            pr.write("Scraping article: #" + (artCounter+1) + " " + currentArticle + " | category: " + currentCategory + " | " + currentURL);
            // console.log("URL: " + currentURL);
            await page.goto(currentURL, {timeout:300000});
            pr.write(currentURL + " successfully opened");
            console.log('');
            console.log("Scrape article: #"+ (artCounter+1) +" " + currentArticle);
            await page.waitFor(varTimeout(min, max));
            var choice = await analyse(page);
            
            try {
              await errHandle(page, choice);
              switch(choice) {
                case 'emptyRequest':
                  pr.write("\tEmpty request, article not found");
                  // console.log("Invalid Article: " + currentArticle);
                  missing.push(currentArticle);
                  setArticleFlag(i, 'error');
                  status(i+1, SOURCE.ARRAY.length);
                  continue;
                  break;          
                case 'catalog':
                  var curRegExp = await getRegExp(SOURCE.ARRAY[i][1]);
                  try {
                    await chooseCategory(page, curRegExp);
                    if (checkArticleFlag(i)=='loading') {
                      setArticleFlag(i);
                    }
                    break;
                  } catch(e) {
                    throw e;
                  }
                default:
                try {
                  await scrape(page);
                  if (checkArticleFlag(i)=='loading') {
                    setArticleFlag(i);
                  }
                  break;
                } catch(e) {
                  throw e;
                }
              }
              status(i+1, SOURCE.ARRAY.length);   
            } catch(e) {
              throw e;
            }
          }
        } else {break}
      }
    }


/****************************************************   CHOOSE CATEGORY   *****************************************************/

  //Выбор категории
  async function chooseCategory(page, categoryDescrRegExp) {
    var selector;
    var links = [];
    var timeout;

    var categoryNotExist = true;
    var catalogs = await page.evaluate(()=>{
      return document.querySelector('.catalogs').outerHTML;
    })

    // var varArtNum = await page.evaluate(()=>{
    //   return document.querySelectorAll('.catalogs li').length;
    // })
    var $ = cheerio.load(catalogs);
    var catalogsItemsCounter = $('li').length;
    // console.log('catalogsItemsCounter: ' + catalogsItemsCounter + ' varArtNum: ' + varArtNum);
    pr.write("Catalog links amount: " + catalogsItemsCounter);    //Если категория найдена - загружаем конкретную категорию

    for (var i = 0; i < catalogsItemsCounter; i++) {
      selector = '.catalogs li:nth-of-type(' + (i+1) + ')';

      var newURL = URLsite + $(selector).find('a').attr('href');
      links.push(newURL);
      pr.write("Link: #" + (i+1) + ' ' + newURL);
      if ($(selector).find('dd').text().search(categoryDescrRegExp) != -1) {
        categoryNotExist = false;
        console.log(currentArticle + ' | Категрия найдена: ' + (i+1) + ' из ' + catalogsItemsCounter);
        pr.write("Category found, go to: " + links[i]);
        await page.goto(links[i], {timeout:120000});
        pr.write(links[i] + " successfully opened");
        var choice = await analyse(page);
        
        try {
          await errHandle(page, choice);
          await page.waitFor(varTimeout(min, max));
          pr.write("Scrape " + links[i]);
          try {
            await scrape(page);
            break;
          } catch(e) {
            throw e;
          }          
        } catch(e) {
          throw e;
        }

      }
    }
    //Иначе загружаем все категории
    if(categoryNotExist) {
      pr.write('Category not found, download all links');
      for (var i = 0; i < catalogsItemsCounter; i++) {
        if (!STOP) {
          console.log(currentArticle + ' | Категрия не найдена, парсим элемент: ' + (i+1) + ' из ' + catalogsItemsCounter);
          pr.write("Go to: " + links[i]);
          await page.goto(links[i], {timeout:120000});
          pr.write(links[i] + " successfully opened");
          var choice = await analyse(page);
          
          try {
            await errHandle(page, choice);
            // await page.waitFor(WAITING);
            await page.waitFor(varTimeout(min, max));
            pr.write("Scrape: " + links[i]);
            try {
              await scrape(page);
            } catch(e) {
              throw e;
            }
          } catch(e) {
            throw e;
          }

        } else {break;}
      }
    }
  }


/****************************************************   GET REGULAR EXPRESSION   *****************************************************/


  //Формирование регулярного выражения для поиска необходимой категории
  function getRegExp(category, direct) {  
    var regExp = '';
    if (arguments.length == 1) {
      direct = true;
    }
    category = category.trim().split(" ");
    if (direct) {
      for (var i = 0; i < category.length; i++) {
        category[i] = category[i].substr(0,category[i].length-2);
        regExp += '(' + category[i] + '.*)';
      }
    } else {
      for (var i = category.length-1; i >= 0; i--) {
        category[i] = category[i].substr(0,category[i].length-2);
        regExp += '(' + category[i] + '.*)';
      }
    }
    regExp = new RegExp(regExp, 'i');
    return regExp;
  }


/****************************************************   SCRAPE   *****************************************************/


  //Скрейпер страницы
  async function scrape(page) {
    pr.write("\tStart scraper");
      try {
        pr.write('Get #priceBody.innerHTML');
        // console.log(document);
        var body = await page.evaluate(()=>{
          return document.querySelector('#priceBody').innerHTML; 
        });
        var $ = cheerio.load(body);
        work($);
      } catch(e) {
        setArticleFlag(artCounter, 'warning');
        throw e;
      }
  }


/****************************************************   ERROR HANDLER   *****************************************************/


  // Обработчик ошибок
  async function errHandle(page, err) {
    pr.write("\tHandle errors");
     switch(err) {
        case 'captcha':
          pr.write("Captcha cached");
          throw errCaptcha;
          break;
        case 'banner':
          pr.write("Banner detected");
          console.log("Banner detected: " + (artCounter+1));
          pr.write("Wait for banner");
            try {
              await page.waitFor('.user-banner__skip');
              page.click('.user-banner__skip');
              await page.waitForNavigation();
            } catch(e) {
              throw e;
            }
          await page.waitFor(100);
          pr.write("Banner skiped");
          break;
        default: break;
      }
  }


/****************************************************   PAGE ANALYSER   *****************************************************/


  //Анализатор страницы
  async function analyse(page) {
    pr.write("\tAnalyse page");
    var choice = await page.evaluate(() => {  //Ловим ошибки
      if (document.querySelector('.g-recaptcha') != null) {
        return 'captcha';
      }
      if (document.querySelector('.menu-curent-node').innerText == 'Пустой запрос') {
        return 'emptyRequest';
      }       
      if (document.querySelector('.catalogs') != null) {
        return 'catalog';
      }
      if (document.querySelector('.user-banner__message') != null) {
        return 'banner';
      }
      return 'default';
    });
    return choice;
  }




/****************************************************   DOM PARSER   *****************************************************/


  //Парсер DOM
  function work($) {
    var classCounter = $('.row-container').length;
    for (var i = 0; i < classCounter; i++) {
      var src = currentArticle.toString();
      var cat = currentCategory.toString();;
      var art = $('.row-container').eq(i).find('.row').find('.name-container').find('.art').text().toString();
      var partno = $('.row-container').eq(i).find('.row').find('.name-container').find('.partno').text().toString();
      var descr = $('.row-container').eq(i).find('.row').find('.descr').text().toString();
      var price = $('.row-container').eq(i).find('.allOffers').find('.bestOffers').eq(0).find('.pricerow').eq(0).find('.price').text();
      price = price.replace(/\s/,'');
      price = price.replace('₽','').toString();
      if (price == '') {price = 'Нет в продаже';}

      var unique = true;
      var row = [src, cat, art, partno, descr, price];
      for (var i = 0; i < RESULT.ARRAY.length; i++) {
        if (RESULT.ARRAY[i].join(',') == row.join(',')) {
          unique = false;
          break;
        }
      }
      if (unique) {
        RESULT.ARRAY.push(row);
      }
      
    }
    pr.write("Page scrape " + classCounter + " analogs");
  }



  function varTimeout(from, to) {
    var timeout = from - 0.5 + Math.random() * (to - from + 1);
    timeout = Math.round(timeout);
    pr.write("Wait for: " + timeout);
    return timeout;
  }
}


