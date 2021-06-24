import Vec2 from './vector2D';
import {Params} from './params';
import Utils from './utils';
import {Material, ViewData} from './types';

export default class Ant {
    public static readonly view: ViewData = Ant.compute_view();
    
    private static compute_view(): ViewData {
        let pts = [];

        for (let x = -Params.VIEW_DISTANCE; x <= Params.VIEW_DISTANCE; x++) {
            for (let y = -Params.VIEW_DISTANCE; y <= Params.VIEW_DISTANCE; y++) {
                if (x**2 + y**2 <= Params.VIEW_DISTANCE**2) pts.push(new Vec2(x, y));
            }
        }
    
        pts.sort((a, b) => a.angle2pi - b.angle2pi);
        let size = pts.length;
    
        let dx = new Int8Array(size);
        let dy = new Int8Array(size);
        let di = new Uint32Array(size);
    
        for (let i = 0; i < size; i++) {
            const dv = pts[i];
            dx[i] = dv.x;
            dy[i] = dv.y;
            di[i] = dv.x + dv.y * Params.MAP_WIDTH;    
        }

        return {pts, size, dx, dy, di};
    }

    // instance stuff
    public pos: Vec2;
    public aim: Vec2;
    private desired_aim: Vec2;

    public has_food: boolean = false;
    public potency: number = 0;
    private wall_count: number = 0;


    constructor(pos: Vec2, aim: Vec2) {
        this.pos = pos;
        this.aim = aim;
        this.desired_aim = aim;
    }

    update(marker: Uint8ClampedArray, structures: Uint8Array) {
        this.update_aim(marker);
        this.move(structures);
        this.drop_marker(marker);
        this.decay_potency();
    }

    

    public update_aim(marker: Uint8ClampedArray) {
        const max_desire = this.find_max_in_circle(marker);

        if (max_desire.dot(this.aim) > 0) this.desired_aim = this.desired_aim.plus(max_desire.scale_to(0.1));

        this.desired_aim = this.desired_aim.nudge(0.1).normalized;

        const acceleration = this.desired_aim.minus(this.aim).scale(0.5);

        this.aim = this.aim.plus(acceleration).clamp_norm();
    }

    /* private find_max_in_square(): Vec2 {
        const marker = this.has_food ? marker_A : marker_B;

        const x0 = trunc(this.pos.x);
        const y0 = trunc(this.pos.y);

        let max_value = 0;
        let max_x = x0;
        let max_y = x0;

        for (let y = Math.max(0, y0 - Params.VIEW_DISTANCE);
                 y <  Math.min(Params.MAP_HEIGHT, y0 + Params.VIEW_DISTANCE);
                 y++) {
            for (let x = Math.max(0, x0 - Params.VIEW_DISTANCE);
                     x < Math.min(Params.MAP_WIDTH, x0 + Params.VIEW_DISTANCE);
                     x++) {
                const value = marker[x + y * Params.MAP_WIDTH];
                if (value > max_value) {
                    max_value = value;
                    max_x = x;
                    max_y = y;
                }
            }
        }

        //if (max_x === this.pos.x && max_y === this.pos.y) return Vec2.ZERO;

        //console.log(x0, y0);
        //console.log(max_x - x0, max_y - y0);

        return new Vec2(max_x - x0, max_y - y0);

        // if (max_value === 0) {
        //     this.aim = this.aim.plus(Vec2.random(0.1)).clamp_unit();
        //     return;
        // }

        // const adjust = new Vec2(max_x - x0, max_y - y0);

        // if (this.aim.dot(adjust) <= 0) {
        //     this.aim = this.aim.plus(Vec2.random(0.1)).clamp_unit();
        //     return;
        // }

        // this.aim = this.aim.plus(adjust.normalized()).clamp_unit();
    } */

    private find_max_in_circle(marker: Uint8ClampedArray): Vec2 {
        const x0 = (this.pos.x | 0);
        const y0 = (this.pos.y | 0);

        let max_value = 0;
        let max_x = x0;
        let max_y = y0;

        for (let i = 0; i < Ant.view.size; i++) {
            const x = x0 + Ant.view.dx[i];
            const y = y0 + Ant.view.dy[i];

            if (0 <= x && x < Params.MAP_WIDTH) {
                const value = marker[x + y * Params.MAP_WIDTH];
                if ((value > max_value)) {
                    max_value = value;
                    max_x = x;
                    max_y = y;
                }
            }
        }

        return new Vec2(max_x - x0, max_y - y0);
    }

    public move(structures: Uint8Array) {
        let new_pos = this.pos.plus(this.aim);

        if (new_pos.x < 50 && new_pos.y < 50) {
            this.has_food = false;
            this.potency = Params.MAX_POTENCY;
        }

        // hit edges
        if (new_pos.x < 0 || Params.MAP_WIDTH < new_pos.x || new_pos.y < 0 || Params.MAP_HEIGHT < new_pos.y) {
            this.bounce();
            return;
        } 

        // hit wall
        const new_pos_int = new_pos.trunc();
        if (structures[Utils.index_of(new_pos_int)] === Material.wall) {
            this.bounce();
            return;
        } else if (structures[Utils.index_of(new_pos_int)] === Material.food && !this.has_food) {
            structures[Utils.index_of(new_pos_int)] = Material.none;
            this.has_food = true;
            this.potency = Params.MAX_POTENCY;
            this.desired_aim = this.aim.negative();
        }

        this.pos = new Vec2(Utils.clamp(new_pos.x, 0, Params.MAP_WIDTH), Utils.clamp(new_pos.y, 0, Params.MAP_HEIGHT));
        this.wall_count = 0;
    }

    private bounce() {
        this.pos = this.pos.minus(this.aim);
        this.desired_aim = Vec2.ZERO;
        this.wall_count++;
        if (this.wall_count > 100) {
            this.pos = new Vec2(20, 20);
        }
    }

    public drop_marker(marker: Uint8ClampedArray) {
        const index = Utils.index_of(this.pos);
        marker[index] = Math.max(marker[index], Utils.trunc(this.potency));
    }

    public decay_potency() {
        this.potency = Math.max(0, this.potency - Params.POTENCY_DECAY);
    }
}