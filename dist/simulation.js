import Vec2 from './vector2D';
import { Utils } from './utils';
import Ant from './ant';
var Simulation = (function () {
    function Simulation() {
        this.ants = [];
        for (var i = 0; i < 1000; i++) {
            this.ants.push(new Ant(new Vec2(25, 25), Vec2.rand()));
        }
        this.marker_A = new Uint8ClampedArray(187500);
        this.marker_B = new Uint8ClampedArray(187500);
        this.structures = new Uint8Array(187500);
    }
    Simulation.prototype.update = function () {
        this.decay_markers();
        this.update_ants;
    };
    Simulation.prototype.decay_markers = function () {
        for (var i = 0; i < 187500; i++) {
            if ((this.marker_A[i] !== 0 || this.marker_B[i] !== 0) && Math.random() < 0.005) {
                this.marker_A[i] = 0;
                this.marker_B[i] = 0;
            }
        }
    };
    Simulation.prototype.update_ants = function () {
        for (var i = 0; i < 1000; i++) {
            var ant = this.ants[i];
            ant.update_pos(this.structures);
            ant.drop_marker(ant.has_food ? this.marker_B : this.marker_A);
            ant.decay_potency();
        }
    };
    Simulation.prototype.apply_brush = function (pos, radius, value) {
        var _this = this;
        Utils.loop_clamped_circle(pos, radius, function (x, y) {
            var index = x + y * 500;
            _this.structures[index] = value;
            _this.marker_A[index] = 0;
            _this.marker_B[index] = 0;
        });
    };
    return Simulation;
}());
export default Simulation;
//# sourceMappingURL=simulation.js.map