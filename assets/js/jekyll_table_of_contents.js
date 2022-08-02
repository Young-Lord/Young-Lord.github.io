(function () {
    var SOURCES = window.TEXT_VARIABLES.sources;
    window.Lazyload.js(SOURCES.jquery, function () {
        var JSElement=document.createElement("script");
        JSElement.setAttribute("src","//cdn.jsdelivr.net/gh/ghiculescu/jekyll-table-of-contents/toc.min.js");
        document.body.appendChild(JSElement)
        document.addEventListener("DOMContentLoaded", function () { $('#toc').toc(); });
    })
})();
