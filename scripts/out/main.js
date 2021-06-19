import Vec2 from './vector2D.js';
var canvas;
var ctx;
var is_playing = false;
var stroke_width = 30;
var active_brush_wall = 2 /* none */;
var mouse_pos;
var ants;
var image_data;
var marker_A;
var marker_B;
var structures;
var p1;
var p2;
var avg_dt = 0;
var vision_disc;
var disc_size;
var disc_dx;
var disc_dy;
var disc_di;
window.addEventListener('load', function () {
    init_html_refs();
    init_arrays();
    add_mouse_listeners();
    add_button_listeners();
});
function init_html_refs() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    p1 = document.getElementById('p1');
    p2 = document.getElementById('p2');
    canvas.width = 500 /* MAP_SIZE */;
    canvas.height = 500 /* MAP_SIZE */;
}
function init_arrays() {
    // ants
    ants = [];
    for (var i = 0; i < 1000 /* COLONY_SIZE */; i++) {
        ants.push(new Ant(new Vec2(20, 20), Vec2.random()));
    }
    // markers
    marker_A = new Uint8ClampedArray(250000 /* MAP_AREA */);
    marker_B = new Uint8ClampedArray(250000 /* MAP_AREA */);
    // image data
    image_data = new ImageData(500 /* MAP_SIZE */, 500 /* MAP_SIZE */);
    for (var i = 3; i < 1000000 /* IMAGE_ARRAY_SIZE */; i += 4) {
        image_data.data[i] = 255;
    }
    // structures
    structures = new Uint8Array(250000 /* MAP_AREA */);
    // vision disc
    init_vision_disc();
}
function init_vision_disc() {
    vision_disc = [];
    var sections = 8;
    for (var x = -20 /* VIEW_DISTANCE */; x <= 20 /* VIEW_DISTANCE */; x++) {
        for (var y = -20 /* VIEW_DISTANCE */; y <= 20 /* VIEW_DISTANCE */; y++) {
            if (Math.pow(x, 2) + Math.pow(y, 2) <= Math.pow(20 /* VIEW_DISTANCE */, 2))
                vision_disc.push(new Vec2(x, y));
        }
    }
    vision_disc.sort(function (a, b) { return a.angle2pi() - b.angle2pi(); });
    disc_size = vision_disc.length;
    disc_dx = new Int8Array(vision_disc.length);
    disc_dy = new Int8Array(vision_disc.length);
    disc_di = new Uint32Array(vision_disc.length);
    ctx.fillStyle = '#ffffff';
    for (var i in vision_disc) {
        var dv = vision_disc[i];
        disc_dx[i] = dv.x;
        disc_dy[i] = dv.y;
        disc_di[i] = dv.x + dv.y * 500 /* MAP_SIZE */;
    }
}
function add_mouse_listeners() {
    canvas.oncontextmenu = function (event) { return event.preventDefault(); };
    canvas.addEventListener('mousedown', function (event) {
        //mouse_pos = getMousePosition(event);
        switch (event.button) {
            case 0:
                active_brush_wall = 1 /* draw */;
                handle_brush_wall();
                break;
            case 2:
                active_brush_wall = 0 /* erase */;
                handle_brush_wall();
                break;
        }
        draw_frame();
    });
    window.addEventListener('mousemove', function (event) {
        mouse_pos = get_mouse_position(event);
        if (active_brush_wall === 1 /* draw */ || active_brush_wall === 0 /* erase */)
            handle_brush_wall();
        draw_frame();
    });
    window.addEventListener('mouseup', function (event) {
        active_brush_wall = 2 /* none */;
    });
    canvas.addEventListener('wheel', function (event) {
        event.preventDefault();
        stroke_width = event.deltaY > 0 ? Math.max(1, stroke_width - 1) : Math.min(100, stroke_width + 1);
        draw_frame();
    });
}
function add_button_listeners() {
    var play_button = document.getElementById('play_button');
    play_button.addEventListener('click', function () {
        is_playing = true;
        step();
    });
    var pause_button = document.getElementById('pause_button');
    pause_button.addEventListener('click', function () {
        is_playing = false;
    });
}
function step() {
    var t0 = performance.now();
    decay_markers();
    update_ants();
    draw_frame();
    var dt = (performance.now() - t0);
    avg_dt = 0.9 * avg_dt + 0.1 * dt;
    p1.innerHTML = avg_dt.toFixed(2) + 'ms';
    //p2.innerHTML = avg_time.toFixed(2) + 'ms avg';
    if (is_playing) {
        window.requestAnimationFrame(step);
    }
}
function draw_frame() {
    draw_map();
    draw_ants();
    draw_brush();
}
function draw_map() {
    for (var i = 0; i < 250000 /* MAP_AREA */; i++) {
        var j = 4 * i;
        if (structures[i] & 1) {
            image_data.data[j] = 100;
            image_data.data[j + 1] = 100;
            image_data.data[j + 2] = 100;
        }
        else {
            image_data.data[j] = marker_A[i];
            image_data.data[j + 1] = 0;
            image_data.data[j + 2] = marker_B[i];
        }
    }
    ctx.putImageData(image_data, 0, 0);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 50, 50);
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(500 /* MAP_SIZE */ - 50, 500 /* MAP_SIZE */ - 50, 50, 50);
}
function decay_markers() {
    for (var i = 0; i < 250000 /* MAP_AREA */; i++) {
        if ((marker_A[i] !== 0 || marker_B[i] !== 0) && Math.random() < 0.005) {
            marker_A[i] = 0;
            marker_B[i] = 0;
        }
    }
}
function update_ants() {
    for (var i = 0; i < 1000 /* COLONY_SIZE */; i++) {
        ants[i].update();
    }
}
function draw_ants() {
    ctx.fillStyle = '#ffffff';
    for (var i = 0; i < 1000 /* COLONY_SIZE */; i++) {
        ctx.fillRect(ants[i].pos.x - 1, ants[i].pos.y - 1, 2, 2);
        //ants[i].new_look();
    }
}
function handle_brush_wall() {
    loop_clamped_circle(mouse_pos, stroke_width, function (x, y) {
        var index = x + y * 500 /* MAP_SIZE */;
        structures[index] = active_brush_wall;
        marker_A[index] = 0;
        marker_B[index] = 0;
    });
}
function draw_brush() {
    ctx.strokeStyle = '#999999';
    ctx.beginPath();
    ctx.arc(mouse_pos.x, mouse_pos.y, stroke_width, 0, 2 * Math.PI);
    ctx.stroke();
}
var Ant = /** @class */ (function () {
    function Ant(pos, aim) {
        this.has_food = false;
        this.potency = 0;
        this.pos = pos;
        this.aim = aim;
    }
    Ant.prototype.update = function () {
        //this.update_aim();
        this.update_aim();
        this.move();
        this.drop_marker();
        this.decay_potency();
    };
    Ant.prototype.update_aim = function () {
        var adjust = this.find_max_in_square();
        if (this.aim.dot(adjust) > 0) {
            this.aim = this.aim.plus(adjust.normalized().plus(Vec2.random()).scale(0.1)).clamp_unit();
        }
        else {
            this.aim = this.aim.plus(Vec2.random(0.1)).clamp_unit();
        }
    };
    Ant.prototype.find_max_in_square = function () {
        var marker = this.has_food ? marker_A : marker_B;
        var x0 = trunc(this.pos.x);
        var y0 = trunc(this.pos.y);
        var max_value = 0;
        var max_x = x0;
        var max_y = y0;
        for (var y = Math.max(0, y0 - 20 /* VIEW_DISTANCE */); y < Math.min(500 /* MAP_SIZE */, y0 + 20 /* VIEW_DISTANCE */); y++) {
            for (var x = Math.max(0, x0 - 20 /* VIEW_DISTANCE */); x < Math.min(500 /* MAP_SIZE */, x0 + 20 /* VIEW_DISTANCE */); x++) {
                var value = marker[x + y * 500 /* MAP_SIZE */];
                if (value > max_value) {
                    max_value = value;
                    max_x = x;
                    max_y = y;
                }
            }
        }
        if (max_value === 0)
            return Vec2.ZERO;
        return new Vec2(max_x - x0, max_y - y0);
        // if (max_value === 0) {
        //     this.aim = this.aim.plus(Vec2.random(0.1)).clamp_unit();
        //     return;
        // }
        // const adjust = new Vec2(max_x - x0, max_y - y0);
        // if (this.aim.dot(adjust) <= 0) {
        //     this.aim = this.aim.plus(Vec2.random(0.1)).clamp_unit();
        //     return;
        // }
        // this.aim = this.aim.plus(adjust.normalized()).clamp_unit();
    };
    Ant.prototype.find_max_in_circle = function () {
        var marker = this.has_food ? marker_A : marker_B;
        var x0 = trunc(this.pos.x);
        var y0 = trunc(this.pos.y);
        var max_value = 0;
        var max_x = x0;
        var max_y = y0;
        for (var i = 0; i < disc_size; i++) {
            var x = x0 + disc_dx[i];
            var y = y0 + disc_dy[i];
            if (0 <= x && x < 500 /* MAP_SIZE */) {
                var value = marker[x + y * 500 /* MAP_SIZE */];
                if ((value > max_value)) {
                    max_value = value;
                    max_x = x;
                    max_y = y;
                }
            }
        }
        //return new Vec2(max_x - x0, max_y - y0);
        if (max_value === 0) {
            this.aim = this.aim.plus(Vec2.random(0.1)).clamp_unit();
            return;
        }
        var adjust = new Vec2(max_x - x0, max_y - y0);
        if (this.aim.dot(adjust) <= 0) {
            this.aim = this.aim.plus(Vec2.random(0.1)).clamp_unit();
            return;
        }
        this.aim = this.aim.plus((new Vec2(max_x - x0, max_y - y0)).normalized()).clamp_unit();
    };
    Ant.prototype.move = function () {
        var new_pos = this.pos.plus(this.aim);
        if (new_pos.x < 50 && new_pos.y < 50) {
            this.has_food = false;
            this.potency = 255 /* MAX_POTENCY */;
            //this.aim = this.aim.scale(-0.5);
        }
        else if (500 /* MAP_SIZE */ - 50 < new_pos.x && 500 /* MAP_SIZE */ - 50 < new_pos.y) {
            this.has_food = true;
            this.potency = 255 /* MAX_POTENCY */;
            this.aim = this.aim.scale(-0.1);
            new_pos = new_pos.minus(new Vec2(1, 1));
        }
        // hit left/right edges
        if (new_pos.x < 0 || 500 /* MAP_SIZE */ < new_pos.x) {
            this.aim = new Vec2(0, this.aim.y);
            return;
        }
        // hit top/bottom edges
        if (new_pos.y < 0 || 500 /* MAP_SIZE */ < new_pos.y) {
            this.aim = new Vec2(this.aim.x, 0);
            return;
        }
        // hit wall
        var new_pos_int = new_pos.trunc();
        if (structures[new_pos_int.x + new_pos_int.y * 500 /* MAP_SIZE */] & 1) {
            this.aim = Vec2.ZERO;
            //this.pos = new Vec2(20, 20);
            marker_A[index_of(this.pos)] = 0;
            marker_B[index_of(this.pos)] = 0;
            return;
        }
        this.pos = new_pos.apply(function (x) { return clamp(x, 0, 500 /* MAP_SIZE */); });
    };
    Ant.prototype.drop_marker = function () {
        var marker = this.has_food ? marker_B : marker_A;
        var index = index_of(this.pos);
        //marker[index] = Math.max(marker[index], this.potency ? Params.MAX_MARKER : 0);
        marker[index] = Math.max(marker[index], trunc(this.potency));
    };
    Ant.prototype.decay_potency = function () {
        if (this.potency === 0) {
            this.has_food = true;
            return;
        }
        this.potency = Math.max(0, this.potency - 0.125 /* POTENCY_DECAY */);
    };
    return Ant;
}());
// utils ----------------------
function index_of(pos) {
    return trunc(pos.x) + trunc(pos.y) * 500 /* MAP_SIZE */;
}
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}
function rand(scale) {
    if (scale === void 0) { scale = 1; }
    return scale * 2 * (Math.random() - 0.5);
}
function trunc(val) {
    return val | 0;
}
function get_mouse_position(event) {
    var rect = canvas.getBoundingClientRect();
    return new Vec2(event.clientX - rect.left, event.clientY - rect.top);
}
function loop_rectangle(pos_bot, pos_top, func) {
    for (var y = pos_bot.y; y < pos_top.y; y++) {
        for (var x = pos_bot.x; x < pos_top.x; x++) {
            func(x, y);
        }
    }
}
function loopSquareClamped(pos, inradius, func) {
    loop_rectangle(new Vec2(Math.max(pos.x - inradius, 0), Math.max(pos.y - inradius, 0)), new Vec2(Math.min(pos.x + inradius, 500 /* MAP_SIZE */), Math.min(pos.y + inradius, 500 /* MAP_SIZE */)), func);
}
function loop_clamped_circle(pos, radius, func) {
    var sqr_radius = Math.pow(radius, 2);
    for (var y = Math.max(0, trunc(pos.y) - radius); y < Math.min(500 /* MAP_SIZE */, trunc(pos.y) + radius); y++) {
        for (var x = Math.max(0, trunc(pos.x) - radius); x < Math.min(500 /* MAP_SIZE */, trunc(pos.x) + radius); x++) {
            if (Math.pow((pos.x - x), 2) + Math.pow((pos.y - y), 2) < sqr_radius) {
                func(x, y);
            }
        }
    }
}
//# sourceMappingURL=main.js.map