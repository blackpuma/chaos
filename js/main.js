$(document).ready(function () {
    'use strict';
    
    var canvas, 
        ctx, 
        w, h, 
        stats, 
        gui, 
        config = { 
        // -- настройки частиц
        particles: [], // массив частиц
        amount: 100, // количество частиц в системе
        particleSize: 4, // радиус частиц
        particleMass: 10, // масса частиц
        particleMaxSpeed: 30, // максимальная скорость в системе (проверяется на границе системы)
        particleLineWidth: 1, // ширина линии между частицами при фиксированной ширине линии
        particleLineLength: 100, // минимальное расстояние для связывания частиц
        particleMaxInitSpeed: 8, // максимальная начальная скорость при генерации частиц
        particleInteraction: false, // взаимодействие частиц (true - взаимодействуют)
        particleDispIntRadius: false,
        particleLineWidthFixed: true, // фиксирована ли ширина линий
        particleInteractionDistance: 100,
        lineAlpha: function (dist, maxDist) { // функция расстояния. отвечает за прозрачность линии между частицами
            return -Math.pow(dist / maxDist, config.alphaParam) + 1;
        },
        lineWidth: function (size, dist) {
            var lineLength = config.particleLineLength;
            return - ( 2 * size - 1 ) * dist / lineLength + 2 * size;
        },
        // -- настройки мышки
        mouse: {
            position: new Vector(9999, 9999),
            mass: 10,
            size: 10,
            color: [255, 0, 179]
        }, // объект мышки
        mouseLineLength: 100,
        mouseInteraction: false,
        mouseInteractionDistance: 100, // минимальное расстояние, на котором действуют силы курсора
        // -- настройки "взбалтывания" системы
        explodeAmplitude: 50, // амплитуда изменения скорости при boom
        boom: function () { // случайно меняем скорости частиц
            var range = config.explodeAmplitude;
            config.particles.forEach(function (p) {
                p.velocity.add(Vector.randomVector([-range, range], [-range, range]));
            });
        },
        // -- настройки симуляции 
        dt: 0.05, // интервал времени интегрирования
        time: 0, // время симуляции
        tick: 0, // какой шаг симуляции
        sign: -1, // -1 - притяжение, 1 - отталкивание
        loop: true, // отвечает за то, находимся ли мы в цикле или нет
        animate: true, // флаг анимации (старт/стоп)
        startStop: function () {
            config.animate = !config.animate;
        },
        randomColor: false, // случайно задаем цвета частиц
        colorTheme: 'default',
        // другие настройки
        param: 60, // регуляризация силы притяжения
        alphaParam: 1.5, // параметр alpha
        gravConstant: 300 // гравитационная постоянная
        };
    
    canvas = document.getElementById('canvas_element');
    
    if (canvas.getContext && canvas.getContext('2d')) {
        init();
        initParticles(config.amount);
        loop();
    } else {
        alert("Sorry! Your browser doesn't support Canvas.");
    }
    
    function init() {

        window.requestAnimFrame = (function () {
            return window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function ( /* function */ callback, /* DOMElement */ element) {
                    window.setTimeout(callback, 1000 / 60);
                };
        })();

        // canvas
        ctx = canvas.getContext('2d');
        w = canvas.width = window.innerWidth; // ширина canvas
        h = canvas.height = window.innerHeight; // высота canvas

        // stats
        stats = new Stats();
        stats.setMode(0); // fps

        stats.domElement.style.position = 'absolute'; // верхний верхний угол
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';

        document.body.appendChild(stats.domElement); // добавляем в тело страницы

        // gui
        gui = new dat.GUI(); // определяем панель настроек

        // add gui
        var amountController = gui.add(config, 'amount', 1, 300).step(1).name('Amount');
        amountController.onChange(function (a) {
            // нужно сразу останавливтаь анимацию, так как изменяется максимальное количество частиц
            config.animate = false;
        });
        amountController.onFinishChange(function (a) {
            config.animate = false; // на верочку
            var diff = a - config.particles.length; // смотрим за разницей

            while (config.loop === false) { // ждем окончания loop
                if (diff > 0) { // генерируем еще частиц
                    for (var i = 0; i < diff; i++) {
                        var particle = makeParticle();
                        config.particles.push(particle);
                    }
                } else if (diff < 0) { // удаляем лишние
                    config.particles = config.particles.slice(0, a);
                }
                // нам надо выйти из цикла
                config.loop = true;
            }
            /* 
                     вернем прежнее значение (мы начали работу как только 
                     закончился цикл при условии остановки анимации)
            */
            config.loop = false;
            // и стартанем (animation = true)
            config.animate = true;
        });

        var sizeController = gui.add(config, 'particleSize', 1, 30).name('Size');
        sizeController.onChange(function (size) {
            config.particles.forEach(function (p) {
                p.size = size;
            });
        });

        var massController = gui.add(config, 'particleMass', 1, 200).name('Mass');
        massController.onChange(function (mass) {
            config.particles.forEach(function (p) {
                p.mass = mass;
            });
        });

        gui.add(config, 'dt', 0.003, 0.5).name('Speed');
        gui.add(config, 'particleMaxSpeed', 5, 50).name('Max speed');

        var lineFolder = gui.addFolder('Line');
        lineFolder.add(config, 'particleLineWidthFixed').name('Width fixed');
        lineFolder.add(config, 'particleLineWidth', 1, 5).listen().name('Line width');
        lineFolder.add(config, 'particleLineLength', 10, 300).name('Line length');
        //lineFolder.add(config, 'alphaParam', 1, 5).name('alphaParam');

        var interactionFolder = gui.addFolder('Interaction');
        interactionFolder.add(config, 'particleInteraction').name('Interaction');
        interactionFolder.add(config, 'particleInteractionDistance', 10, 300).name('Int. distance');
        interactionFolder.add(config, 'particleDispIntRadius').name('Int. radius');
        interactionFolder.add(config, 'sign', {
            'притяжение': -1,
            'отталкивание': 1
        }).name('Type');
        //interactionFolder.add(config, 'gravConstant', 1, 300).name('G');
        //interactionFolder.add(config, 'param', 1, 500).name('param');

        var mouseFolder = gui.addFolder('Mouse');
        mouseFolder.add(config, 'mouseInteraction').name('Mouse');
        mouseFolder.add(config.mouse, 'mass', 1, 1000).name('Mouse mass');
        mouseFolder.add(config, 'mouseInteractionDistance', 10, 1000).name('Int. distance');
        mouseFolder.add(config, 'mouseLineLength', 10, 500).name('Line length');
        mouseFolder.add(config, 'particleLineWidth', 1, 5).listen().name('Line Width');
        mouseFolder.addColor(config.mouse, 'color').name('Color');

        var explodeFolder = gui.addFolder('Explode');
        explodeFolder.add(config, 'explodeAmplitude').name('Amplitude');
        explodeFolder.add(config, 'boom').name('Boom');

        //var colorController = gui.add(config, 'randomColor').name('Random color');    
        var colorController = gui.add(config, 'colorTheme', {
            'deafult': 'default',
            //'rainbow': 'rainbow',
            //'temperature': 'temperature',
            'random': 'random'
        }).name('Color theme');
        colorController.onFinishChange(function (evt) {
            config.particles.forEach(function (p) {
                switch (evt) {
                case 'default':
                    {
                        p.color = [255, 255, 255];
                        break;
                    }
                case 'random':
                    {
                        var r = Math.round(util.getRandom(10, 255));
                        var g = Math.round(util.getRandom(10, 255));
                        var b = Math.round(util.getRandom(10, 255));
                        p.color = [r, g, b];
                        break;
                    }
                }
            });
        });
        gui.add(config, 'startStop').name('Start/Stop');
    }
        

    function initParticles(amount) { // Генерируем набор частиц
        for (var i = 0; i < amount; i++) {
            var particle = makeParticle();
            config.particles.push(particle);
        }
    }

    // loop
    function clear() { // очищаем canvas
        ctx.clearRect(0, 0, w, h);
    }

    function update() { // один шаг симуляции
        config.time += config.dt; // следим за временем
        config.tick += 1; // и номером итерации

        for (var i = 0; i < config.amount; i++) {
            var p1 = config.particles[i];

            // граничные условия
            boundary(p1, w, h);

            // хочу соединить частицы в окресности
            for (var j = i + 1; j < config.amount; j++) {
                var p2 = config.particles[j];
                var dist = Vector.distance(p1.position, p2.position);

                if (dist < config.particleLineLength) { // рисуем линию между частицами
                    drawLineBetweenParticles(p1, p2, dist, config.particleLineLength);
                }

                // взаимодействие частиц
                if ((config.particleInteraction) && (dist < config.particleInteractionDistance)) {
                    interactionBetweenParticles(p1, p2, dist);
                }

            }
            // хочу соединить с мышкой
            if (config.mouseInteraction) {
                var distToMouse = Vector.distance(p1.position, config.mouse.position);
                if (distToMouse < config.mouseLineLength) {
                    drawLineBetweenParticles(p1, config.mouse, distToMouse, config.mouseLineLength);
                }
                if (distToMouse < config.mouseInteractionDistance) {
                    interactionBetweenMouse(p1, config.mouse, distToMouse);
                }
            }
            
            // меняем позицию частиц  
            p1.position.x += config.dt * p1.velocity.x;
            p1.position.y += config.dt * p1.velocity.y;
        }
    }
    
    function draw() { // отрисовываем частицы
        config.particles.forEach(function (p) {
            ctx.fillStyle = getRGB(p.color);
            ctx.beginPath();
            ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2, false);
            ctx.fill();
        });
    }

    function loop() { // основной цикл
        if (config.animate) {
            config.loop = true;
            stats.begin();
            clear();
            update();
            draw();
            stats.end();
            config.loop = false;
        }
        window.requestAnimationFrame(loop);
    }
    
    // helpers
    function makeParticle() {
        var rangeV = config.particleMaxInitSpeed;

        var position = new Vector(Math.random() * w, Math.random() * h);
        var velocity = Vector.randomVector([-rangeV, rangeV], [-rangeV, rangeV]);
        var size = config.particleSize;
        var mass = config.particleMass;

        var particle = new Particle(position, velocity, size, mass);

        var colorMap = config.colorTheme;
        if (colorMap === 'random') {
            var r = Math.round(util.getRandom(10, 255));
            var g = Math.round(util.getRandom(10, 255));
            var b = Math.round(util.getRandom(10, 255));
            particle.color = [r, g, b];
        } else {
            particle.color = [255, 255, 255];
        }

        return particle;
    }
    
    function boundary(p, w, h) {
    var rangeV = config.particleMaxInitSpeed;
    
    if (p.position.x > w) {
        if (p.velocity.length() > config.particleMaxSpeed) {
            p.velocity = Vector.randomVector([-rangeV, rangeV], [-rangeV, rangeV]);
        }
        p.position.x = p.position.x - w;
    } else if (p.position.x < 0) {
        if (p.velocity.length() > config.particleMaxSpeed) {
            p.velocity = Vector.randomVector([-rangeV, rangeV], [-rangeV, rangeV]);
        }
        p.position.x = w + p.position.x;
    } else if (p.position.y > h) {
        if (p.velocity.length() > config.particleMaxSpeed) {
            p.velocity = Vector.randomVector([-rangeV, rangeV], [-rangeV, rangeV]);
        }
        p.position.y = p.position.y - h;
    } else if (p.position.y < 0) {
        if (p.velocity.length() > config.particleMaxSpeed) {
            p.velocity = Vector.randomVector([-rangeV, rangeV], [-rangeV, rangeV]);
        }
        p.position.y = h + p.position.y;
    }
}
    
    function drawLineBetweenParticles(p1, p2, dist, maxDist) {
            var alpha = config.lineAlpha(dist, maxDist); // считаем прозрачность
            var lineWidth = config.particleLineWidthFixed ? config.particleLineWidth : config.lineWidth(config.particleSize, dist); // считаем ширину
            drawGradLine(p1, p2, alpha, lineWidth); // отрисовываем линию
        }
    
    function interactionBetweenParticles(p1, p2, dist) {
            var dx = p1.position.x - p2.position.x;
            var dy = p1.position.y - p2.position.y;

            var tmp = config.sign * config.gravConstant * p1.mass * p2.mass * config.dt / (Math.pow(dist, 3) + config.param);
            var addVx = tmp * dx;
            var addVy = tmp * dy;
        
            p1.velocity.x += addVx;
            p1.velocity.y += addVy;

            p2.velocity.x -= addVx;
            p2.velocity.y -= addVy;
        }

    function interactionBetweenMouse(particle, mouse, distToMouse) {
        var dx = particle.position.x - mouse.position.x;
        var dy = particle.position.y - mouse.position.y;

        var tmp = config.sign * config.gravConstant * particle.mass * mouse.mass * config.dt / (Math.pow(distToMouse, 3) + config.param);
        var addVx = tmp * dx;
        var addVy = tmp * dy;
        
        particle.velocity.x += addVx;
        particle.velocity.y += addVy;
    }
    
    function drawGradLine(p1, p2, alpha, lineWidth) {
        ctx.beginPath();
        var grad = ctx.createLinearGradient(p1.position.x, p1.position.y, p2.position.x, p1.position.y);
        var p1Color = getRGBA(p1.color, alpha);
        var p2Color = getRGBA(p2.color, alpha);
        grad.addColorStop(0, p1Color);
        grad.addColorStop(1, p2Color);
        ctx.strokeStyle = grad;
        ctx.moveTo(p2.position.x, p2.position.y);
        ctx.lineTo(p1.position.x, p1.position.y);
        ctx.lineWidth = lineWidth;
        ctx.stroke();
        ctx.closePath();
    }
    
    function getRGBA(color, a) {
        // иногда все падало из-за того, что цвет NaN. 
        var r = isNaN(Math.round(color[0])) ? 255 : Math.round(color[0]);
        var g = isNaN(Math.round(color[1])) ? 255 : Math.round(color[1]);
        var b = isNaN(Math.round(color[2])) ? 255 : Math.round(color[2]);
        return "rgba(" + r + "," + g + "," + b + "," + a + ")";
    }
    
    function getRGB(color) {
        var r = isNaN(Math.round(color[0])) ? 255 : Math.round(color[0]);
        var g = isNaN(Math.round(color[1])) ? 255 : Math.round(color[1]);
        var b = isNaN(Math.round(color[2])) ? 255 : Math.round(color[2]);
        return "rgb(" + r + "," + g + "," + b + ")";
    }
    
    function rainbowColorMap(v) {
        var h = v * 240 / 255;
        return [h, 1, 0.5];
    }   
    
    function hslToRgb(h, s, l) {
        var r, g, b;

        if (s == 0) {
            r = g = b = l; // achromatic
        } else {
            var hue2rgb = function hue2rgb(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            }

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    // events
    canvas.addEventListener('mousemove', function (evt) {
        config.mouse.position.x = evt.x;
        config.mouse.position.y = evt.y;
    });
    canvas.addEventListener('mouseleave', function (evt) {
        config.mouse.position.x = 9999;
        config.mouse.position.y = 9999;
    });
});