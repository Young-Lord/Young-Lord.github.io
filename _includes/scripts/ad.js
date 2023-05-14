(function() {
    var ad_key = 'ad_enabled';
    if(localStorage.getItem(ad_key) === "1") {
        var js = document.createElement("script");
        js.setAttribute('async', true);
        js.setAttribute('src', 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4330590477801581');
        js.setAttribute('crossorigin', 'anonymous');
        document.head.appendChild(js);
    }
})();
