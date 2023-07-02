(function () {
	var snippets = document.querySelectorAll('pre');
	[].forEach.call(snippets, function (snippet) {
		snippet.firstChild.insertAdjacentHTML('beforebegin', '<button type="button" title="复制整段代码到剪切板" class="copy-code-to-clipboard-button" data-clipboard-snippet><i class="far fa-copy"></i></button>');
	});
	var clipboardSnippets = new ClipboardJS('[data-clipboard-snippet]', {
		target: function (trigger) {
			return trigger.nextElementSibling;
		}
	});
	clipboardSnippets.on('success', function (e) {
		e.clearSelection();
		//showTooltip(e.trigger, '√');
	});
	clipboardSnippets.on('error', function (e) {
		showTooltip(e.trigger, fallbackMessage(e.action));
	});

	var btns = document.querySelectorAll('.copy-code-to-clipboard-button');
	for (var i = 0; i < btns.length; i++) {
		btns[i].addEventListener('mouseleave', clearTooltip);
		btns[i].addEventListener('blur', clearTooltip);
		btns[i].addEventListener('mouseenter', function (e) {
			//showTooltip(e.currentTarget, "复制？aaaaaaaaaa")
		}, false);
	}

	function clearTooltip(e) {
		e.currentTarget.setAttribute('class', 'copy-code-to-clipboard-button');
		e.currentTarget.removeAttribute('aria-label');
	}

	function showTooltip(elem, msg) {
		elem.setAttribute('class', 'copy-code-to-clipboard-button tooltipped tooltipped-s');
		elem.setAttribute('aria-label', msg);
	}

	function fallbackMessage(action) {
		var actionMsg = '';
		var actionKey = (action === 'cut' ? 'X' : 'C');
		if (/iPhone|iPad/i.test(navigator.userAgent)) {
			actionMsg = 'No support :(';
		} else if (/Mac/i.test(navigator.userAgent)) {
			actionMsg = 'Press ⌘-' + actionKey + ' to ' + action;
		} else {
			actionMsg = 'Press Ctrl-' + actionKey + ' to ' + action;
		}
		return actionMsg;
	}
})();