var util = (function () {
    'use strict';
    var that = {};

    that.getRandom = function (a, b) {
        return Math.random() * (b - a) + a;
    };

    return that;
})();
