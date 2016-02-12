var Vector = (function () {
    'use strict';

    // constructor
    function Vector(x, y) {
        this.x = x;
        this.y = y;
    }

    // methods
    Vector.prototype = {
        add: function (vector) {
            this.x += vector.x;
            this.y += vector.y;
            return this;
        },
        toString: function () {
            return 'x: ' + this.x + ', ' + 'y: ' + this.y;
        },
        length: function () {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        },
        equal: function (vector) {
            return (vector.x === this.x) && (vector.y === this.y);
        }
    };

    // static methods
    Vector.plus = function (v1, v2) {
        var x = v1.x + v2.x;
        var y = v1.y + v2.y;
        return new Vector(x, y);
    };
    Vector.minus = function (v1, v2) {
        var dx = v1.x - v2.x;
        var dy = v1.y - v2.y;
        return new Vector(dx, dy);
    };
    Vector.multiply = function (vector, scalar) {
        var x = vector.x * scalar;
        var y = vector.y * scalar;
        return new Vector(x, y);
    };
    Vector.distance = function (v1, v2) {
        var v1mv2 = Vector.minus(v1, v2);
        return v1mv2.length();
    };
    Vector.fromObject = function (obj) {
        return new Vector(obj.x, obj.y);
    };
    Vector.randomVector = function (rangeX, rangeY) {
        var x1 = rangeX[0];
        var x2 = rangeX[1];
        var y1 = rangeY[0];
        var y2 = rangeY[1];

        var randomX = Math.random() * (x2 - x1) + x1;
        var randomY = Math.random() * (y2 - y1) + y1;
        return new Vector(randomX, randomY);
    };

    return Vector;
})();