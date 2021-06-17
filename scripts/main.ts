import Vec2 from './vector2D.js';

const enum Params {
    MAP_SIZE = 500,
    MAP_AREA = MAP_SIZE * MAP_SIZE,
    IMAGE_ARRAY_SIZE = MAP_AREA * 4,
    COLONY_SIZE = 500,
    MAX_MARKER = 2**16 - 1,
    MARKER_DECAY = 100,
}

const enum AntTraits {
    VIEW_DISTANCE = 20,         // half length of view square
    SPEED = 1,                  // pixels per frame
    MAX_POTENCY = 255,
    POTENCY_DECAY = 1 / (2**3) 
}

const enum Brush {
    erase = 0,
    draw = 1,
    none
}

type vectorArray = {x: Int8Array, y: Int8Array};


let canvas : HTMLCanvasElement;
let ctx : CanvasRenderingContext2D;

let is_playing: boolean = false;


let stroke_width: number = 40;
let active_brush_wall: Brush = Brush.none;
let mouse_pos: Vec2;




let ants: Ant[] = [];
let image_data: ImageData;

let marker_A: Uint8ClampedArray;
let marker_B: Uint8ClampedArray;

let structures: Uint8ClampedArray;


let vec_array_A: vectorArray;

let avg_fps: number = 0;
let fps_counter: HTMLElement;


window.addEventListener('load', () => {
    canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = Params.MAP_SIZE;
    canvas.height = Params.MAP_SIZE;
    
    ctx = canvas.getContext('2d');

    fps_counter = document.getElementById('fps');
    

    marker_A = new Uint8ClampedArray(Params.MAP_AREA);
    marker_B = new Uint8ClampedArray(Params.MAP_AREA);

    vec_array_A = {
        x: new Int8Array(Params.MAP_AREA),
        y: new Int8Array(Params.MAP_AREA)
    };

    image_data = new ImageData(Params.MAP_SIZE, Params.MAP_SIZE);
    for (let i = 3; i < Params.IMAGE_ARRAY_SIZE; i+=4) {
        image_data.data[i] = 255;
    }




    structures = new Uint8Array(Params.MAP_AREA);




    // initialize list of ant objects
    for (let i = 0; i < Params.COLONY_SIZE; i++) {
        ants.push(new Ant(new Vec2(20, 20), Vec2.random()));
    }


    addMouseEvents();
    addButtonListeners();
});

function addMouseEvents() {
    canvas.oncontextmenu = (event: MouseEvent) => event.preventDefault();

    canvas.addEventListener('mousedown', (event: MouseEvent) => {
        //mouse_pos = getMousePosition(event);

        switch (event.button) {
            case 0:
                active_brush_wall = Brush.draw;
                break;
            case 2:
                active_brush_wall = Brush.erase;
                break;
        }

        draw_frame();
    });

    window.addEventListener('mousemove', (event: MouseEvent) => {
        mouse_pos = getMousePosition(event);

        /*if (mouse_pos.x < 0 || Params.MAP_SIZE < mouse_pos.x 
            || mouse_pos.y < 0 
            || Params.MAP_SIZE < mouse_pos.y)
            active_brush_wall = Brush.none;
        */
        if (active_brush_wall === Brush.draw || active_brush_wall === Brush.erase) handleBrushWall();

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

function addButtonListeners() {
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
    
    const dt: number = performance.now() - t0;
    const fps: number = 1000 / dt;

    avg_fps = 0.05*fps + 0.95*avg_fps;
    //console.log(dt.toFixed(2) + 'ms \@ ' + fps.toFixed(2) + 'fps - avg ' + avg_fps.toFixed(0)); // backticks for format strings

    fps_counter.innerHTML = avg_fps.toFixed(0) + 'fps';
    

    //console.log(avg_fps.toFixed(2));

    if (is_playing) {
        window.requestAnimationFrame(step);
    }
}

function draw_frame() {
    draw_map();
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
            image_data.data[j + 1] = marker_B[i];
            image_data.data[j + 2] = 0;
        }
    }
    ctx.putImageData(image_data, 0, 0);

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 50, 50);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(Params.MAP_SIZE - 50, Params.MAP_SIZE - 50, 50, 50);
}

function decay_markers(): void {
    for (let i = 0; i < Params.MAP_AREA; i++) {
        if (Math.random() < 0.001) {
            marker_A[i] = 0;
            marker_B[i] = 0;
        }
        //marker_A[i] = Math.max(0, marker_A[i] - Params.MARKER_DECAY);
        //marker_B[i] = Math.max(0, marker_B[i] - Params.MARKER_DECAY);
    }
}

function update_ants(): void {
    for (let i = 0; i < Params.COLONY_SIZE; i++) {
        ants[i].update();
    }
}

function draw_ants(): void {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < Params.COLONY_SIZE; i++) {
        ctx.fillRect(ants[i].pos.x - 1, ants[i].pos.y - 1, 2, 2);
    }
}

function handleBrushWall() {
    loopCircle(mouse_pos, stroke_width, (x: number, y: number) => {
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

    private move_vec: Vec2;

    constructor(pos: Vec2, aim: Vec2) {
        this.pos = pos;
        this.aim = aim;
    }

    update() {
        this.update_aim();
        this.move();
        this.placeMarker();
        this.decayPotency();
    }

    private update_aim() {
        const adjust = this.to_max();
        if (this.aim.dot(adjust) > 0) this.aim = this.aim.plus(adjust.normalized().scale(0.1));
        this.aim = this.aim.plus(Vec2.random(0.1)).clamp_unit();
    }

    private to_max(): Vec2 {
        //if (Math.random() < 0.1) return Vec2.zero;

        const marker = this.has_food ? marker_A : marker_B;
        const int_x = trunc(this.pos.x);
        const int_y = trunc(this.pos.y);

        let max_val = 0;
        let max_x = int_x;
        let max_y = int_y;

        for (let y = Math.max(0, int_y - AntTraits.VIEW_DISTANCE);
                 y <  Math.min(Params.MAP_SIZE, int_y + AntTraits.VIEW_DISTANCE);
                 y++) {
            for (let x = Math.max(0, int_x - AntTraits.VIEW_DISTANCE);
                     x < Math.min(Params.MAP_SIZE, int_x + AntTraits.VIEW_DISTANCE);
                     x++) {
                const value = marker[x + y * Params.MAP_SIZE];
                if (value > max_val) {
                    max_val = value;
                    max_x = x;
                    max_y = y;
                }
            }
        }

        return new Vec2(max_x - int_x, max_y - int_y);
    }

    private move() {
        let new_pos = this.pos.plus(this.aim);

        if (new_pos.x < 50 && new_pos.y < 50) {
            this.has_food = false;
            this.potency = AntTraits.MAX_POTENCY;
            //this.aim = this.aim.scale(-0.5);
        } else if (Params.MAP_SIZE - 50 < new_pos.x && Params.MAP_SIZE - 50 < new_pos.y) {
            this.has_food = true;
            this.potency = AntTraits.MAX_POTENCY;
            //this.aim = this.aim.scale(-0.5);
        }

        // hit left/right edges
        if (new_pos.x < 0 || Params.MAP_SIZE < new_pos.x) {
            this.aim = new Vec2(0, this.aim.y);
            return;
        }

        // hit top/bottom edges
        if (new_pos.y < 0 || Params.MAP_SIZE < new_pos.y) {
            this.aim = new Vec2(this.aim.x, 0);
            return;
        }

        // hit wall
        const new_pos_int = new_pos.trunc();
        if (structures[new_pos_int.x + new_pos_int.y * Params.MAP_SIZE] & 1) {
            this.aim = Vec2.zero;
            //this.pos = new Vec2(20, 20);
            return;
        }

        this.pos = new_pos.apply(x => clamp(x, 0, Params.MAP_SIZE));
    }

    private placeMarker() {
        const marker = this.has_food ? marker_B : marker_A;
        const index = index_of(this.pos);
        //marker[index] = Math.max(marker[index], this.potency ? Params.MAX_MARKER : 0);
        marker[index] = Math.max(marker[index], trunc(this.potency));
    }

    private decayPotency() {
        if (this.potency === 0) {
            this.has_food = true;
            return;
        }

        this.potency = Math.max(0, this.potency - AntTraits.POTENCY_DECAY);
    }
}




// utils ---------------------------

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
    return val << 0;
}

function getMousePosition(event: MouseEvent): Vec2 {
    const rect = canvas.getBoundingClientRect();
    return new Vec2(event.clientX - rect.left, event.clientY - rect.top);
}

function loopRect(pos_bot: Vec2, pos_top: Vec2, func: Function): void {
    for (let y = pos_bot.y; y < pos_top.y; y++) {
        for (let x = pos_bot.x; x < pos_top.x; x++) {
            func(x, y);
        }
    }
}

function loopSquareClamped(pos: Vec2, inradius: number, func: Function): void {
    loopRect(
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

function loopCircle(pos: Vec2, radius: number, func: Function): void {
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
