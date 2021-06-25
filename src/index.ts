import Simulation from './map';
import {Material, MouseData} from './types';
import DrawHelper from './draw';


let p1: HTMLElement;
let sim: Simulation;
let dh: DrawHelper;
let mouse: MouseData;


// uhhh stuff?
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

    handle_brush();
    for (let i = 0; i < iters_per_frame; i++) {
        sim.decay_markers();
        sim.update_ants();
    }
    draw_frame();

    log_time(t0);

    window.requestAnimationFrame(step);
}

function log_time(t0: number) {
    const dt = (performance.now() - t0);

    avg_dt = 0.95*avg_dt + 0.05*dt;
    p1.innerHTML = avg_dt.toFixed(2) + 'ms';
}

function draw_frame() {
    dh.draw_markers(sim);
    dh.draw_ants(sim.ants);
    dh.draw_brush(mouse.pos);
}

function handle_brush() {
    if (dh.brush.material === Material.none) return;

    if (mouse.is_left_down) {
        sim.apply_brush(mouse.pos, dh.brush.radius, dh.brush.material);
        return;
    }
    
    if (mouse.is_right_down) sim.apply_brush(mouse.pos, dh.brush.radius, 0);
}
