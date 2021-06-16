import vec2 from "./vector2D.js";

const enum Params {
    COLONY_SIZE = 1000,
    MAP_SIZE = 500,
    MAP_AREA = MAP_SIZE * MAP_SIZE,
    IMAGE_ARRAY_SIZE = MAP_AREA * 4
}

const enum AntTraits {
    VIEW_DISTANCE = 20,         // half length of view square
    SPEED = 1,                  // pixels per frame
    MARKER_STRENGTH = 200,      // integer out of 255
    POTENCY_DECAY = 0.1         // percentage
}

const enum Brush {
    erase = 0,
    draw = 1,
    none
}


let canvas : HTMLCanvasElement;
let ctx : CanvasRenderingContext2D;

let is_playing: boolean = false;
let left_down: boolean = false;
let right_down: boolean = false;

let stroke_width: number = 10;
let active_brush_wall: Brush = Brush.none;




let ants: Ant[] = [];
let image_data: ImageData;

let marker_array_A: Uint8ClampedArray;
let marker_array_B: Uint8ClampedArray;

let structure_array: Uint8Array;


window.addEventListener("load", () => {
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    canvas.width = Params.MAP_SIZE;
    canvas.height = Params.MAP_SIZE;
    
    ctx = canvas.getContext("2d");
    

    marker_array_A = new Uint8ClampedArray(Params.MAP_AREA);
    marker_array_B = new Uint8ClampedArray(Params.MAP_AREA);
    image_data = new ImageData(Params.MAP_SIZE, Params.MAP_SIZE);
    for (let i = 0; i < Params.IMAGE_ARRAY_SIZE; i++) {
        image_data.data[i] = 255;
    }

    structure_array = new Uint8Array(Params.MAP_AREA);


    // initialize list of ant objects
    for (let i = 0; i < Params.COLONY_SIZE; i++) {
        ants.push(new Ant(new vec2(Params.MAP_SIZE / 2, Params.MAP_SIZE / 2), vec2.random()));
    }


    addMouseEvents();
    addButtonListeners();
});


function addButtonListeners() {
    const play_button = document.getElementById("play_button") as HTMLButtonElement;
    play_button.addEventListener("click", () => {
        is_playing = true;
        step();
    });

    const pause_button = document.getElementById("pause_button") as HTMLButtonElement;
    pause_button.addEventListener("click", () => {
        is_playing = false;
    });
}

function step() {
    draw_markers();
    fade_markers();
    update_ants();

    if (is_playing) {
        window.requestAnimationFrame(step);
    }
}

function draw_markers(): void {
    for (let i = 0; i < Params.MAP_AREA; i++) {
        const j = 4 * i;

        if (structure_array[i] & 1) {
            image_data.data[j]     = 100;
            image_data.data[j + 1] = 100;
            image_data.data[j + 2] = 100;
        } else {
            image_data.data[j]     = 255 - marker_array_B[i];
            image_data.data[j + 1] = 255 - marker_array_A[i];
            image_data.data[j + 2] = 255 - marker_array_A[i] - marker_array_B[i];
        }
    }
    ctx.putImageData(image_data, 0, 0);
}

function fade_markers(): void {
    for (let i = 0; i < Params.MAP_AREA; i++) {
        if (Math.random() < 0.007) {
            marker_array_A[i] = 0;
            marker_array_B[i] = 0;
        }
    }
}

function update_ants(): void {
    ctx.fillStyle = "#000000";
    for (let i = 0; i < Params.COLONY_SIZE; i++) {
        ants[i].update();
    }
}

function addMouseEvents() {
    canvas.oncontextmenu = (event: MouseEvent) => event.preventDefault();

    canvas.addEventListener("mousedown", (event: MouseEvent) => {
        const pos: vec2 = getMousePosition(event);

        switch (event.button) {
            case 0:
                active_brush_wall = Brush.draw;
                break;
            case 2:
                active_brush_wall = Brush.erase;
                break;
        }

        handleBrushWall(pos);

        drawBrush(pos);
    });

    canvas.addEventListener("mousemove", (event: MouseEvent) => {
        const pos = getMousePosition(event);

        switch (active_brush_wall) {
            case Brush.draw:
            case Brush.erase:
                handleBrushWall(pos);
                break;
        }

        drawBrush(pos);
    });

    canvas.addEventListener("mouseup", (event: MouseEvent) => {
        active_brush_wall = Brush.none;
    });

    canvas.addEventListener("wheel", (event: WheelEvent) => {
        event.preventDefault();

        stroke_width = event.deltaY > 0 ? Math.max(1, stroke_width - 1) : Math.min(100, stroke_width + 1);

        drawBrush(getMousePosition(event));
    });
}



function handleBrushWall(pos: vec2) {
    loopCircle(pos, stroke_width, (x: number, y: number) => {
        structure_array[x + y * Params.MAP_SIZE] = active_brush_wall;
    });
}




function drawBrush(pos: vec2) {
    draw_markers();
    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, stroke_width, 0, 2*Math.PI);
    ctx.stroke();
}



class Ant {
    public pos: vec2;
    public aim: vec2;
    public angle: number;

    public has_food: boolean;
    public potency: number;

    private move_vec: vec2;

    constructor(pos: vec2, aim: vec2) {
        this.pos = pos;
        this.aim = aim;
        this.has_food = false;
    }

    update() {
        this.find_direction();
        this.move();
        this.updateScent();
        this.drawBody();
    }

    updateScent() {
        this.markScent();
        this.decayScent();
    }

    wander() {
        this.aim = this.aim.plus(vec2.random(0.2)).normalized();
    }

    find_direction() {
        const desire = this.scan_for_max();

        if (desire == null) {
            this.wander();
            return;
        }

        //this.aim = vec2.sum(vec2.normalized(vec2.sum(this.aim, vec2.scale(0.1, desire))), vec2.rand(0.1));    
        this.aim = this.aim.plus(desire.scale(0.1)).normalized().plus(vec2.random(0.1));  
    }

    /*
    new_scan(): vec2 {
        const marker_array = this.has_food ? marker_array_A : marker_array_B;
        const int_x: number = Math.trunc(this.pos.x);
        const int_y: number = Math.trunc(this.pos.y);
        //const int_pos: vec2 = this.pos.trunc();

        let net_desire: vec2 = vec2.zero;

        for (let y = Math.max(int_y - AntTraits.VIEW_DISTANCE, 0);
                 y < Math.min(int_y + AntTraits.VIEW_DISTANCE, Params.MAP_SIZE);
                 y++) {
            for (let x = Math.max(int_x - AntTraits.VIEW_DISTANCE, 0);
                     x < Math.min(int_x + AntTraits.VIEW_DISTANCE, Params.MAP_SIZE);
                     x++) {
                const dir: vec2 = new vec2(x - int_x, y - int_y);
                if (this.aim.dot(dir) > 0) {
                    const value = marker_array[x + y * Params.MAP_SIZE] ** 2;
                    if (value != 0) {
                        net_desire = net_desire.plus(dir.scale(value));
                        //net_desire.x += value * dir.x;
                        //net_desire.y += value * dir.y;
                    }
                }
            }
        }

        if (net_desire.x == 0 && net_desire.y == 0) {
            return null;
        }

        return vec2.normalized(net_desire);
    }*/

    
    scan_for_max(): vec2 {
        const marker_array = this.has_food ? marker_array_A : marker_array_B;
        const int_x = Math.floor(this.pos.x);
        const int_y = Math.floor(this.pos.y);

        let max_val = 0;
        let max_x = 0;
        let max_y = 0;

        loopSquareClamped(this.pos.trunc(), AntTraits.VIEW_DISTANCE, (x: number, y: number) => {
            const value = marker_array[x + y * Params.MAP_SIZE];
            if (value != 0 && value > max_val) {
                max_val = value;
                max_x = x;
                max_y = y;
            }
        });

        /*
        for (let y = Math.max(int_y - AntTraits.VIEW_DISTANCE, 0);
                 y < Math.min(int_y + AntTraits.VIEW_DISTANCE, Params.MAP_SIZE) + 1;
                 y++) {
            for (let x = Math.max(int_x - AntTraits.VIEW_DISTANCE, 0);
                     x < Math.min(int_x + AntTraits.VIEW_DISTANCE, Params.MAP_SIZE) + 1;
                     x++) {
                const value = marker_array[x + y * Params.MAP_SIZE];
                if (value != 0 && value > max_val) {
                    max_val = value;
                    max_x = x;
                    max_y = y;
                }
            }
        }*/

        
        if (max_val == 0 || (max_x == int_x && max_y == int_y)) {
            return null;
        }

        return (new vec2(max_x - int_x, max_y - int_y)).normalized();
    }

    move() {
        let new_pos = this.pos.plus(this.aim);

        if (new_pos.x < 50 && new_pos.y < 50) {
            this.has_food = false;
            this.potency = 255;
        } else if (Params.MAP_SIZE - 50 < new_pos.x && Params.MAP_SIZE - 50 < new_pos.y) {
            this.has_food = true;
            this.potency = 255;
        }

        if (new_pos.x < 0 || Params.MAP_SIZE < new_pos.x) {
            this.aim.x = -this.aim.x;
            new_pos = this.pos;
        }
        if (new_pos.y < 0 || Params.MAP_SIZE < new_pos.y) {
            this.aim.y = -this.aim.y;
            new_pos = this.pos;
        }

        const new_pos_int = {x: Math.floor(new_pos.x), y: Math.floor(new_pos.y)};
        if (structure_array[new_pos_int.x + new_pos_int.y * Params.MAP_SIZE] & 1) {
            this.aim = this.aim.negative();
            new_pos = this.pos;
        }

        this.pos = new_pos.apply(x => clamp(x, 0, Params.MAP_SIZE));
    }

    /*
    setAngle(angle: number) {
        this.angle = angle;
        this.move_vec = {
            x: AntTraits.SPEED * Math.cos(this.angle),
            y: AntTraits.SPEED * Math.sin(this.angle)
        }
    }*/

    markScent() {
        (this.has_food ? marker_array_B : marker_array_A)[index_from_position(this.pos)] = Math.floor(this.potency);
    }

    decayScent() {
        this.potency -= AntTraits.POTENCY_DECAY;
    }

    drawBody() {
        //ctx.fillStyle = this.has_food ? "#0000ff" : "#000000";
        ctx.fillRect(this.pos.x-1, this.pos.y-1, 2, 2);
    }
}




// utils ---------------------------

function index_from_position(pos: vec2): number {
    return Math.floor(pos.x) + Math.floor(pos.y) * Params.MAP_SIZE;
}

function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}

function rand(scale: number = 1): number {
    return scale * 2 * (Math.random() - 0.5);
}

function getMousePosition(event: MouseEvent): vec2 {
    const rect = canvas.getBoundingClientRect();

    return new vec2(event.clientX - rect.left, event.clientY - rect.top);
}

function loopRect(pos_bot: vec2, pos_top: vec2, func: Function): void {
    for (let y = pos_bot.y; y < pos_top.y; y++) {
        for (let x = pos_bot.x; x < pos_top.x; x++) {
            func(x, y);
        }
    }
}

function loopSquareClamped(pos: vec2, inradius: number, func: Function): void {
    loopRect(
        new vec2(
            Math.max(pos.x - inradius, 0), 
            Math.max(pos.y - inradius, 0)
        ),
        new vec2(
            Math.min(pos.x + inradius, Params.MAP_SIZE), 
            Math.min(pos.y + inradius, Params.MAP_SIZE)
        ),
        func
    );
}

function loopCircle(pos: vec2, radius: number, func: Function): void {
    loopSquareClamped(pos, radius, (x: number, y: number) => {
        if (pos.dist_to(new vec2(x, y)) < radius) {
            func(x, y);
        }
    })
}

