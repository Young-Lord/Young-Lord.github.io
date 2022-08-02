(function () {
    var SOURCES = window.TEXT_VARIABLES.sources;
    window.Lazyload.js(SOURCES.jquery, function () {
        document.write('<script src="//cdn.jsdelivr.net/gh/ghiculescu/jekyll-table-of-contents/toc.min.js"></script>');
        document.addEventListener("DOMContentLoaded", function () { $('#toc').toc(); });
    })
})();
