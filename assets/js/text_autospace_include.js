(function () {
    var SOURCES = window.TEXT_VARIABLES.sources;
    window.Lazyload.js(SOURCES.jquery, function () {
        var JSElement=document.createElement("script");
        JSElement.setAttribute("src","/assets/js/text-autospace.min.js");
        document.body.appendChild(JSElement)
    })
})();
