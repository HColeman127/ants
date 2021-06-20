var Vec2 = /** @class */ (function () {
    function Vec2(x, y) {
        this.x = x;
        this.y = y;
    }
    // instance methods
    // unary operators
    Vec2.prototype.copy = function () {
        return new Vec2(this.x, this.y);
    };
    Vec2.prototype.is_zero = function () {
        return (this.x === 0 && this.y === 0);
    };
    Vec2.prototype.apply = function (func) {
        return new Vec2(func(this.x), func(this.y));
    };
    Vec2.prototype.negative = function () {
        return new Vec2(-this.x, -this.y);
    };
    Vec2.prototype.scale = function (scalar) {
        return new Vec2(scalar * this.x, scalar * this.y);
    };
    Vec2.prototype.trunc = function () {
        return new Vec2(this.x << 0, this.y << 0);
    };
    Vec2.prototype.sqr_norm = function () {
        return Math.pow(this.x, 2) + Math.pow(this.y, 2);
    };
    Vec2.prototype.norm = function () {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    };
    Vec2.prototype.normalized = function () {
        return this.scale(1 / this.norm());
    };
    Vec2.prototype.clamp_unit = function () {
        var sqr_norm = Math.pow(this.x, 2) + Math.pow(this.y, 2);
        return (sqr_norm <= 1) ? this : this.scale(1 / Math.sqrt(sqr_norm));
    };
    Vec2.prototype.clamp_norm = function (max) {
        if (max === void 0) { max = 1; }
        var sqr_norm = Math.pow(this.x, 2) + Math.pow(this.y, 2);
        return (sqr_norm <= Math.pow(max, 2)) ? this : this.scale(max / Math.sqrt(sqr_norm));
    };
    Vec2.prototype.orth = function () {
        return new Vec2(-this.y, this.x);
    };
    Vec2.prototype.angle = function () {
        return Math.atan2(this.y, this.x);
    };
    Vec2.prototype.angle2pi = function () {
        var ang = this.angle();
        return (ang >= 0 ? ang : 2 * Math.PI + ang);
    };
    // binary operators
    Vec2.prototype.equals = function (v) {
        return (this.x === v.x && this.y === v.y);
    };
    Vec2.prototype.plus = function (v) {
        return new Vec2(this.x + v.x, this.y + v.y);
    };
    Vec2.prototype.minus = function (v) {
        return new Vec2(this.x - v.x, this.y - v.y);
    };
    Vec2.prototype.nudge = function (scalar) {
        if (scalar === void 0) { scalar = 1; }
        return this.plus(Vec2.random(scalar));
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
    // static methods
    Vec2.random = function (scalar) {
        if (scalar === void 0) { scalar = 1; }
        return new Vec2(scalar * (2 * Math.random() - 1), scalar * (2 * Math.random() - 1));
    };
    Vec2.polar = function (r, theta) {
        return new Vec2(r * Math.cos(theta), r * Math.sin(theta));
    };
    // static fields
    Vec2.ZERO = new Vec2(0, 0);
    Vec2.ONE = new Vec2(1, 1);
    Vec2.Ex = new Vec2(1, 0);
    Vec2.Ey = new Vec2(0, 1);
    return Vec2;
}());
export default Vec2;
//# sourceMappingURL=vector2D.js.map