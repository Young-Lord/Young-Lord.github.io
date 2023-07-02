(function () {
    var SOURCES = window.TEXT_VARIABLES.sources;
    window.Lazyload.js(SOURCES.jquery, function () {
        var JSElement=document.createElement("script");
        JSElement.setAttribute("src","/assets/js/text-autospace.min.js");
        JSElement.setAttribute("type","text/javascript");
        JSElement.setAttribute("defer","defer");
        JSElement.setAttribute("async","async");
        document.body.appendChild(JSElement)
    })
})();
