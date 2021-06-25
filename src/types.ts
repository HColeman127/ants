import Vec2 from './vector2D';

export type ViewData = {
    pts: Vec2[],
    size: number,
    dx: Int8Array,
    dy: Int8Array,
    di: Uint32Array;
} 

export const enum Material {
    none = 0,
    wall = 1,
    food = 2
}

export class MouseData {
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