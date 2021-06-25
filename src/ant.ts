import Vec2 from './vector2D';
import {Params} from './params';
import {Material, Utils} from './utils';

type ViewData = {
    pts: Vec2[],
    size: number,
    dx: Int8Array,
    dy: Int8Array
}

export default class Ant {
    public static readonly view: ViewData = Ant.compute_view();

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

    public update_aim(marker: Uint8ClampedArray) {
        const x0 = Math.trunc(this.pos.x);
        const y0 = Math.trunc(this.pos.y);

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

        const target = new Vec2(max_x - x0, max_y - y0);

        if (target.dot(this.aim) > 0) this.desired_aim = this.desired_aim.plus(target.scaled_to(0.1));

        this.desired_aim = this.desired_aim.plus(Vec2.rand(0.1)).normalized;

        this.aim = this.aim.plus(this.desired_aim.minus(this.aim).scaled(0.5)).clamp_norm();
    }

    public update_pos(structures: Uint8Array) {
        const new_pos = this.pos.plus(this.aim);

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
            this.bounce();
        }

        this.pos = new Vec2(Utils.clamp(new_pos.x, 0, Params.MAP_WIDTH), Utils.clamp(new_pos.y, 0, Params.MAP_HEIGHT));
        this.wall_count = 0;
    }

    private bounce() {
        this.pos = this.pos.minus(this.aim);
        this.desired_aim = Vec2.ZEROS;
        this.wall_count++;
        if (this.wall_count > 100) {
            this.pos = new Vec2(20, 20);
        }
    }

    public drop_marker(marker: Uint8ClampedArray) {
        const index = Utils.index_of(this.pos);
        marker[index] = Math.max(marker[index], Math.trunc(this.potency));
    }

    public decay_potency() {
        this.potency = Math.max(0, this.potency - Params.POTENCY_DECAY);
    }

    private static compute_view(): ViewData {
        let pts = [];

        for (let x = -Params.VIEW_DISTANCE; x <= Params.VIEW_DISTANCE; x++) {
            for (let y = -Params.VIEW_DISTANCE; y <= Params.VIEW_DISTANCE; y++) {
                if (x**2 + y**2 <= Params.VIEW_DISTANCE**2) pts.push(new Vec2(x, y));
            }
        }
    
        //pts.sort((a, b) => a.norm - b.norm);
        let size = pts.length;
    
        let dx = new Int8Array(size);
        let dy = new Int8Array(size);
    
        for (let i = 0; i < size; i++) {
            const dv = pts[i];
            dx[i] = dv.x;
            dy[i] = dv.y; 
        }

        return {pts: pts, size: size, dx: dx, dy: dy};
    }
}