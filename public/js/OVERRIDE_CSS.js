function loadStyle(url) {
	var link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = url;
	var head = document.getElementsByTagName('head')[0];
	head.appendChild(link);
}
loadStyle('//cdn.jsdelivr.net/npm/prismjs/themes/prism.min.css');
