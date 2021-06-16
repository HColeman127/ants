var vec2 = /** @class */ (function () {
    function vec2(x, y) {
        this.x = x;
        this.y = y;
    }
    // instance methods
    // unary operators
    vec2.prototype.is_zero = function () {
        return (this.x == 0 && this.y == 0);
    };
    vec2.prototype.apply = function (func) {
        return new vec2(func(this.x), func(this.y));
    };
    vec2.prototype.negative = function () {
        return new vec2(-this.x, -this.y);
    };
    vec2.prototype.scale = function (scalar) {
        return new vec2(scalar * this.x, scalar * this.y);
    };
    vec2.prototype.trunc = function () {
        return new vec2(Math.floor(this.x), Math.floor(this.y));
    };
    vec2.prototype.norm = function () {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    };
    vec2.prototype.normalized = function () {
        var inv_norm = 1 / this.norm();
        //return new vec2(inv_norm * this.x, inv_norm * this.y);
        return this.scale(1 / this.norm());
    };
    // binary operators
    vec2.prototype.plus = function (v) {
        return new vec2(this.x + v.x, this.y + v.y);
    };
    vec2.prototype.minus = function (v) {
        return new vec2(this.x - v.x, this.y - v.y);
    };
    vec2.prototype.dot = function (v) {
        return (this.x * v.x) + (this.y * v.y);
    };
    vec2.prototype.dist_to = function (v) {
        return Math.sqrt(Math.pow((this.x - v.x), 2) + Math.pow((this.y - v.y), 2));
    };
    // static methods
    vec2.random = function (scalar) {
        if (scalar === void 0) { scalar = 1; }
        return new vec2(scalar * (2 * Math.random() - 1), scalar * (2 * Math.random() - 1));
    };
    // static fields
    vec2.zero = new vec2(0, 0);
    return vec2;
}());
export default vec2;
//# sourceMappingURL=vector2D.js.map