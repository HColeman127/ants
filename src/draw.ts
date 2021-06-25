import Ant from './ant';
import Map from './map';
import {Params} from './params';
import {Material} from './types';
import Utils from './utils';
import Vec2 from './vector2D';

export default class DrawHelper {
    readonly canvas: HTMLCanvasElement;
    readonly ctx: CanvasRenderingContext2D;
    public img: ImageData;

    public brush: Brush;

    constructor(element_id: string) {
        this.canvas = document.getElementById(element_id) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.img = new ImageData(Params.MAP_WIDTH, Params.MAP_WIDTH);
        this.brush = new Brush(30, Material.none);

        this.init_canvas_settings();
        this.init_img_data();
        this.init_listeners();
    }

    init_canvas_settings() {
        this.canvas.width = Params.MAP_WIDTH;
        this.canvas.height = Params.MAP_HEIGHT;
        this.canvas.addEventListener('contextmenu', (event: WheelEvent) => event.preventDefault());
        this.canvas.addEventListener('wheel', (event: WheelEvent) => event.preventDefault());
    }

    init_img_data() {
        for (let i = 3; i < Params.IMAGE_ARRAY_SIZE; i+=4) {
            this.img.data[i] = 255;
        }
    }

    init_listeners() {
        this.canvas.addEventListener('wheel', (event: WheelEvent) => {
            this.brush.radius = Utils.clamp(this.brush.radius - Utils.sgn(event.deltaY), 0, 100);
        });
    }

    draw_markers(map: Map) {
        const data = this.img.data;
        for (let i = 0; i < Params.MAP_AREA; i++) {
            const j = 4 * i;
    
            if (map.structures[i] === Material.wall) {
                data[j]     = 100;
                data[j + 1] = 100;
                data[j + 2] = 100;
            } else if (map.structures[i] === Material.food) {
                data[j]     = 0;
                data[j + 1] = 0;
                data[j + 2] = 255;
            } else {
                data[j]     = map.marker_A[i];
                data[j + 1] = 0;
                data[j + 2] = map.marker_B[i];
            }
        }
        
        this.ctx.putImageData(this.img, 0, 0);
    
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(0, 0, 50, 50);
    }

    draw_ants(ants: Ant[]) {
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.beginPath();
    
        for (let i = 0; i < Params.COLONY_SIZE; i++) {
            const p = ants[i].pos;
            const dp = ants[i].aim.with_norm(1.5);
    
            this.ctx.moveTo(p.x - dp.x, p.y - dp.y);
            this.ctx.lineTo(p.x + dp.x, p.y + dp.y);
        }
    
        this.ctx.stroke();
    }
    
    draw_brush(pos: Vec2) {
        if (this.brush.material === Material.none) return;
        
        this.ctx.strokeStyle = '#999999';
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, this.brush.radius, 0, 2*Math.PI);
        this.ctx.stroke();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('brush: ' + {0: 'none', 1: 'wall', 2: 'food'}[this.brush.material], 10, Params.MAP_HEIGHT - 10);
    }
}

export class Brush {
    public radius: number;
    public material: Material;

    constructor(size: number, material: Material) {
        this.radius = size;
        this.material = material;

        this.init_listeners();
    }

    private init_listeners() {
        document.getElementById('button_none').addEventListener('click', () => this.material = Material.none);
        document.getElementById('button_wall').addEventListener('click', () => this.material = Material.wall);
        document.getElementById('button_food').addEventListener('click', () => this.material = Material.food);

        window.addEventListener('keydown', (event: KeyboardEvent) => {
            switch (event.key) {
                case '0':
                    this.material = Material.none;
                    break;
                case '1':
                    this.material = Material.wall;
                    break;
                case '2':
                    this.material = Material.food;
                    break;
            }
        });
    }
}