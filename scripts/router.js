try {
  fs.accessSync(settings.CHROME_PATH);
} catch (err) {
  console.error('no access!');
  settings.FIRST_START = true;
}

if (!settings.FIRST_START) {
	document.location.href = 'html/main.html';
}