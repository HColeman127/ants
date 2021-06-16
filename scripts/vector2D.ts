export default class vec2 {
    // static fields
    static readonly zero = new vec2(0, 0);

    // instance fields
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    
    // instance methods

    // unary operators

    is_zero(): boolean {
        return (this.x == 0 && this.y == 0);
    }

    apply(func: (x: number) => number): vec2 {
        return new vec2(func(this.x), func(this.y));
    }

    negative(): vec2 {
        return new vec2(-this.x, -this.y);
    }

    scale(scalar: number): vec2 {
        return new vec2(scalar * this.x, scalar * this.y);
    }

    trunc(): vec2 {
        return new vec2(Math.floor(this.x), Math.floor(this.y));
    }
    
    norm(): number {
        return Math.sqrt(this.x**2 + this.y**2);
    }

    normalized(): vec2 {
        const inv_norm = 1 / this.norm()
        //return new vec2(inv_norm * this.x, inv_norm * this.y);
        return this.scale(1 / this.norm());
    }

    // binary operators

    plus(v: vec2): vec2 {
        return new vec2(this.x + v.x, this.y + v.y);
    }

    minus(v: vec2): vec2 {
        return new vec2(this.x - v.x, this.y - v.y);
    }

    dot(v: vec2): number {
        return (this.x * v.x) + (this.y * v.y);
    }

    dist_to(v: vec2): number {
        return Math.sqrt((this.x - v.x)**2 + (this.y - v.y)**2);
    }
    

    // static methods

    static random(scalar: number = 1): vec2 {
        return new vec2(scalar * (2 * Math.random() - 1), scalar * (2 * Math.random() - 1));
    }
    
    /*
    static rotate(vec: vec2, angle: number): {x: number, y:number} {
        const cos_angle = Math.cos(angle);
        const sin_angle = Math.sin(angle);
    
        return {
            x: vec.x*cos_angle - vec.y*sin_angle,
            y: vec.x*sin_angle + vec.y*cos_angle
        };
    }*/
}



