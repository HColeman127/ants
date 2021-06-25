import Simulation from './simulation';
import {Material} from './utils';
import DrawHelper from './draw';
import Vec2 from './vector2D';



let p1: HTMLElement;
let sim: Simulation;
let dh: DrawHelper;
let mouse: MouseData;

let avg_dt: number = 0;
let iters_per_frame: number = 0;


window.addEventListener('load', () => {
    p1 = document.getElementById('p1');
    sim = new Simulation();
    dh = new DrawHelper('canvas');
    mouse = new MouseData(dh.canvas);

    add_button_listeners();

    step();
});

function add_button_listeners() {
    document.getElementById('button_play').addEventListener('click', () => iters_per_frame++);
    document.getElementById('button_pause').addEventListener('click', () => iters_per_frame = 0);
}

function step() {
    const t0 = performance.now();

    for (let i = 0; i < iters_per_frame; i++) {
        sim.update();
    }
    dh.draw_frame(sim);

    if (dh.brush.material !== Material.none) {
        dh.draw_brush(mouse.pos);

        if (mouse.is_left_down) {
            sim.apply_brush(mouse.pos, dh.brush.radius, dh.brush.material);
        } else if (mouse.is_right_down) {
            sim.apply_brush(mouse.pos, dh.brush.radius, 0);
        }
    }

    avg_dt = 0.95*avg_dt + 0.05*(performance.now() - t0);
    p1.innerHTML = avg_dt.toFixed(2) + 'ms';

    window.requestAnimationFrame(step);
}

class MouseData {
    private element: HTMLElement;

    public pos: Vec2;
    public is_left_down: boolean;
    public is_right_down: boolean;

    constructor(element: HTMLElement) {
        this.element = element;

        this.pos = Vec2.ZEROS;
        this.is_left_down = false;
        this.is_right_down = false;

        this.add_listeners();
    }

    private add_listeners() {
        this.element.addEventListener('mousedown', (event: MouseEvent) => {
            this.is_left_down ||= (event.button === 0);
            this.is_right_down ||= (event.button === 2);
        });
    
        window.addEventListener('mousemove', (event: MouseEvent) => {
            const rect = this.element.getBoundingClientRect();
            this.pos = new Vec2(event.clientX - rect.left, event.clientY - rect.top);
        });
    
        window.addEventListener('mouseup', (event: MouseEvent) => {
            this.is_left_down &&= !(event.button === 0);
            this.is_right_down &&= !(event.button === 2);
        });
    }
}