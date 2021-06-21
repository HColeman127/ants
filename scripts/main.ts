import Vec2 from './vector2D.js';

const enum Params {
    MAP_WIDTH = 500,
    MAP_HEIGHT = 375,
    MAP_SIZE = 500,
    MAP_AREA = MAP_WIDTH * MAP_HEIGHT,
    IMAGE_ARRAY_SIZE = MAP_AREA * 4,
    COLONY_SIZE = 1000,
    VIEW_DISTANCE = 20,
    MAX_POTENCY = 0b11111111,
    POTENCY_DECAY = 2**(-3)
}

const enum Material {
    none = 0,
    wall = 1,
    food = 2
}

// html elements
let canvas : HTMLCanvasElement;
let ctx : CanvasRenderingContext2D;

let p1: HTMLElement;
let p2: HTMLElement;
let avg_dt: number = 0;


// arrays
let ants: Ant[];
let image_data: ImageData;

let marker_A: Uint8ClampedArray;
let marker_B: Uint8ClampedArray;

let structures: Uint8ClampedArray;

let vision_disc: Vec2[];
let disc_size: number;
let disc_dx: Int8Array;
let disc_dy: Int8Array;
let disc_di: Uint32Array;

// input
let stroke_width: number = 30;
let brush_material: Material = Material.none;

let mouse_pos: Vec2 = Vec2.ZERO;
let is_left_mouse_down: boolean = false;
let is_right_mouse_down: boolean = false;


// uhhh stuff?
let iters_per_frame: number = 0;



window.addEventListener('load', () => {
    init_html_refs();
    init_arrays();
    add_mouse_listeners();
    add_button_listeners();
    add_key_listeners();

    step();
});

function init_html_refs() {
    canvas = document.getElementById('canvas') as HTMLCanvasElement;
    ctx = canvas.getContext('2d');
    p1 = document.getElementById('p1');
    p2 = document.getElementById('p2');

    canvas.width = Params.MAP_WIDTH;
    canvas.height = Params.MAP_HEIGHT;
}

function init_arrays() {
    // ants
    ants = [];
    for (let i = 0; i < Params.COLONY_SIZE; i++) {
        ants.push(new Ant(new Vec2(25, 25), Vec2.random()));
    }

    // markers
    marker_A = new Uint8ClampedArray(Params.MAP_AREA);
    marker_B = new Uint8ClampedArray(Params.MAP_AREA);

    // image data
    image_data = new ImageData(Params.MAP_WIDTH, Params.MAP_HEIGHT);
    for (let i = 3; i < Params.IMAGE_ARRAY_SIZE; i+=4) {
        image_data.data[i] = 255;
    }

    // structures
    structures = new Uint8Array(Params.MAP_AREA);
    
    // vision disc
    init_vision_disc();
}

function init_vision_disc() {
    vision_disc = [];
    const sections = 8;
    for (let x = -Params.VIEW_DISTANCE; x <= Params.VIEW_DISTANCE; x++) {
        for (let y = -Params.VIEW_DISTANCE; y <= Params.VIEW_DISTANCE; y++) {
            if (x**2 + y**2 <= Params.VIEW_DISTANCE**2) vision_disc.push(new Vec2(x, y));
        }
    }

    vision_disc.sort((a, b) => a.angle2pi - b.angle2pi);
    disc_size = vision_disc.length;

    disc_dx = new Int8Array(vision_disc.length);
    disc_dy = new Int8Array(vision_disc.length);
    disc_di = new Uint32Array(vision_disc.length);

    ctx.fillStyle = '#ffffff';
    for (const i in vision_disc) {
        const dv = vision_disc[i];
        disc_dx[i] = dv.x;
        disc_dy[i] = dv.y;
        disc_di[i] = dv.x + dv.y * Params.MAP_WIDTH;
    }
}

function add_mouse_listeners() {
    canvas.oncontextmenu = (event: MouseEvent) => event.preventDefault();

    canvas.addEventListener('mousedown', (event: MouseEvent) => {
        is_left_mouse_down ||= (event.button === 0);
        is_right_mouse_down ||= (event.button === 2);
    });

    window.addEventListener('mousemove', (event: MouseEvent) => mouse_pos = get_mouse_position(event));

    window.addEventListener('mouseup', (event: MouseEvent) => {
        is_left_mouse_down &&= !(event.button === 0);
        is_right_mouse_down &&= !(event.button === 2);
    });

    canvas.addEventListener('wheel', (event: WheelEvent) => {
        event.preventDefault();
        stroke_width = (event.deltaY > 0 ? Math.max(1, stroke_width - 1) : Math.min(100, stroke_width + 1));
    });
}

function add_button_listeners() {
    document.getElementById('button_play').addEventListener('click', () => iters_per_frame++);
    document.getElementById('button_pause').addEventListener('click', () => iters_per_frame = 0);
    document.getElementById('button_none').addEventListener('click', () => brush_material = Material.none);
    document.getElementById('button_wall').addEventListener('click', () => brush_material = Material.wall);
    document.getElementById('button_food').addEventListener('click', () => brush_material = Material.food);
}

function add_key_listeners() {
    window.addEventListener('keydown', (event: KeyboardEvent) => {
        switch (event.key) {
            case '0':
                brush_material = Material.none;
                break;
            case '1':
                brush_material = Material.wall;
                break;
            case '2':
                brush_material = Material.food;
                break;
        }
    });
}


function step() {
    const t0 = performance.now();

    handle_brush();
    for (let _ = 0; _ < iters_per_frame; _++) {
        decay_markers();
        update_ants();
    }
    draw_frame();

    ctx.fillStyle = "#ffffff";
    ctx.fillText("brush: " + {0: 'none', 1: 'wall', 2: 'food'}[brush_material], 10, Params.MAP_HEIGHT - 10);
    
    log_time(t0);

    window.requestAnimationFrame(step);
}

function log_time(t0: number) {
    const dt = (performance.now() - t0);

    avg_dt = 0.95*avg_dt + 0.05*dt;
    p1.innerHTML = avg_dt.toFixed(2) + 'ms';
}

function draw_frame() {
    draw_map();
    draw_ants();
    if (brush_material !== Material.none) draw_brush();
}

function draw_map(): void {
    for (let i = 0; i < Params.MAP_AREA; i++) {
        const j = 4 * i;

        if (structures[i] === Material.wall) {
            image_data.data[j]     = 100;
            image_data.data[j + 1] = 100;
            image_data.data[j + 2] = 100;
        } else if (structures[i] === Material.food) {
            image_data.data[j]     = 0;
            image_data.data[j + 1] = 0;
            image_data.data[j + 2] = 255;
        } else {
            image_data.data[j]     = marker_A[i];
            image_data.data[j + 1] = 0;
            image_data.data[j + 2] = marker_B[i];
        }
    }
    ctx.putImageData(image_data, 0, 0);

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 50, 50);
}

function decay_markers(): void {
    for (let i = 0; i < Params.MAP_AREA; i++) {
        if ((marker_A[i] !== 0 || marker_B[i] !== 0) && Math.random() < 0.005) {
            marker_A[i] = 0;
            marker_B[i] = 0;
        }
    }
}

function update_ants(): void {
    for (let i = 0; i < Params.COLONY_SIZE; i++) {
        ants[i].update();
    }
}

function draw_ants(): void {
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();

    for (let i = 0; i < Params.COLONY_SIZE; i++) {
        const p = ants[i].pos;
        const dp = ants[i].aim.scale_to(1.5);

        ctx.moveTo(p.x - dp.x, p.y - dp.y);
        ctx.lineTo(p.x + dp.x, p.y + dp.y);
    }

    ctx.stroke();
}

function handle_brush() {
    if (is_left_mouse_down && brush_material !== Material.none) {
        apply_brush(brush_material);
    } else if (is_right_mouse_down) {
        apply_brush(0);
    }
}

function apply_brush(value: number) {
    loop_clamped_circle(mouse_pos, stroke_width, (x: number, y: number) => {
        const index = x + y * Params.MAP_WIDTH;
        structures[index] = value;
        marker_A[index] = 0;
        marker_B[index] = 0;
    });
}

function draw_brush() {
    ctx.strokeStyle = '#999999';
    ctx.beginPath();
    ctx.arc(mouse_pos.x, mouse_pos.y, stroke_width, 0, 2*Math.PI);
    ctx.stroke();
}

class Ant {
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

    update() {
        this.update_aim();
        this.move();
        this.drop_marker();
        this.decay_potency();
    }

    private update_aim() {
        const max_desire = this.find_max_in_circle();

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

    private find_max_in_circle(): Vec2 {
        const marker = this.has_food ? marker_A : marker_B;

        const x0 = (this.pos.x | 0);
        const y0 = (this.pos.y | 0);

        let max_value = 0;
        let max_x = x0;
        let max_y = y0;

        for (let i = 0; i < disc_size; i++) {
            const x = x0 + disc_dx[i];
            const y = y0 + disc_dy[i];

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

    private move() {
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
        if (structures[index_of(new_pos_int)] === Material.wall) {
            this.bounce();
            return;
        } else if (structures[index_of(new_pos_int)] === Material.food && !this.has_food) {
            structures[index_of(new_pos_int)] = Material.none;
            this.has_food = true;
            this.potency = Params.MAX_POTENCY;
            this.desired_aim = this.aim.negative();
        }

        this.pos = new Vec2(clamp(new_pos.x, 0, Params.MAP_WIDTH), clamp(new_pos.y, 0, Params.MAP_HEIGHT));
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

    private drop_marker() {
        const marker = this.has_food ? marker_B : marker_A;
        const index = index_of(this.pos);
        marker[index] = Math.max(marker[index], trunc(this.potency));
    }

    private decay_potency() {
        this.potency = Math.max(0, this.potency - Params.POTENCY_DECAY);
    }
}




// utils ----------------------

function index_of(pos: Vec2): number {
    return trunc(pos.x) + trunc(pos.y) * Params.MAP_WIDTH;
}

function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}

function rand(scale: number = 1): number {
    return scale * 2 * (Math.random() - 0.5);
}

function trunc(val: number): number {
    return val | 0;
}

function get_mouse_position(event: MouseEvent): Vec2 {
    const rect = canvas.getBoundingClientRect();
    return new Vec2(event.clientX - rect.left, event.clientY - rect.top);
}

function loop_rectangle(pos_bot: Vec2, pos_top: Vec2, func: Function): void {
    for (let y = pos_bot.y; y < pos_top.y; y++) {
        for (let x = pos_bot.x; x < pos_top.x; x++) {
            func(x, y);
        }
    }
}

function loopSquareClamped(pos: Vec2, inradius: number, func: Function): void {
    loop_rectangle(
        new Vec2(
            Math.max(pos.x - inradius, 0), 
            Math.max(pos.y - inradius, 0)
        ),
        new Vec2(
            Math.min(pos.x + inradius, Params.MAP_WIDTH), 
            Math.min(pos.y + inradius, Params.MAP_HEIGHT)
        ),
        func
    );
}

function loop_clamped_circle(pos: Vec2, radius: number, func: Function): void {
    const sqr_radius = radius**2;
    for (let y = Math.max(0, trunc(pos.y) - radius);
             y <  Math.min(Params.MAP_HEIGHT, trunc(pos.y) + radius);
             y++) {
        for (let x = Math.max(0, trunc(pos.x) - radius);
                 x < Math.min(Params.MAP_WIDTH, trunc(pos.x) + radius);
                 x++) {
            if ((pos.x - x)**2 + (pos.y - y)**2 < sqr_radius) {
                func(x, y);
            }
        }
    }
}
