(function () {
    var SOURCES = window.TEXT_VARIABLES.sources;
    window.Lazyload.js(SOURCES.jquery, function () {
        var JSElement=document.createElement("script");
        JSElement.setAttribute("src","//cdn.jsdelivr.net/gh/Young-Lord/Young-Lord.github.io/assets/js/text-autospace.min.js");
        document.body.appendChild(JSElement)
    })
})();
