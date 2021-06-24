import Vec2 from './vector2D';
import {Params} from './params';

export default class Utils {
    static get_mouse_pos(event: MouseEvent, element: HTMLElement): Vec2 {
        const rect = element.getBoundingClientRect();
        return new Vec2(event.clientX - rect.left, event.clientY - rect.top);
    }

    static index_of(pos: Vec2): number {
        return Utils.trunc(pos.x) + Utils.trunc(pos.y) * Params.MAP_WIDTH;
    }
    
    static clamp(num: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, num));
    }

    static sign(num: number): number {
        if (num > 0) return 1;
        if (num < 0) return -1;
        return 0;
    }
    
    static rand(scale: number = 1): number {
        return scale * 2 * (Math.random() - 0.5);
    }
    
    static trunc(num: number): number {
        return num | 0;
    }
    
    static loop_clamped_circle(pos: Vec2, radius: number, fn: (x: number, y: number) => void) {
        const square_radius = radius**2;
        for (let y = Math.max(0, Utils.trunc(pos.y) - radius);
                 y <  Math.min(Params.MAP_HEIGHT, Utils.trunc(pos.y) + radius);
                 y++) {
            for (let x = Math.max(0, Utils.trunc(pos.x) - radius);
                     x < Math.min(Params.MAP_WIDTH, Utils.trunc(pos.x) + radius);
                     x++) {
                if ((pos.x - x)**2 + (pos.y - y)**2 < square_radius) {
                    fn(x, y);
                }
            }
        }
    }
}

