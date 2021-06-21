import Vec2 from './vector2D.js';
// html elements
var canvas;
var ctx;
var p1;
var p2;
var avg_dt = 0;
// arrays
var ants;
var image_data;
var marker_A;
var marker_B;
var structures;
var vision_disc;
var disc_size;
var disc_dx;
var disc_dy;
var disc_di;
// input
var stroke_width = 30;
var brush_material = 0 /* none */;
var mouse_pos = Vec2.ZERO;
var is_left_mouse_down = false;
var is_right_mouse_down = false;
// uhhh stuff?
var iters_per_frame = 0;
window.addEventListener('load', function () {
    init_html_refs();
    init_arrays();
    add_mouse_listeners();
    add_button_listeners();
    add_key_listeners();
    step();
});
function init_html_refs() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    p1 = document.getElementById('p1');
    p2 = document.getElementById('p2');
    canvas.width = 500 /* MAP_WIDTH */;
    canvas.height = 375 /* MAP_HEIGHT */;
}
function init_arrays() {
    // ants
    ants = [];
    for (var i = 0; i < 1000 /* COLONY_SIZE */; i++) {
        ants.push(new Ant(new Vec2(25, 25), Vec2.random()));
    }
    // markers
    marker_A = new Uint8ClampedArray(187500 /* MAP_AREA */);
    marker_B = new Uint8ClampedArray(187500 /* MAP_AREA */);
    // image data
    image_data = new ImageData(500 /* MAP_WIDTH */, 375 /* MAP_HEIGHT */);
    for (var i = 3; i < 750000 /* IMAGE_ARRAY_SIZE */; i += 4) {
        image_data.data[i] = 255;
    }
    // structures
    structures = new Uint8Array(187500 /* MAP_AREA */);
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
    vision_disc.sort(function (a, b) { return a.angle2pi - b.angle2pi; });
    disc_size = vision_disc.length;
    disc_dx = new Int8Array(vision_disc.length);
    disc_dy = new Int8Array(vision_disc.length);
    disc_di = new Uint32Array(vision_disc.length);
    ctx.fillStyle = '#ffffff';
    for (var i in vision_disc) {
        var dv = vision_disc[i];
        disc_dx[i] = dv.x;
        disc_dy[i] = dv.y;
        disc_di[i] = dv.x + dv.y * 500 /* MAP_WIDTH */;
    }
}
function add_mouse_listeners() {
    canvas.oncontextmenu = function (event) { return event.preventDefault(); };
    canvas.addEventListener('mousedown', function (event) {
        is_left_mouse_down || (is_left_mouse_down = event.button === 0);
        is_right_mouse_down || (is_right_mouse_down = event.button === 2);
    });
    window.addEventListener('mousemove', function (event) { return mouse_pos = get_mouse_position(event); });
    window.addEventListener('mouseup', function (event) {
        is_left_mouse_down && (is_left_mouse_down = !(event.button === 0));
        is_right_mouse_down && (is_right_mouse_down = !(event.button === 2));
    });
    canvas.addEventListener('wheel', function (event) {
        event.preventDefault();
        stroke_width = (event.deltaY > 0 ? Math.max(1, stroke_width - 1) : Math.min(100, stroke_width + 1));
    });
}
function add_button_listeners() {
    document.getElementById('button_play').addEventListener('click', function () { return iters_per_frame++; });
    document.getElementById('button_pause').addEventListener('click', function () { return iters_per_frame = 0; });
    document.getElementById('button_none').addEventListener('click', function () { return brush_material = 0 /* none */; });
    document.getElementById('button_wall').addEventListener('click', function () { return brush_material = 1 /* wall */; });
    document.getElementById('button_food').addEventListener('click', function () { return brush_material = 2 /* food */; });
}
function add_key_listeners() {
    window.addEventListener('keydown', function (event) {
        switch (event.key) {
            case '0':
                brush_material = 0 /* none */;
                break;
            case '1':
                brush_material = 1 /* wall */;
                break;
            case '2':
                brush_material = 2 /* food */;
                break;
        }
    });
}
function step() {
    var t0 = performance.now();
    handle_brush();
    for (var _ = 0; _ < iters_per_frame; _++) {
        decay_markers();
        update_ants();
    }
    draw_frame();
    ctx.fillStyle = "#ffffff";
    ctx.fillText("brush: " + { 0: 'none', 1: 'wall', 2: 'food' }[brush_material], 10, 375 /* MAP_HEIGHT */ - 10);
    log_time(t0);
    window.requestAnimationFrame(step);
}
function log_time(t0) {
    var dt = (performance.now() - t0);
    avg_dt = 0.95 * avg_dt + 0.05 * dt;
    p1.innerHTML = avg_dt.toFixed(2) + 'ms';
}
function draw_frame() {
    draw_map();
    draw_ants();
    if (brush_material !== 0 /* none */)
        draw_brush();
}
function draw_map() {
    for (var i = 0; i < 187500 /* MAP_AREA */; i++) {
        var j = 4 * i;
        if (structures[i] === 1 /* wall */) {
            image_data.data[j] = 100;
            image_data.data[j + 1] = 100;
            image_data.data[j + 2] = 100;
        }
        else if (structures[i] === 2 /* food */) {
            image_data.data[j] = 0;
            image_data.data[j + 1] = 0;
            image_data.data[j + 2] = 255;
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
}
function decay_markers() {
    for (var i = 0; i < 187500 /* MAP_AREA */; i++) {
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
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    for (var i = 0; i < 1000 /* COLONY_SIZE */; i++) {
        var p = ants[i].pos;
        var dp = ants[i].aim.scale_to(1.5);
        ctx.moveTo(p.x - dp.x, p.y - dp.y);
        ctx.lineTo(p.x + dp.x, p.y + dp.y);
    }
    ctx.stroke();
}
function handle_brush() {
    if (is_left_mouse_down && brush_material !== 0 /* none */) {
        apply_brush(brush_material);
    }
    else if (is_right_mouse_down) {
        apply_brush(0);
    }
}
function apply_brush(value) {
    loop_clamped_circle(mouse_pos, stroke_width, function (x, y) {
        var index = x + y * 500 /* MAP_WIDTH */;
        structures[index] = value;
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
        this.wall_count = 0;
        this.pos = pos;
        this.aim = aim;
        this.desired_aim = aim;
    }
    Ant.prototype.update = function () {
        this.update_aim();
        this.move();
        this.drop_marker();
        this.decay_potency();
    };
    Ant.prototype.update_aim = function () {
        var max_desire = this.find_max_in_circle();
        if (max_desire.dot(this.aim) > 0)
            this.desired_aim = this.desired_aim.plus(max_desire.scale_to(0.1));
        this.desired_aim = this.desired_aim.nudge(0.1).normalized;
        var acceleration = this.desired_aim.minus(this.aim).scale(0.5);
        this.aim = this.aim.plus(acceleration).clamp_norm();
    };
    /* private find_max_in_square(): Vec2 {
        const marker = this.has_food ? marker_A : marker_B;

        const x0 = trunc(this.pos.x);
        const y0 = trunc(this.pos.y);

        let max_value = 0;
        let max_x = x0;
        let max_y = x0;

        for (let y = Math.max(0, y0 - Params.VIEW_DISTANCE);
                 y <  Math.min(Params.MAP_HEIGHT, y0 + Params.VIEW_DISTANCE);
                 y++) {
            for (let x = Math.max(0, x0 - Params.VIEW_DISTANCE);
                     x < Math.min(Params.MAP_WIDTH, x0 + Params.VIEW_DISTANCE);
                     x++) {
                const value = marker[x + y * Params.MAP_WIDTH];
                if (value > max_value) {
                    max_value = value;
                    max_x = x;
                    max_y = y;
                }
            }
        }

        //if (max_x === this.pos.x && max_y === this.pos.y) return Vec2.ZERO;

        //console.log(x0, y0);
        //console.log(max_x - x0, max_y - y0);

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
    } */
    Ant.prototype.find_max_in_circle = function () {
        var marker = this.has_food ? marker_A : marker_B;
        var x0 = (this.pos.x | 0);
        var y0 = (this.pos.y | 0);
        var max_value = 0;
        var max_x = x0;
        var max_y = y0;
        for (var i = 0; i < disc_size; i++) {
            var x = x0 + disc_dx[i];
            var y = y0 + disc_dy[i];
            if (0 <= x && x < 500 /* MAP_WIDTH */) {
                var value = marker[x + y * 500 /* MAP_WIDTH */];
                if ((value > max_value)) {
                    max_value = value;
                    max_x = x;
                    max_y = y;
                }
            }
        }
        return new Vec2(max_x - x0, max_y - y0);
    };
    Ant.prototype.move = function () {
        var new_pos = this.pos.plus(this.aim);
        if (new_pos.x < 50 && new_pos.y < 50) {
            this.has_food = false;
            this.potency = 255 /* MAX_POTENCY */;
        }
        // hit edges
        if (new_pos.x < 0 || 500 /* MAP_WIDTH */ < new_pos.x || new_pos.y < 0 || 375 /* MAP_HEIGHT */ < new_pos.y) {
            this.bounce();
            return;
        }
        // hit wall
        var new_pos_int = new_pos.trunc();
        if (structures[index_of(new_pos_int)] === 1 /* wall */) {
            this.bounce();
            return;
        }
        else if (structures[index_of(new_pos_int)] === 2 /* food */ && !this.has_food) {
            structures[index_of(new_pos_int)] = 0 /* none */;
            this.has_food = true;
            this.potency = 255 /* MAX_POTENCY */;
            this.desired_aim = this.aim.negative();
        }
        this.pos = new Vec2(clamp(new_pos.x, 0, 500 /* MAP_WIDTH */), clamp(new_pos.y, 0, 375 /* MAP_HEIGHT */));
        this.wall_count = 0;
    };
    Ant.prototype.bounce = function () {
        this.pos = this.pos.minus(this.aim);
        this.desired_aim = Vec2.ZERO;
        this.wall_count++;
        if (this.wall_count > 100) {
            this.pos = new Vec2(20, 20);
        }
    };
    Ant.prototype.drop_marker = function () {
        var marker = this.has_food ? marker_B : marker_A;
        var index = index_of(this.pos);
        marker[index] = Math.max(marker[index], trunc(this.potency));
    };
    Ant.prototype.decay_potency = function () {
        this.potency = Math.max(0, this.potency - 0.125 /* POTENCY_DECAY */);
    };
    return Ant;
}());
// utils ----------------------
function index_of(pos) {
    return trunc(pos.x) + trunc(pos.y) * 500 /* MAP_WIDTH */;
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
    loop_rectangle(new Vec2(Math.max(pos.x - inradius, 0), Math.max(pos.y - inradius, 0)), new Vec2(Math.min(pos.x + inradius, 500 /* MAP_WIDTH */), Math.min(pos.y + inradius, 375 /* MAP_HEIGHT */)), func);
}
function loop_clamped_circle(pos, radius, func) {
    var sqr_radius = Math.pow(radius, 2);
    for (var y = Math.max(0, trunc(pos.y) - radius); y < Math.min(375 /* MAP_HEIGHT */, trunc(pos.y) + radius); y++) {
        for (var x = Math.max(0, trunc(pos.x) - radius); x < Math.min(500 /* MAP_WIDTH */, trunc(pos.x) + radius); x++) {
            if (Math.pow((pos.x - x), 2) + Math.pow((pos.y - y), 2) < sqr_radius) {
                func(x, y);
            }
        }
    }
}
//# sourceMappingURL=main.js.map