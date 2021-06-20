import Vec2 from './vector2D.js';

const enum Params {
    MAP_SIZE = 500,
    MAP_AREA = MAP_SIZE * MAP_SIZE,
    IMAGE_ARRAY_SIZE = MAP_AREA * 4,
    COLONY_SIZE = 1000,
    MAX_MARKER = 2**16 - 1,
    MARKER_DECAY = 100,
    VIEW_DISTANCE = 20,
    SPEED = 1,
    MAX_POTENCY = 255,
    POTENCY_DECAY = 2**(-3)
}

const enum Brush {
    erase = 0,
    draw = 1,
    none
}


let canvas : HTMLCanvasElement;
let ctx : CanvasRenderingContext2D;

let is_playing: boolean = false;


let stroke_width: number = 30;
let active_brush_wall: Brush = Brush.none;
let mouse_pos: Vec2;




let ants: Ant[];
let image_data: ImageData;

let marker_A: Uint8ClampedArray;
let marker_B: Uint8ClampedArray;

let structures: Uint8ClampedArray;


let p1: HTMLElement;
let p2: HTMLElement;
let avg_dt: number = 0;


let vision_disc: Vec2[];
let disc_size: number;
let disc_dx: Int8Array;
let disc_dy: Int8Array;
let disc_di: Uint32Array;


window.addEventListener('load', () => {
    init_html_refs();
    init_arrays();
    add_mouse_listeners();
    add_button_listeners();
});

function init_html_refs() {
    canvas = document.getElementById('canvas') as HTMLCanvasElement;
    ctx = canvas.getContext('2d');
    p1 = document.getElementById('p1');
    p2 = document.getElementById('p2');

    canvas.width = Params.MAP_SIZE;
    canvas.height = Params.MAP_SIZE;
}

function init_arrays() {
    // ants
    ants = [];
    for (let i = 0; i < Params.COLONY_SIZE; i++) {
        ants.push(new Ant(new Vec2(20, 20), Vec2.random()));
    }

    // markers
    marker_A = new Uint8ClampedArray(Params.MAP_AREA);
    marker_B = new Uint8ClampedArray(Params.MAP_AREA);

    // image data
    image_data = new ImageData(Params.MAP_SIZE, Params.MAP_SIZE);
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

    vision_disc.sort((a, b) => a.angle2pi() - b.angle2pi());
    disc_size = vision_disc.length;

    disc_dx = new Int8Array(vision_disc.length);
    disc_dy = new Int8Array(vision_disc.length);
    disc_di = new Uint32Array(vision_disc.length);

    ctx.fillStyle = '#ffffff';
    for (const i in vision_disc) {
        const dv = vision_disc[i];
        disc_dx[i] = dv.x;
        disc_dy[i] = dv.y;
        disc_di[i] = dv.x + dv.y * Params.MAP_SIZE;
    }
}

function add_mouse_listeners() {
    canvas.oncontextmenu = (event: MouseEvent) => event.preventDefault();

    canvas.addEventListener('mousedown', (event: MouseEvent) => {
        //mouse_pos = getMousePosition(event);

        switch (event.button) {
            case 0:
                active_brush_wall = Brush.draw;
                handle_brush_wall();
                break;
            case 2:
                active_brush_wall = Brush.erase;
                handle_brush_wall();
                break;
        }

        draw_frame();
    });

    window.addEventListener('mousemove', (event: MouseEvent) => {
        mouse_pos = get_mouse_position(event);

        if (active_brush_wall === Brush.draw || active_brush_wall === Brush.erase) handle_brush_wall();

        draw_frame();
    });

    window.addEventListener('mouseup', (event: MouseEvent) => {
        active_brush_wall = Brush.none;
    });

    canvas.addEventListener('wheel', (event: WheelEvent) => {
        event.preventDefault();

        stroke_width = event.deltaY > 0 ? Math.max(1, stroke_width - 1) : Math.min(100, stroke_width + 1);

        draw_frame();
    });
}

function add_button_listeners() {
    const play_button = document.getElementById('play_button') as HTMLButtonElement;
    play_button.addEventListener('click', () => {
        is_playing = true;
        step();
    });

    const pause_button = document.getElementById('pause_button') as HTMLButtonElement;
    pause_button.addEventListener('click', () => {
        is_playing = false;
    });
}

function step() {
    const t0 = performance.now();

    decay_markers();
    update_ants();

    draw_frame();
    
    const dt = (performance.now() - t0);

    avg_dt = 0.9*avg_dt + 0.1*dt;
    p1.innerHTML = avg_dt.toFixed(2) + 'ms';
    //p2.innerHTML = avg_time.toFixed(2) + 'ms avg';

    if (is_playing) {
        window.requestAnimationFrame(step);
    }
}

function draw_frame() {
    draw_map();
    //ctx.fillStyle = '#000000';
    //ctx.fillRect(0, 0, Params.MAP_SIZE, Params.MAP_SIZE);
    draw_ants();
    draw_brush();
}

function draw_map(): void {
    for (let i = 0; i < Params.MAP_AREA; i++) {
        const j = 4 * i;

        if (structures[i] & 1) {
            image_data.data[j]     = 100;
            image_data.data[j + 1] = 100;
            image_data.data[j + 2] = 100;
        } else {
            image_data.data[j]     = marker_A[i];
            image_data.data[j + 1] = 0;
            image_data.data[j + 2] = marker_B[i];
        }
    }
    ctx.putImageData(image_data, 0, 0);

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 50, 50);
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(Params.MAP_SIZE - 50, Params.MAP_SIZE - 50, 50, 50);
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
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < Params.COLONY_SIZE; i++) {
        //ctx.fillRect(ants[i].pos.x - 1, ants[i].pos.y - 1, 2, 2);
        const p = ants[i].pos;
        const dp = ants[i].aim.normalized().scale(1.5);
        
        ctx.moveTo(p.x - dp.x, p.y - dp.y);
        ctx.lineTo(p.x + dp.x, p.y + dp.y);
        
    }
    ctx.stroke();
}

function handle_brush_wall() {
    loop_clamped_circle(mouse_pos, stroke_width, (x: number, y: number) => {
        const index = x + y * Params.MAP_SIZE;
        structures[index] = active_brush_wall;
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

    public has_food: boolean = false;
    public potency: number = 0;

    private desired_aim: Vec2;

    private wall_count: number = 0;

    constructor(pos: Vec2, aim: Vec2) {
        this.pos = pos;
        this.aim = aim;
        this.desired_aim = aim;
    }

    update() {
        //this.update_aim();

        this.update_aim();

        this.move();
        this.drop_marker();
        this.decay_potency();
    }

    private update_aim() {
        //const to_max = this.find_max_in_square();
        //const to_max = mouse_pos;

        const max_desire = this.find_max_in_circle().minus(this.pos);

        this.desired_aim = this.desired_aim.plus(max_desire.dot(this.aim) <= 0 ? Vec2.ZERO : max_desire.normalized().scale(0.1));

        this.desired_aim = this.desired_aim.nudge(0.1).normalized();


        const acceleration = this.desired_aim.minus(this.aim).scale(0.5);

        this.aim = this.aim.plus(acceleration).clamp_unit();
        // if (this.aim.dot(adjust) > 0) {
        //     this.aim = this.aim.plus(adjust.normalized().plus(Vec2.random()).scale(0.1)).clamp_unit();
        // } else {
        //     this.aim = this.aim.plus(Vec2.random(0.1)).clamp_unit();
        // }
         
    }

    private find_max_in_square(): Vec2 {
        const marker = this.has_food ? marker_A : marker_B;

        const x0 = trunc(this.pos.x);
        const y0 = trunc(this.pos.y);

        let max_value = 0;
        let max_x = this.pos.x;
        let max_y = this.pos.y;

        for (let y = Math.max(0, y0 - Params.VIEW_DISTANCE);
                 y <  Math.min(Params.MAP_SIZE, y0 + Params.VIEW_DISTANCE);
                 y++) {
            for (let x = Math.max(0, x0 - Params.VIEW_DISTANCE);
                     x < Math.min(Params.MAP_SIZE, x0 + Params.VIEW_DISTANCE);
                     x++) {
                const value = marker[x + y * Params.MAP_SIZE];
                if (value > max_value) {
                    max_value = value;
                    max_x = x;
                    max_y = y;
                }
            }
        }

        //if (max_x === this.pos.x && max_y === this.pos.y) return Vec2.ZERO;

        return new Vec2(max_x, max_y);

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
    }

    private find_max_in_circle(): Vec2 {
        const marker = this.has_food ? marker_A : marker_B;

        const x0 = trunc(this.pos.x);
        const y0 = trunc(this.pos.y);

        let max_value = 0;
        let max_x = x0;
        let max_y = y0;

        for (let i = 0; i < disc_size; i++) {
            const x = x0 + disc_dx[i];
            const y = y0 + disc_dy[i];
            
            if (0 <= x && x < Params.MAP_SIZE) {
                const value = marker[x + y * Params.MAP_SIZE];
                if ((value > max_value)) {
                    max_value = value;
                    max_x = x;
                    max_y = y;
                }
            }
        }


        //return new Vec2(max_x - x0, max_y - y0);

        return new Vec2(max_x, max_y);

        // if (max_value === 0) {
        //     this.aim = this.aim.plus(Vec2.random(0.1)).clamp_unit();
        //     return;
        // }

        // const adjust = new Vec2(max_x - x0, max_y - y0);

        // if (this.aim.dot(adjust) <= 0) {
        //     this.aim = this.aim.plus(Vec2.random(0.1)).clamp_unit();
        //     return;
        // }

        // this.aim = this.aim.plus((new Vec2(max_x - x0, max_y - y0)).normalized()).clamp_unit();
    }

    private move() {
        let new_pos = this.pos.plus(this.aim);

        if (new_pos.x < 50 && new_pos.y < 50) {
            this.has_food = false;
            this.potency = Params.MAX_POTENCY;
            //this.aim = this.aim.scale(-0.5);
        } else if (Params.MAP_SIZE - 50 < new_pos.x && Params.MAP_SIZE - 50 < new_pos.y) {
            this.has_food = true;
            this.potency = Params.MAX_POTENCY;
            this.desired_aim = this.aim.negative();
            new_pos = new_pos.minus(new Vec2(1, 1));
        }

        // hit left/right edges
        if (new_pos.x < 0 || Params.MAP_SIZE < new_pos.x) {
            this.desired_aim = new Vec2(-this.aim.x, this.aim.y);
            return;
        }

        // hit top/bottom edges
        if (new_pos.y < 0 || Params.MAP_SIZE < new_pos.y) {
            this.desired_aim = new Vec2(this.aim.x, -this.aim.y);
            return;
        }

        // hit wall
        const new_pos_int = new_pos.trunc();
        if (structures[new_pos_int.x + new_pos_int.y * Params.MAP_SIZE] & 1) {
            this.desired_aim = Vec2.ZERO;
            this.pos = this.pos.minus(this.aim);
            //marker_A[index_of(this.pos)] = 0;
            //marker_B[index_of(this.pos)] = 0;
            this.wall_count++;
            if (this.wall_count > 100) {
                this.pos = new Vec2(20, 20);
            }
            return;
        }

        this.pos = new_pos.apply(x => clamp(x, 0, Params.MAP_SIZE));
        this.wall_count = 0;
    }

    private drop_marker() {
        const marker = this.has_food ? marker_B : marker_A;
        const index = index_of(this.pos);
        //marker[index] = Math.max(marker[index], this.potency ? Params.MAX_MARKER : 0);
        marker[index] = Math.max(marker[index], trunc(this.potency));
    }

    private decay_potency() {
        if (this.potency === 0) {
            this.has_food = true;
            return;
        }

        this.potency = Math.max(0, this.potency - Params.POTENCY_DECAY);
    }
}




// utils ----------------------

function index_of(pos: Vec2): number {
    return trunc(pos.x) + trunc(pos.y) * Params.MAP_SIZE;
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
            Math.min(pos.x + inradius, Params.MAP_SIZE), 
            Math.min(pos.y + inradius, Params.MAP_SIZE)
        ),
        func
    );
}

function loop_clamped_circle(pos: Vec2, radius: number, func: Function): void {
    const sqr_radius = radius**2;
    for (let y = Math.max(0, trunc(pos.y) - radius);
             y <  Math.min(Params.MAP_SIZE, trunc(pos.y) + radius);
             y++) {
        for (let x = Math.max(0, trunc(pos.x) - radius);
                 x < Math.min(Params.MAP_SIZE, trunc(pos.x) + radius);
                 x++) {
            if ((pos.x - x)**2 + (pos.y - y)**2 < sqr_radius) {
                func(x, y);
            }
        }
    }
}
