System.register("vector2D", [], function (exports_1, context_1) {
    "use strict";
    var Vec2;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            Vec2 = (function () {
                function Vec2(x, y) {
                    this.x = x;
                    this.y = y;
                }
                Object.defineProperty(Vec2.prototype, "norm", {
                    get: function () {
                        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(Vec2.prototype, "normalized", {
                    get: function () {
                        return this.scale(1 / this.norm);
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(Vec2.prototype, "angle", {
                    get: function () {
                        return Math.atan2(this.y, this.x);
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(Vec2.prototype, "angle2pi", {
                    get: function () {
                        var ang = this.angle;
                        return (ang >= 0 ? ang : 2 * Math.PI + ang);
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(Vec2.prototype, "is_zero", {
                    get: function () {
                        return (this.x === 0 && this.y === 0);
                    },
                    enumerable: false,
                    configurable: true
                });
                Vec2.prototype.copy = function () {
                    return new Vec2(this.x, this.y);
                };
                Vec2.prototype.apply = function (fn) {
                    return new Vec2(fn(this.x), fn(this.y));
                };
                Vec2.prototype.negative = function () {
                    return new Vec2(-this.x, -this.y);
                };
                Vec2.prototype.scale = function (scalar) {
                    return new Vec2(scalar * this.x, scalar * this.y);
                };
                Vec2.prototype.scale_to = function (scalar) {
                    return this.scale(scalar / this.norm);
                };
                Vec2.prototype.trunc = function () {
                    return new Vec2(this.x << 0, this.y << 0);
                };
                Vec2.prototype.sqr_norm = function () {
                    return Math.pow(this.x, 2) + Math.pow(this.y, 2);
                };
                Vec2.prototype.clamp_norm = function (max) {
                    if (max === void 0) { max = 1; }
                    var sqr_norm = Math.pow(this.x, 2) + Math.pow(this.y, 2);
                    return (sqr_norm <= Math.pow(max, 2)) ? this : this.scale(max / Math.sqrt(sqr_norm));
                };
                Vec2.prototype.orth = function () {
                    return new Vec2(-this.y, this.x);
                };
                Vec2.prototype.nudge = function (scalar) {
                    if (scalar === void 0) { scalar = 1; }
                    return this.plus(Vec2.random(scalar));
                };
                Vec2.prototype.equals = function (v) {
                    return (this.x === v.x && this.y === v.y);
                };
                Vec2.prototype.plus = function (v) {
                    return new Vec2(this.x + v.x, this.y + v.y);
                };
                Vec2.prototype.minus = function (v) {
                    return new Vec2(this.x - v.x, this.y - v.y);
                };
                Vec2.prototype.dot = function (v) {
                    return (this.x * v.x) + (this.y * v.y);
                };
                Vec2.prototype.cross = function (v) {
                    return (this.x * v.y) - (this.y * v.x);
                };
                Vec2.prototype.sqr_dist = function (v) {
                    return Math.pow((this.x - v.x), 2) + Math.pow((this.y - v.y), 2);
                };
                Vec2.prototype.dist = function (v) {
                    return Math.sqrt(Math.pow((this.x - v.x), 2) + Math.pow((this.y - v.y), 2));
                };
                Vec2.random = function (scalar) {
                    if (scalar === void 0) { scalar = 1; }
                    return new Vec2(scalar * (2 * Math.random() - 1), scalar * (2 * Math.random() - 1));
                };
                Vec2.polar = function (r, theta) {
                    return new Vec2(r * Math.cos(theta), r * Math.sin(theta));
                };
                Vec2.ZERO = new Vec2(0, 0);
                Vec2.ONE = new Vec2(1, 1);
                Vec2.Ex = new Vec2(1, 0);
                Vec2.Ey = new Vec2(0, 1);
                return Vec2;
            }());
            exports_1("default", Vec2);
        }
    };
});
System.register("params", [], function (exports_2, context_2) {
    "use strict";
    var __moduleName = context_2 && context_2.id;
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("utils", ["vector2D"], function (exports_3, context_3) {
    "use strict";
    var vector2D_1, Utils;
    var __moduleName = context_3 && context_3.id;
    return {
        setters: [
            function (vector2D_1_1) {
                vector2D_1 = vector2D_1_1;
            }
        ],
        execute: function () {
            Utils = (function () {
                function Utils() {
                }
                Utils.get_mouse_pos = function (event, element) {
                    var rect = element.getBoundingClientRect();
                    return new vector2D_1.default(event.clientX - rect.left, event.clientY - rect.top);
                };
                Utils.index_of = function (pos) {
                    return Utils.trunc(pos.x) + Utils.trunc(pos.y) * 500;
                };
                Utils.clamp = function (num, min, max) {
                    return Math.max(min, Math.min(max, num));
                };
                Utils.sign = function (num) {
                    if (num > 0)
                        return 1;
                    if (num < 0)
                        return -1;
                    return 0;
                };
                Utils.rand = function (scale) {
                    if (scale === void 0) { scale = 1; }
                    return scale * 2 * (Math.random() - 0.5);
                };
                Utils.trunc = function (num) {
                    return num | 0;
                };
                Utils.loop_clamped_circle = function (pos, radius, fn) {
                    var square_radius = Math.pow(radius, 2);
                    for (var y = Math.max(0, Utils.trunc(pos.y) - radius); y < Math.min(375, Utils.trunc(pos.y) + radius); y++) {
                        for (var x = Math.max(0, Utils.trunc(pos.x) - radius); x < Math.min(500, Utils.trunc(pos.x) + radius); x++) {
                            if (Math.pow((pos.x - x), 2) + Math.pow((pos.y - y), 2) < square_radius) {
                                fn(x, y);
                            }
                        }
                    }
                };
                return Utils;
            }());
            exports_3("default", Utils);
        }
    };
});
System.register("types", ["vector2D"], function (exports_4, context_4) {
    "use strict";
    var vector2D_2, MouseData;
    var __moduleName = context_4 && context_4.id;
    return {
        setters: [
            function (vector2D_2_1) {
                vector2D_2 = vector2D_2_1;
            }
        ],
        execute: function () {
            MouseData = (function () {
                function MouseData(element) {
                    this.element = element;
                    this.rect = element.getBoundingClientRect();
                    this.pos = vector2D_2.default.ZERO;
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
                        _this.pos = new vector2D_2.default(event.clientX - _this.rect.left, event.clientY - _this.rect.top);
                    });
                    window.addEventListener('mouseup', function (event) {
                        _this.is_left_down && (_this.is_left_down = !(event.button === 0));
                        _this.is_right_down && (_this.is_right_down = !(event.button === 2));
                    });
                };
                return MouseData;
            }());
            exports_4("MouseData", MouseData);
        }
    };
});
System.register("ant", ["vector2D", "utils"], function (exports_5, context_5) {
    "use strict";
    var vector2D_3, utils_1, Ant;
    var __moduleName = context_5 && context_5.id;
    return {
        setters: [
            function (vector2D_3_1) {
                vector2D_3 = vector2D_3_1;
            },
            function (utils_1_1) {
                utils_1 = utils_1_1;
            }
        ],
        execute: function () {
            Ant = (function () {
                function Ant(pos, aim) {
                    this.has_food = false;
                    this.potency = 0;
                    this.wall_count = 0;
                    this.pos = pos;
                    this.aim = aim;
                    this.desired_aim = aim;
                }
                Ant.compute_view = function () {
                    var pts = [];
                    for (var x = -20; x <= 20; x++) {
                        for (var y = -20; y <= 20; y++) {
                            if (Math.pow(x, 2) + Math.pow(y, 2) <= Math.pow(20, 2))
                                pts.push(new vector2D_3.default(x, y));
                        }
                    }
                    pts.sort(function (a, b) { return a.angle2pi - b.angle2pi; });
                    var size = pts.length;
                    var dx = new Int8Array(size);
                    var dy = new Int8Array(size);
                    var di = new Uint32Array(size);
                    for (var i = 0; i < size; i++) {
                        var dv = pts[i];
                        dx[i] = dv.x;
                        dy[i] = dv.y;
                        di[i] = dv.x + dv.y * 500;
                    }
                    return { pts: pts, size: size, dx: dx, dy: dy, di: di };
                };
                Ant.prototype.update = function (marker, structures) {
                    this.update_aim(marker);
                    this.move(structures);
                    this.drop_marker(marker);
                    this.decay_potency();
                };
                Ant.prototype.update_aim = function (marker) {
                    var max_desire = this.find_max_in_circle(marker);
                    if (max_desire.dot(this.aim) > 0)
                        this.desired_aim = this.desired_aim.plus(max_desire.scale_to(0.1));
                    this.desired_aim = this.desired_aim.nudge(0.1).normalized;
                    var acceleration = this.desired_aim.minus(this.aim).scale(0.5);
                    this.aim = this.aim.plus(acceleration).clamp_norm();
                };
                Ant.prototype.find_max_in_circle = function (marker) {
                    var x0 = (this.pos.x | 0);
                    var y0 = (this.pos.y | 0);
                    var max_value = 0;
                    var max_x = x0;
                    var max_y = y0;
                    for (var i = 0; i < Ant.view.size; i++) {
                        var x = x0 + Ant.view.dx[i];
                        var y = y0 + Ant.view.dy[i];
                        if (0 <= x && x < 500) {
                            var value = marker[x + y * 500];
                            if ((value > max_value)) {
                                max_value = value;
                                max_x = x;
                                max_y = y;
                            }
                        }
                    }
                    return new vector2D_3.default(max_x - x0, max_y - y0);
                };
                Ant.prototype.move = function (structures) {
                    var new_pos = this.pos.plus(this.aim);
                    if (new_pos.x < 50 && new_pos.y < 50) {
                        this.has_food = false;
                        this.potency = 255;
                    }
                    if (new_pos.x < 0 || 500 < new_pos.x || new_pos.y < 0 || 375 < new_pos.y) {
                        this.bounce();
                        return;
                    }
                    var new_pos_int = new_pos.trunc();
                    if (structures[utils_1.default.index_of(new_pos_int)] === 1) {
                        this.bounce();
                        return;
                    }
                    else if (structures[utils_1.default.index_of(new_pos_int)] === 2 && !this.has_food) {
                        structures[utils_1.default.index_of(new_pos_int)] = 0;
                        this.has_food = true;
                        this.potency = 255;
                        this.desired_aim = this.aim.negative();
                    }
                    this.pos = new vector2D_3.default(utils_1.default.clamp(new_pos.x, 0, 500), utils_1.default.clamp(new_pos.y, 0, 375));
                    this.wall_count = 0;
                };
                Ant.prototype.bounce = function () {
                    this.pos = this.pos.minus(this.aim);
                    this.desired_aim = vector2D_3.default.ZERO;
                    this.wall_count++;
                    if (this.wall_count > 100) {
                        this.pos = new vector2D_3.default(20, 20);
                    }
                };
                Ant.prototype.drop_marker = function (marker) {
                    var index = utils_1.default.index_of(this.pos);
                    marker[index] = Math.max(marker[index], utils_1.default.trunc(this.potency));
                };
                Ant.prototype.decay_potency = function () {
                    this.potency = Math.max(0, this.potency - 0.125);
                };
                Ant.view = Ant.compute_view();
                return Ant;
            }());
            exports_5("default", Ant);
        }
    };
});
System.register("map", ["vector2D", "utils", "ant"], function (exports_6, context_6) {
    "use strict";
    var vector2D_4, utils_2, ant_1, Map;
    var __moduleName = context_6 && context_6.id;
    return {
        setters: [
            function (vector2D_4_1) {
                vector2D_4 = vector2D_4_1;
            },
            function (utils_2_1) {
                utils_2 = utils_2_1;
            },
            function (ant_1_1) {
                ant_1 = ant_1_1;
            }
        ],
        execute: function () {
            Map = (function () {
                function Map() {
                    this.ants = [];
                    for (var i = 0; i < 1000; i++) {
                        this.ants.push(new ant_1.default(new vector2D_4.default(25, 25), vector2D_4.default.random()));
                    }
                    this.marker_A = new Uint8ClampedArray(187500);
                    this.marker_B = new Uint8ClampedArray(187500);
                    this.structures = new Uint8Array(187500);
                }
                Map.prototype.decay_markers = function () {
                    for (var i = 0; i < 187500; i++) {
                        if ((this.marker_A[i] !== 0 || this.marker_B[i] !== 0) && Math.random() < 0.005) {
                            this.marker_A[i] = 0;
                            this.marker_B[i] = 0;
                        }
                    }
                };
                Map.prototype.update_ants = function () {
                    for (var i = 0; i < 1000; i++) {
                        var ant = this.ants[i];
                        ant.update_aim(ant.has_food ? this.marker_A : this.marker_B);
                        ant.move(this.structures);
                        ant.drop_marker(ant.has_food ? this.marker_B : this.marker_A);
                        ant.decay_potency();
                    }
                };
                Map.prototype.apply_brush = function (pos, radius, value) {
                    var _this = this;
                    utils_2.default.loop_clamped_circle(pos, radius, function (x, y) {
                        var index = x + y * 500;
                        _this.structures[index] = value;
                        _this.marker_A[index] = 0;
                        _this.marker_B[index] = 0;
                    });
                };
                return Map;
            }());
            exports_6("default", Map);
        }
    };
});
System.register("draw", ["utils"], function (exports_7, context_7) {
    "use strict";
    var utils_3, DrawHelper, Brush;
    var __moduleName = context_7 && context_7.id;
    return {
        setters: [
            function (utils_3_1) {
                utils_3 = utils_3_1;
            }
        ],
        execute: function () {
            DrawHelper = (function () {
                function DrawHelper(element_id) {
                    this.canvas = document.getElementById(element_id);
                    this.ctx = this.canvas.getContext('2d');
                    this.img = new ImageData(500, 500);
                    this.brush = new Brush(30, 0);
                    this.init_canvas_settings();
                    this.init_img_data();
                    this.init_listeners();
                }
                DrawHelper.prototype.init_canvas_settings = function () {
                    this.canvas.width = 500;
                    this.canvas.height = 375;
                    this.canvas.addEventListener('contextmenu', function (event) { return event.preventDefault(); });
                    this.canvas.addEventListener('wheel', function (event) { return event.preventDefault(); });
                };
                DrawHelper.prototype.init_img_data = function () {
                    for (var i = 3; i < 750000; i += 4) {
                        this.img.data[i] = 255;
                    }
                };
                DrawHelper.prototype.init_listeners = function () {
                    var _this = this;
                    this.canvas.addEventListener('wheel', function (event) {
                        _this.brush.radius = utils_3.default.clamp(_this.brush.radius - utils_3.default.sign(event.deltaY), 0, 100);
                    });
                };
                DrawHelper.prototype.draw_markers = function (map) {
                    var data = this.img.data;
                    for (var i = 0; i < 187500; i++) {
                        var j = 4 * i;
                        if (map.structures[i] === 1) {
                            data[j] = 100;
                            data[j + 1] = 100;
                            data[j + 2] = 100;
                        }
                        else if (map.structures[i] === 2) {
                            data[j] = 0;
                            data[j + 1] = 0;
                            data[j + 2] = 255;
                        }
                        else {
                            data[j] = map.marker_A[i];
                            data[j + 1] = 0;
                            data[j + 2] = map.marker_B[i];
                        }
                    }
                    this.ctx.putImageData(this.img, 0, 0);
                    this.ctx.fillStyle = '#ff0000';
                    this.ctx.fillRect(0, 0, 50, 50);
                };
                DrawHelper.prototype.draw_ants = function (ants) {
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.beginPath();
                    for (var i = 0; i < 1000; i++) {
                        var p = ants[i].pos;
                        var dp = ants[i].aim.scale_to(1.5);
                        this.ctx.moveTo(p.x - dp.x, p.y - dp.y);
                        this.ctx.lineTo(p.x + dp.x, p.y + dp.y);
                    }
                    this.ctx.stroke();
                };
                DrawHelper.prototype.draw_brush = function (pos) {
                    if (this.brush.material === 0)
                        return;
                    this.ctx.strokeStyle = '#999999';
                    this.ctx.beginPath();
                    this.ctx.arc(pos.x, pos.y, this.brush.radius, 0, 2 * Math.PI);
                    this.ctx.stroke();
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.fillText('brush: ' + { 0: 'none', 1: 'wall', 2: 'food' }[this.brush.material], 10, 375 - 10);
                };
                return DrawHelper;
            }());
            exports_7("default", DrawHelper);
            Brush = (function () {
                function Brush(size, material) {
                    this.radius = size;
                    this.material = material;
                    this.init_listeners();
                }
                Brush.prototype.init_listeners = function () {
                    var _this = this;
                    document.getElementById('button_none').addEventListener('click', function () { return _this.material = 0; });
                    document.getElementById('button_wall').addEventListener('click', function () { return _this.material = 1; });
                    document.getElementById('button_food').addEventListener('click', function () { return _this.material = 2; });
                    window.addEventListener('keydown', function (event) {
                        switch (event.key) {
                            case '0':
                                _this.material = 0;
                                break;
                            case '1':
                                _this.material = 1;
                                break;
                            case '2':
                                _this.material = 2;
                                break;
                        }
                    });
                };
                return Brush;
            }());
            exports_7("Brush", Brush);
        }
    };
});
System.register("main", ["map", "types", "draw"], function (exports_8, context_8) {
    "use strict";
    var map_1, types_1, draw_1, p1, map, mouse, draw, avg_dt, iters_per_frame;
    var __moduleName = context_8 && context_8.id;
    function add_button_listeners() {
        document.getElementById('button_play').addEventListener('click', function () { return iters_per_frame++; });
        document.getElementById('button_pause').addEventListener('click', function () { return iters_per_frame = 0; });
    }
    function step() {
        var t0 = performance.now();
        handle_brush();
        for (var i = 0; i < iters_per_frame; i++) {
            map.decay_markers();
            map.update_ants();
        }
        draw_frame();
        log_time(t0);
        window.requestAnimationFrame(step);
    }
    function log_time(t0) {
        var dt = (performance.now() - t0);
        avg_dt = 0.95 * avg_dt + 0.05 * dt;
        p1.innerHTML = avg_dt.toFixed(2) + 'ms';
    }
    function draw_frame() {
        draw.draw_markers(map);
        draw.draw_ants(map.ants);
        draw.draw_brush(mouse.pos);
    }
    function handle_brush() {
        if (draw.brush.material === 0)
            return;
        if (mouse.is_left_down) {
            map.apply_brush(mouse.pos, draw.brush.radius, draw.brush.material);
            return;
        }
        if (mouse.is_right_down)
            map.apply_brush(mouse.pos, draw.brush.radius, 0);
    }
    return {
        setters: [
            function (map_1_1) {
                map_1 = map_1_1;
            },
            function (types_1_1) {
                types_1 = types_1_1;
            },
            function (draw_1_1) {
                draw_1 = draw_1_1;
            }
        ],
        execute: function () {
            avg_dt = 0;
            iters_per_frame = 0;
            window.addEventListener('load', function () {
                p1 = document.getElementById('p1');
                map = new map_1.default();
                draw = new draw_1.default('canvas');
                mouse = new types_1.MouseData(draw.canvas);
                add_button_listeners();
                step();
            });
        }
    };
});
//# sourceMappingURL=bundle.js.map