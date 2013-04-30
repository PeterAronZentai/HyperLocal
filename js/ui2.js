function initUI() {
    var resizeTrigger;
    if (window.orientation === undefined) {
        window.onresize = function (event) {
            clearTimeout(resizeTrigger);
            //resizeTrigger = setTimeout(function () { resizeUI(); }, 100);
        }
    } else {
        window.onorientationchange = function (event) {
            clearTimeout(resizeTrigger);
            resizeTrigger = setTimeout(function () { resizeUI(); }, 100);
        }
    }
};

window.hideRightPanel = function hideRightPanel() {
    $(".right-panel").addClass("hidden");
}

window.showRightPanel = function showRightPanel() {
    $(".right-panel").removeClass("hidden");
}

window.toggleRightPanel = function toggleRightPanel() {
    var right = $(".right-column");
    right.toggleClass("hidden");
}

window.resizeUI2 = function resizeUI() {
    var mapHtml = document.getElementById("map"),
        left = $('.left-column'),
        large9 = $(".large-9")[0],
        windowWidth = window.innerWidth,
        windowHeight = window.innerHeight

    if (windowWidth < 480) {
        if (left.hasClass("open")) {
            mapHtml.style.height = (windowHeight - 250) + "px";
            large9.style.height = (windowHeight - 250) + "px";
        } else {
            mapHtml.style.height = windowHeight + "px";
            large9.style.height = windowHeight + "px";
        }
        mapHtml.style.width = windowWidth + "px";
        large9.style.width = windowWidth + "px";
        left[0].removeAttribute("style");
    }
    else if (windowWidth >= 480 && windowWidth <= 768) {
        if (left.hasClass("open")) {
            mapHtml.style.width = (windowWidth - $(".left-column").width()) + "px";
            large9.style.width = (windowWidth - $(".left-column").width() - 1) + "px";
            left[0].style.height = windowHeight + "px";
        } else {
            mapHtml.style.width = windowWidth + "px";
            large9.style.width = windowWidth + "px";
        }
        mapHtml.style.height = windowHeight + "px";
    }
    else {
        mapHtml.style.width = (windowWidth - left.width()) + "px";
        mapHtml.style.height = windowHeight + "px";
        left[0].style.height = windowHeight + "px";
        document.querySelectorAll(".row.collapse.relative")[0].style.height = (windowHeight - 67) + "px";
    }

    lmap.invalidateSize();
}

window.toggleMap = function toggleMap() {
    $(".left-column").toggleClass("open");
    $(".map").toggleClass("open");

    //resizeUI();
}

$(document).ready(function(){
    /*document.getElementById('swipe').style.maxWidth = window.innerWidth - 40 + "px";
    document.getElementById('row-full').style.width = window.innerWidth - 40 + "px";*/
    document.querySelector('.swipe-wrap').style.height = window.innerHeight - 120 + "px"

    // SWIPE with pure JS
    var elem = document.getElementById('swipe');
    window.swipe = Swipe(elem, {
        startSlide: 1,
        // auto: 3000,
        continuous: false,
        // disableScroll: true,
        // stopPropagation: true,
        // callback: function(index, element) {},
        // transitionEnd: function(index, element) {}
    });
});