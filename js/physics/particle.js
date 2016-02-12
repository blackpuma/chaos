var Particle = (function () {
    'use strict';
    
    // constructor
    function Particle (position, velocity, size, mass, color) {
        this.position = position;
        this.velocity = velocity;
        this.acceleration = {x: 0, y: 0};
        this.size = size || 5;
        this.mass = mass || 10;
        this.color = color || [255, 255, 255];
    }
    
    return Particle;
})();
