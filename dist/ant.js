import Vec2 from './vector2D';
import { Utils } from './utils';
var Ant = (function () {
    function Ant(pos, aim) {
        this.has_food = false;
        this.potency = 0;
        this.wall_count = 0;
        this.pos = pos;
        this.aim = aim;
        this.desired_aim = aim;
    }
    Ant.prototype.update_aim = function (marker) {
        var x0 = Math.trunc(this.pos.x);
        var y0 = Math.trunc(this.pos.y);
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
        var target = new Vec2(max_x - x0, max_y - y0);
        if (target.dot(this.aim) > 0)
            this.desired_aim = this.desired_aim.plus(target.scaled_to(0.1));
        this.desired_aim = this.desired_aim.plus(Vec2.rand(0.1)).normalized;
        this.aim = this.aim.plus(this.desired_aim.minus(this.aim).scaled(0.5)).clamp_norm();
    };
    Ant.prototype.update_pos = function (structures) {
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
        if (structures[Utils.index_of(new_pos_int)] === 1) {
            this.bounce();
            return;
        }
        else if (structures[Utils.index_of(new_pos_int)] === 2 && !this.has_food) {
            structures[Utils.index_of(new_pos_int)] = 0;
            this.has_food = true;
            this.potency = 255;
            this.desired_aim = this.aim.scaled(-1);
        }
        this.pos = new Vec2(Utils.clamp(new_pos.x, 0, 500), Utils.clamp(new_pos.y, 0, 375));
        this.wall_count = 0;
    };
    Ant.prototype.bounce = function () {
        this.pos = this.pos.minus(this.aim);
        this.desired_aim = Vec2.ZEROS;
        this.wall_count++;
        if (this.wall_count > 100) {
            this.pos = new Vec2(20, 20);
        }
    };
    Ant.prototype.drop_marker = function (marker) {
        var index = Utils.index_of(this.pos);
        marker[index] = Math.max(marker[index], Math.trunc(this.potency));
    };
    Ant.prototype.decay_potency = function () {
        this.potency = Math.max(0, this.potency - 0.125);
    };
    Ant.compute_view = function () {
        var pts = [];
        for (var x = -20; x <= 20; x++) {
            for (var y = -20; y <= 20; y++) {
                if (Math.pow(x, 2) + Math.pow(y, 2) <= Math.pow(20, 2))
                    pts.push(new Vec2(x, y));
            }
        }
        var size = pts.length;
        var dx = new Int8Array(size);
        var dy = new Int8Array(size);
        for (var i = 0; i < size; i++) {
            var dv = pts[i];
            dx[i] = dv.x;
            dy[i] = dv.y;
        }
        return { pts: pts, size: size, dx: dx, dy: dy };
    };
    Ant.view = Ant.compute_view();
    return Ant;
}());
export default Ant;
//# sourceMappingURL=ant.js.map