import Simulation from './simulation';
import DrawHelper from './draw';
import Vec2 from './vector2D';
var p1;
var sim;
var dh;
var mouse;
var avg_dt = 0;
var iters_per_frame = 0;
window.addEventListener('load', function () {
    p1 = document.getElementById('p1');
    sim = new Simulation();
    dh = new DrawHelper('canvas');
    mouse = new MouseData(dh.canvas);
    add_button_listeners();
    step();
});
function add_button_listeners() {
    document.getElementById('button_play').addEventListener('click', function () { return iters_per_frame++; });
    document.getElementById('button_pause').addEventListener('click', function () { return iters_per_frame = 0; });
}
function step() {
    var t0 = performance.now();
    for (var i = 0; i < iters_per_frame; i++) {
        sim.update();
    }
    dh.draw_frame(sim);
    if (dh.brush.material !== 0) {
        dh.draw_brush(mouse.pos);
        if (mouse.is_left_down) {
            sim.apply_brush(mouse.pos, dh.brush.radius, dh.brush.material);
        }
        else if (mouse.is_right_down) {
            sim.apply_brush(mouse.pos, dh.brush.radius, 0);
        }
    }
    avg_dt = 0.95 * avg_dt + 0.05 * (performance.now() - t0);
    p1.innerHTML = avg_dt.toFixed(2) + 'ms';
    window.requestAnimationFrame(step);
}
var MouseData = (function () {
    function MouseData(element) {
        this.element = element;
        this.pos = Vec2.ZEROS;
        this.is_left_down = false;
        this.is_right_down = false;
        this.add_listeners();
    }
    MouseData.prototype.add_listeners = function () {
        var _this = this;
        this.element.addEventListener('mousedown', function (event) {
            _this.is_left_down || (_this.is_left_down = event.button === 0);
            _this.is_right_down || (_this.is_right_down = event.button === 2);
        });
        window.addEventListener('mousemove', function (event) {
            var rect = _this.element.getBoundingClientRect();
            _this.pos = new Vec2(event.clientX - rect.left, event.clientY - rect.top);
        });
        window.addEventListener('mouseup', function (event) {
            _this.is_left_down && (_this.is_left_down = !(event.button === 0));
            _this.is_right_down && (_this.is_right_down = !(event.button === 2));
        });
    };
    return MouseData;
}());
//# sourceMappingURL=index.js.map