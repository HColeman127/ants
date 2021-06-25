import { Utils } from './utils';
var DrawHelper = (function () {
    function DrawHelper(element_id) {
        this.canvas = document.getElementById(element_id);
        this.ctx = this.canvas.getContext('2d');
        this.img = new ImageData(500, 500);
        this.brush = new BrushData(30, 0);
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
            _this.brush.radius = Utils.clamp(_this.brush.radius - Utils.sgn(event.deltaY), 0, 100);
        });
    };
    DrawHelper.prototype.draw_frame = function (sim) {
        this.draw_markers(sim);
        this.draw_ants(sim.ants);
    };
    DrawHelper.prototype.draw_markers = function (sim) {
        var data = this.img.data;
        for (var i = 0; i < 187500; i++) {
            var j = 4 * i;
            if (sim.structures[i] === 1) {
                data[j] = 100;
                data[j + 1] = 100;
                data[j + 2] = 100;
            }
            else if (sim.structures[i] === 2) {
                data[j] = 0;
                data[j + 1] = 0;
                data[j + 2] = 255;
            }
            else {
                data[j] = sim.marker_A[i];
                data[j + 1] = 0;
                data[j + 2] = sim.marker_B[i];
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
            var dp = ants[i].aim.scaled_to(1.5);
            this.ctx.moveTo(p.x - dp.x, p.y - dp.y);
            this.ctx.lineTo(p.x + dp.x, p.y + dp.y);
        }
        this.ctx.stroke();
    };
    DrawHelper.prototype.draw_brush = function (pos) {
        this.ctx.strokeStyle = '#999999';
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, this.brush.radius, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('brush: ' + { 0: 'none', 1: 'wall', 2: 'food' }[this.brush.material], 10, 375 - 10);
    };
    return DrawHelper;
}());
export default DrawHelper;
var BrushData = (function () {
    function BrushData(size, material) {
        this.radius = size;
        this.material = material;
        this.init_listeners();
    }
    BrushData.prototype.init_listeners = function () {
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
    return BrushData;
}());
export { BrushData };
//# sourceMappingURL=draw.js.map