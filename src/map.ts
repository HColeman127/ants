import Vec2 from './vector2D';
import {Params} from './params';
import Utils from './utils';
import Ant from './ant';


export default class Simulation {
    public ants: Ant[];
    public marker_A: Uint8ClampedArray;
    public marker_B: Uint8ClampedArray;
    public structures: Uint8Array;

    constructor() {
        this.ants = [];
        for (let i = 0; i < Params.COLONY_SIZE; i++) {
            this.ants.push(new Ant(new Vec2(25, 25), Vec2.rand_vec()));
        }

        this.marker_A = new Uint8ClampedArray(Params.MAP_AREA);
        this.marker_B = new Uint8ClampedArray(Params.MAP_AREA);

        this.structures = new Uint8Array(Params.MAP_AREA);
    }

    decay_markers() {
        for (let i = 0; i < Params.MAP_AREA; i++) {
            if ((this.marker_A[i] !== 0 || this.marker_B[i] !== 0) && Math.random() < 0.005) {
                this.marker_A[i] = 0;
                this.marker_B[i] = 0;
            }
        }
    }
    
    update_ants() {
        for (let i = 0; i < Params.COLONY_SIZE; i++) {
            const ant = this.ants[i];



            ant.update_aim(ant.has_food ? this.marker_A : this.marker_B);
            ant.update_pos(this.structures);
            ant.drop_marker(ant.has_food ? this.marker_B : this.marker_A);
            ant.decay_potency();
        }
    }


    apply_brush(pos: Vec2, radius: number, value: number) {
        Utils.loop_clamped_circle(pos, radius, (x: number, y: number) => {
            const index = x + y * Params.MAP_WIDTH;
            this.structures[index] = value;
            this.marker_A[index] = 0;
            this.marker_B[index] = 0;
        });
    }
}