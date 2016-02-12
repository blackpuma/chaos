// Vector
// .methods
// ..static methods

var v1 = new Vector(0, 1);
var v2 = new Vector(4, 1);

console.log('v1: ', v1);
console.log('v2: ', v2);
console.log('======TEST=====');

var messages = [];

messages.push(v1 ? 'ok' : 'constructor');
messages.push(v1.equal(v1) ? 'ok' : '.equal');
messages.push(v1.length() === 1 ? 'ok' : '.length');
messages.push(v1.toString() === 'x: 0, y: 1' ? 'ok' : '.toString');

messages.push(Vector.distance(v1, v2) === 4 ? 'ok' : '..distance');
messages.push(Vector.plus(v1, v2).equal(new Vector(4, 2)) ? 'ok' : '..plus');
messages.push(Vector.minus(v1, v2).equal(new Vector(-4, 0)) ? 'ok' : '..minus');
messages.push(Vector.multiply(v1, 2).equal(new Vector(0, 2)) ? 'ok' : '..multiply');

messages.push(Vector.fromObject({
    x: 0,
    y: 1
}).equal(v1) ? 'ok' : '..fromObject');

var count = 0;
messages.forEach(function (m) {
    if (m !== 'ok') {
        console.log(m + ' does not work');
        count += 1;
    }
});

if (count === 0) {
    console.log('good job');
}
