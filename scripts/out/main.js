import Vec2 from './vector2D.js';
var canvas;
var ctx;
var is_playing = false;
var stroke_width = 40;
var active_brush_wall = 2 /* none */;
var mouse_pos;
var ants = [];
var image_data;
var marker_A;
var marker_B;
var structures;
var vec_array_A;
var avg_fps = 0;
var fps_counter;
window.addEventListener('load', function () {
    canvas = document.getElementById('canvas');
    canvas.width = 500 /* MAP_SIZE */;
    canvas.height = 500 /* MAP_SIZE */;
    ctx = canvas.getContext('2d');
    fps_counter = document.getElementById('fps');
    marker_A = new Uint8ClampedArray(250000 /* MAP_AREA */);
    marker_B = new Uint8ClampedArray(250000 /* MAP_AREA */);
    vec_array_A = {
        x: new Int8Array(250000 /* MAP_AREA */),
        y: new Int8Array(250000 /* MAP_AREA */)
    };
    image_data = new ImageData(500 /* MAP_SIZE */, 500 /* MAP_SIZE */);
    for (var i = 3; i < 1000000 /* IMAGE_ARRAY_SIZE */; i += 4) {
        image_data.data[i] = 255;
    }
    structures = new Uint8Array(250000 /* MAP_AREA */);
    // initialize list of ant objects
    for (var i = 0; i < 500 /* COLONY_SIZE */; i++) {
        ants.push(new Ant(new Vec2(20, 20), Vec2.random()));
    }
    addMouseEvents();
    addButtonListeners();
});
function addMouseEvents() {
    canvas.oncontextmenu = function (event) { return event.preventDefault(); };
    canvas.addEventListener('mousedown', function (event) {
        //mouse_pos = getMousePosition(event);
        switch (event.button) {
            case 0:
                active_brush_wall = 1 /* draw */;
                break;
            case 2:
                active_brush_wall = 0 /* erase */;
                break;
        }
        draw_frame();
    });
    window.addEventListener('mousemove', function (event) {
        mouse_pos = getMousePosition(event);
        /*if (mouse_pos.x < 0 || Params.MAP_SIZE < mouse_pos.x
            || mouse_pos.y < 0
            || Params.MAP_SIZE < mouse_pos.y)
            active_brush_wall = Brush.none;
        */
        if (active_brush_wall === 1 /* draw */ || active_brush_wall === 0 /* erase */)
            handleBrushWall();
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
function addButtonListeners() {
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
    var dt = performance.now() - t0;
    var fps = 1000 / dt;
    avg_fps = 0.05 * fps + 0.95 * avg_fps;
    //console.log(dt.toFixed(2) + 'ms \@ ' + fps.toFixed(2) + 'fps - avg ' + avg_fps.toFixed(0)); // backticks for format strings
    fps_counter.innerHTML = avg_fps.toFixed(0) + 'fps';
    //console.log(avg_fps.toFixed(2));
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
            image_data.data[j + 1] = marker_B[i];
            image_data.data[j + 2] = 0;
        }
    }
    ctx.putImageData(image_data, 0, 0);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 50, 50);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(500 /* MAP_SIZE */ - 50, 500 /* MAP_SIZE */ - 50, 50, 50);
}
function decay_markers() {
    for (var i = 0; i < 250000 /* MAP_AREA */; i++) {
        if (Math.random() < 0.001) {
            marker_A[i] = 0;
            marker_B[i] = 0;
        }
        //marker_A[i] = Math.max(0, marker_A[i] - Params.MARKER_DECAY);
        //marker_B[i] = Math.max(0, marker_B[i] - Params.MARKER_DECAY);
    }
}
function update_ants() {
    for (var i = 0; i < 500 /* COLONY_SIZE */; i++) {
        ants[i].update();
    }
}
function draw_ants() {
    ctx.fillStyle = '#ffffff';
    for (var i = 0; i < 500 /* COLONY_SIZE */; i++) {
        ctx.fillRect(ants[i].pos.x - 1, ants[i].pos.y - 1, 2, 2);
    }
}
function handleBrushWall() {
    loopCircle(mouse_pos, stroke_width, function (x, y) {
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
        this.update_aim();
        this.move();
        this.placeMarker();
        this.decayPotency();
    };
    Ant.prototype.update_aim = function () {
        var adjust = this.to_max();
        if (this.aim.dot(adjust) > 0)
            this.aim = this.aim.plus(adjust.normalized().scale(0.1));
        this.aim = this.aim.plus(Vec2.random(0.1)).clamp_unit();
    };
    Ant.prototype.to_max = function () {
        //if (Math.random() < 0.1) return Vec2.zero;
        var marker = this.has_food ? marker_A : marker_B;
        var int_x = trunc(this.pos.x);
        var int_y = trunc(this.pos.y);
        var max_val = 0;
        var max_x = int_x;
        var max_y = int_y;
        for (var y = Math.max(0, int_y - 20 /* VIEW_DISTANCE */); y < Math.min(500 /* MAP_SIZE */, int_y + 20 /* VIEW_DISTANCE */); y++) {
            for (var x = Math.max(0, int_x - 20 /* VIEW_DISTANCE */); x < Math.min(500 /* MAP_SIZE */, int_x + 20 /* VIEW_DISTANCE */); x++) {
                var value = marker[x + y * 500 /* MAP_SIZE */];
                if (value > max_val) {
                    max_val = value;
                    max_x = x;
                    max_y = y;
                }
            }
        }
        return new Vec2(max_x - int_x, max_y - int_y);
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
            //this.aim = this.aim.scale(-0.5);
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
            this.aim = Vec2.zero;
            //this.pos = new Vec2(20, 20);
            return;
        }
        this.pos = new_pos.apply(function (x) { return clamp(x, 0, 500 /* MAP_SIZE */); });
    };
    Ant.prototype.placeMarker = function () {
        var marker = this.has_food ? marker_B : marker_A;
        var index = index_of(this.pos);
        //marker[index] = Math.max(marker[index], this.potency ? Params.MAX_MARKER : 0);
        marker[index] = Math.max(marker[index], trunc(this.potency));
    };
    Ant.prototype.decayPotency = function () {
        if (this.potency === 0) {
            this.has_food = true;
            return;
        }
        this.potency = Math.max(0, this.potency - 0.125 /* POTENCY_DECAY */);
    };
    return Ant;
}());
// utils ---------------------------
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
    return val << 0;
}
function getMousePosition(event) {
    var rect = canvas.getBoundingClientRect();
    return new Vec2(event.clientX - rect.left, event.clientY - rect.top);
}
function loopRect(pos_bot, pos_top, func) {
    for (var y = pos_bot.y; y < pos_top.y; y++) {
        for (var x = pos_bot.x; x < pos_top.x; x++) {
            func(x, y);
        }
    }
}
function loopSquareClamped(pos, inradius, func) {
    loopRect(new Vec2(Math.max(pos.x - inradius, 0), Math.max(pos.y - inradius, 0)), new Vec2(Math.min(pos.x + inradius, 500 /* MAP_SIZE */), Math.min(pos.y + inradius, 500 /* MAP_SIZE */)), func);
}
function loopCircle(pos, radius, func) {
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