var Vec2 = (function () {
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
            return this.scaled(1 / Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2)));
        },
        enumerable: false,
        configurable: true
    });
    Vec2.prototype.scaled = function (scalar) {
        return new Vec2(scalar * this.x, scalar * this.y);
    };
    Vec2.prototype.scaled_to = function (scalar) {
        return this.scaled(scalar / Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2)));
    };
    Vec2.prototype.trunc = function () {
        return new Vec2(Math.trunc(this.x), Math.trunc(this.y));
    };
    Vec2.prototype.clamp_norm = function (max) {
        if (max === void 0) { max = 1; }
        var sqr_norm = Math.pow(this.x, 2) + Math.pow(this.y, 2);
        return (sqr_norm <= Math.pow(max, 2)) ? this : this.scaled(max / Math.sqrt(sqr_norm));
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
    Vec2.rand = function (scalar) {
        if (scalar === void 0) { scalar = 1; }
        return new Vec2(scalar * (2 * Math.random() - 1), scalar * (2 * Math.random() - 1));
    };
    Vec2.ZEROS = new Vec2(0, 0);
    Vec2.ONES = new Vec2(1, 1);
    Vec2.Ex = new Vec2(1, 0);
    Vec2.Ey = new Vec2(0, 1);
    return Vec2;
}());
export default Vec2;
//# sourceMappingURL=vector2D.js.map