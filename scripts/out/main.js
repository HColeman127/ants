import vec2 from "./vector2D.js";
var canvas;
var ctx;
var is_playing = false;
var left_down = false;
var right_down = false;
var stroke_width = 10;
var active_brush_wall = 2 /* none */;
var ants = [];
var image_data;
var marker_array_A;
var marker_array_B;
var structure_array;
window.addEventListener("load", function () {
    canvas = document.getElementById("canvas");
    canvas.width = 500 /* MAP_SIZE */;
    canvas.height = 500 /* MAP_SIZE */;
    ctx = canvas.getContext("2d");
    marker_array_A = new Uint8ClampedArray(250000 /* MAP_AREA */);
    marker_array_B = new Uint8ClampedArray(250000 /* MAP_AREA */);
    image_data = new ImageData(500 /* MAP_SIZE */, 500 /* MAP_SIZE */);
    for (var i = 0; i < 1000000 /* IMAGE_ARRAY_SIZE */; i++) {
        image_data.data[i] = 255;
    }
    structure_array = new Uint8Array(250000 /* MAP_AREA */);
    // initialize list of ant objects
    for (var i = 0; i < 1000 /* COLONY_SIZE */; i++) {
        ants.push(new Ant(new vec2(500 /* MAP_SIZE */ / 2, 500 /* MAP_SIZE */ / 2), vec2.random()));
    }
    addMouseEvents();
    addButtonListeners();
});
function addButtonListeners() {
    var play_button = document.getElementById("play_button");
    play_button.addEventListener("click", function () {
        is_playing = true;
        step();
    });
    var pause_button = document.getElementById("pause_button");
    pause_button.addEventListener("click", function () {
        is_playing = false;
    });
}
function step() {
    draw_markers();
    fade_markers();
    update_ants();
    if (is_playing) {
        window.requestAnimationFrame(step);
    }
}
function draw_markers() {
    for (var i = 0; i < 250000 /* MAP_AREA */; i++) {
        var j = 4 * i;
        if (structure_array[i] & 1) {
            image_data.data[j] = 100;
            image_data.data[j + 1] = 100;
            image_data.data[j + 2] = 100;
        }
        else {
            image_data.data[j] = 255 - marker_array_B[i];
            image_data.data[j + 1] = 255 - marker_array_A[i];
            image_data.data[j + 2] = 255 - marker_array_A[i] - marker_array_B[i];
        }
    }
    ctx.putImageData(image_data, 0, 0);
}
function fade_markers() {
    for (var i = 0; i < 250000 /* MAP_AREA */; i++) {
        if (Math.random() < 0.007) {
            marker_array_A[i] = 0;
            marker_array_B[i] = 0;
        }
    }
}
function update_ants() {
    ctx.fillStyle = "#000000";
    for (var i = 0; i < 1000 /* COLONY_SIZE */; i++) {
        ants[i].update();
    }
}
function addMouseEvents() {
    canvas.oncontextmenu = function (event) { return event.preventDefault(); };
    canvas.addEventListener("mousedown", function (event) {
        var pos = getMousePosition(event);
        switch (event.button) {
            case 0:
                active_brush_wall = 1 /* draw */;
                break;
            case 2:
                active_brush_wall = 0 /* erase */;
                break;
        }
        handleBrushWall(pos);
        drawBrush(pos);
    });
    canvas.addEventListener("mousemove", function (event) {
        var pos = getMousePosition(event);
        switch (active_brush_wall) {
            case 1 /* draw */:
            case 0 /* erase */:
                handleBrushWall(pos);
                break;
        }
        drawBrush(pos);
    });
    canvas.addEventListener("mouseup", function (event) {
        active_brush_wall = 2 /* none */;
    });
    canvas.addEventListener("wheel", function (event) {
        event.preventDefault();
        stroke_width = event.deltaY > 0 ? Math.max(1, stroke_width - 1) : Math.min(100, stroke_width + 1);
        drawBrush(getMousePosition(event));
    });
}
function handleBrushWall(pos) {
    loopCircle(pos, stroke_width, function (x, y) {
        structure_array[x + y * 500 /* MAP_SIZE */] = active_brush_wall;
    });
}
function drawBrush(pos) {
    draw_markers();
    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, stroke_width, 0, 2 * Math.PI);
    ctx.stroke();
}
var Ant = /** @class */ (function () {
    function Ant(pos, aim) {
        this.pos = pos;
        this.aim = aim;
        this.has_food = false;
    }
    Ant.prototype.update = function () {
        this.find_direction();
        this.move();
        this.updateScent();
        this.drawBody();
    };
    Ant.prototype.updateScent = function () {
        this.markScent();
        this.decayScent();
    };
    Ant.prototype.wander = function () {
        this.aim = this.aim.plus(vec2.random(0.2)).normalized();
    };
    Ant.prototype.find_direction = function () {
        var desire = this.scan_for_max();
        if (desire == null) {
            this.wander();
            return;
        }
        //this.aim = vec2.sum(vec2.normalized(vec2.sum(this.aim, vec2.scale(0.1, desire))), vec2.rand(0.1));    
        this.aim = this.aim.plus(desire.scale(0.1)).normalized().plus(vec2.random(0.1));
    };
    /*
    new_scan(): vec2 {
        const marker_array = this.has_food ? marker_array_A : marker_array_B;
        const int_x: number = Math.trunc(this.pos.x);
        const int_y: number = Math.trunc(this.pos.y);
        //const int_pos: vec2 = this.pos.trunc();

        let net_desire: vec2 = vec2.zero;

        for (let y = Math.max(int_y - AntTraits.VIEW_DISTANCE, 0);
                 y < Math.min(int_y + AntTraits.VIEW_DISTANCE, Params.MAP_SIZE);
                 y++) {
            for (let x = Math.max(int_x - AntTraits.VIEW_DISTANCE, 0);
                     x < Math.min(int_x + AntTraits.VIEW_DISTANCE, Params.MAP_SIZE);
                     x++) {
                const dir: vec2 = new vec2(x - int_x, y - int_y);
                if (this.aim.dot(dir) > 0) {
                    const value = marker_array[x + y * Params.MAP_SIZE] ** 2;
                    if (value != 0) {
                        net_desire = net_desire.plus(dir.scale(value));
                        //net_desire.x += value * dir.x;
                        //net_desire.y += value * dir.y;
                    }
                }
            }
        }

        if (net_desire.x == 0 && net_desire.y == 0) {
            return null;
        }

        return vec2.normalized(net_desire);
    }*/
    Ant.prototype.scan_for_max = function () {
        var marker_array = this.has_food ? marker_array_A : marker_array_B;
        var int_x = Math.floor(this.pos.x);
        var int_y = Math.floor(this.pos.y);
        var max_val = 0;
        var max_x = 0;
        var max_y = 0;
        loopSquareClamped(this.pos.trunc(), 20 /* VIEW_DISTANCE */, function (x, y) {
            var value = marker_array[x + y * 500 /* MAP_SIZE */];
            if (value != 0 && value > max_val) {
                max_val = value;
                max_x = x;
                max_y = y;
            }
        });
        /*
        for (let y = Math.max(int_y - AntTraits.VIEW_DISTANCE, 0);
                 y < Math.min(int_y + AntTraits.VIEW_DISTANCE, Params.MAP_SIZE) + 1;
                 y++) {
            for (let x = Math.max(int_x - AntTraits.VIEW_DISTANCE, 0);
                     x < Math.min(int_x + AntTraits.VIEW_DISTANCE, Params.MAP_SIZE) + 1;
                     x++) {
                const value = marker_array[x + y * Params.MAP_SIZE];
                if (value != 0 && value > max_val) {
                    max_val = value;
                    max_x = x;
                    max_y = y;
                }
            }
        }*/
        if (max_val == 0 || (max_x == int_x && max_y == int_y)) {
            return null;
        }
        return (new vec2(max_x - int_x, max_y - int_y)).normalized();
    };
    Ant.prototype.move = function () {
        var new_pos = this.pos.plus(this.aim);
        if (new_pos.x < 50 && new_pos.y < 50) {
            this.has_food = false;
            this.potency = 255;
        }
        else if (500 /* MAP_SIZE */ - 50 < new_pos.x && 500 /* MAP_SIZE */ - 50 < new_pos.y) {
            this.has_food = true;
            this.potency = 255;
        }
        if (new_pos.x < 0 || 500 /* MAP_SIZE */ < new_pos.x) {
            this.aim.x = -this.aim.x;
            new_pos = this.pos;
        }
        if (new_pos.y < 0 || 500 /* MAP_SIZE */ < new_pos.y) {
            this.aim.y = -this.aim.y;
            new_pos = this.pos;
        }
        var new_pos_int = { x: Math.floor(new_pos.x), y: Math.floor(new_pos.y) };
        if (structure_array[new_pos_int.x + new_pos_int.y * 500 /* MAP_SIZE */] & 1) {
            this.aim = this.aim.negative();
            new_pos = this.pos;
        }
        this.pos = new_pos.apply(function (x) { return clamp(x, 0, 500 /* MAP_SIZE */); });
    };
    /*
    setAngle(angle: number) {
        this.angle = angle;
        this.move_vec = {
            x: AntTraits.SPEED * Math.cos(this.angle),
            y: AntTraits.SPEED * Math.sin(this.angle)
        }
    }*/
    Ant.prototype.markScent = function () {
        (this.has_food ? marker_array_B : marker_array_A)[index_from_position(this.pos)] = Math.floor(this.potency);
    };
    Ant.prototype.decayScent = function () {
        this.potency -= 0.1 /* POTENCY_DECAY */;
    };
    Ant.prototype.drawBody = function () {
        //ctx.fillStyle = this.has_food ? "#0000ff" : "#000000";
        ctx.fillRect(this.pos.x - 1, this.pos.y - 1, 2, 2);
    };
    return Ant;
}());
// utils ---------------------------
function index_from_position(pos) {
    return Math.floor(pos.x) + Math.floor(pos.y) * 500 /* MAP_SIZE */;
}
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}
function rand(scale) {
    if (scale === void 0) { scale = 1; }
    return scale * 2 * (Math.random() - 0.5);
}
function getMousePosition(event) {
    var rect = canvas.getBoundingClientRect();
    return new vec2(event.clientX - rect.left, event.clientY - rect.top);
}
function loopRect(pos_bot, pos_top, func) {
    for (var y = pos_bot.y; y < pos_top.y; y++) {
        for (var x = pos_bot.x; x < pos_top.x; x++) {
            func(x, y);
        }
    }
}
function loopSquareClamped(pos, inradius, func) {
    loopRect(new vec2(Math.max(pos.x - inradius, 0), Math.max(pos.y - inradius, 0)), new vec2(Math.min(pos.x + inradius, 500 /* MAP_SIZE */), Math.min(pos.y + inradius, 500 /* MAP_SIZE */)), func);
}
function loopCircle(pos, radius, func) {
    loopSquareClamped(pos, radius, function (x, y) {
        if (pos.dist_to(new vec2(x, y)) < radius) {
            func(x, y);
        }
    });
}
//# sourceMappingURL=main.js.map