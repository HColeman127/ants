var Utils = (function () {
    function Utils() {
    }
    Utils.index_of = function (pos) {
        return Math.trunc(pos.x) + Math.trunc(pos.y) * 500;
    };
    Utils.clamp = function (num, min, max) {
        return Math.max(min, Math.min(max, num));
    };
    Utils.sgn = function (num) {
        if (num > 0)
            return 1;
        if (num < 0)
            return -1;
        return 0;
    };
    Utils.loop_clamped_circle = function (pos, radius, fn) {
        var square_radius = Math.pow(radius, 2);
        for (var y = Math.max(0, Math.trunc(pos.y) - radius); y < Math.min(375, Math.trunc(pos.y) + radius); y++) {
            for (var x = Math.max(0, Math.trunc(pos.x) - radius); x < Math.min(500, Math.trunc(pos.x) + radius); x++) {
                if (Math.pow((pos.x - x), 2) + Math.pow((pos.y - y), 2) < square_radius) {
                    fn(x, y);
                }
            }
        }
    };
    return Utils;
}());
export { Utils };
//# sourceMappingURL=utils.js.map