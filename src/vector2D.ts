export default class Vec2 {
    // static fields
    static readonly ZEROS = new Vec2(0, 0);
    static readonly ONES = new Vec2(1, 1);
    static readonly Ex = new Vec2(1, 0);
    static readonly Ey = new Vec2(0, 1);

    // instance fields
    readonly x: number;
    readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    // computed properties

    get norm(): number {
        return Math.sqrt(this.x**2 + this.y**2);
    }
    
    get normalized(): Vec2 {
        return this.scaled(1 / Math.sqrt(this.x**2 + this.y**2));
    }

    /* get negated(): Vec2 {
        return new Vec2(-this.x, -this.y);
    } */

    /* get arg(): number {
        return Math.atan2(this.y, this.x);
    }

    get angle2pi(): number {
        const ang = this.arg;
        return (ang >= 0 ? ang : 2*Math.PI + ang);
    } */

    /* get is_zero(): boolean {
        return (this.x === 0 && this.y === 0);
    } */

    // instance methods

    // unary operators

    /* copy(): Vec2 {
        return new Vec2(this.x, this.y);
    } */

    /* apply(fn: (x: number) => number): Vec2 {
        return new Vec2(fn(this.x), fn(this.y));
    } */

    

    scaled(scalar: number): Vec2 {
        return new Vec2(scalar * this.x, scalar * this.y);
    }

    scaled_to(scalar: number): Vec2 {
        return this.scaled(scalar / Math.sqrt(this.x**2 + this.y**2));
    }

    trunc(): Vec2 {
        return new Vec2(Math.trunc(this.x), Math.trunc(this.y));
    }
    
    /* sqr_norm(): number {
        return this.x**2 + this.y**2;
    } */

    clamp_norm(max: number = 1): Vec2 {
        const sqr_norm: number = this.x**2 + this.y**2;
        return (sqr_norm <= max**2) ? this : this.scaled(max / Math.sqrt(sqr_norm));
    }

    /* orth(): Vec2 {
        return new Vec2(-this.y, this.x);
    } */

    /* nudge(scalar: number = 1): Vec2 {
        return this.plus(Vec2.rand_vec(scalar));
    } */

    // binary operators

    /* equals(v: Vec2): boolean {
        return (this.x === v.x && this.y === v.y);
    } */

    plus(v: Vec2): Vec2 {
        return new Vec2(this.x + v.x, this.y + v.y);
    }

    minus(v: Vec2): Vec2 {
        return new Vec2(this.x - v.x, this.y - v.y);
    }

    dot(v: Vec2): number {
        return (this.x * v.x) + (this.y * v.y);
    }

    /* cross(v: Vec2): number {
        return (this.x * v.y) - (this.y * v.x);
    } */

    /* sqr_dist(v: Vec2): number {
        return (this.x - v.x)**2 + (this.y - v.y)**2;
    } */

    /* dist(v: Vec2): number {
        return Math.sqrt((this.x - v.x)**2 + (this.y - v.y)**2);
    } */
    
    

    // static methods

    static rand(scalar: number = 1): Vec2 {
        return new Vec2(scalar * (2 * Math.random() - 1), scalar * (2 * Math.random() - 1));
    }

    /* static polar(r: number, theta: number): Vec2 {
        return new Vec2(r * Math.cos(theta), r * Math.sin(theta));
    } */
}



