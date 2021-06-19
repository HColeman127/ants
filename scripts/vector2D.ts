export default class Vec2 {
    // static fields
    static readonly ZERO = new Vec2(0, 0);
    static readonly ONE = new Vec2(1, 1);
    static readonly Ex = new Vec2(1, 0);
    static readonly Ey = new Vec2(0, 1);

    // instance fields
    readonly x: number;
    readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    
    // instance methods

    // unary operators

    copy(): Vec2 {
        return new Vec2(this.x, this.y);
    }

    is_zero(): boolean {
        return (this.x === 0 && this.y === 0);
    }

    apply(func: (x: number) => number): Vec2 {
        return new Vec2(func(this.x), func(this.y));
    }

    negative(): Vec2 {
        return new Vec2(-this.x, -this.y);
    }

    scale(scalar: number): Vec2 {
        return new Vec2(scalar * this.x, scalar * this.y);
    }

    trunc(): Vec2 {
        return new Vec2(this.x << 0, this.y << 0);
    }
    
    sqr_norm(): number {
        return this.x**2 + this.y**2;
    }

    norm(): number {
        return Math.sqrt(this.x**2 + this.y**2);
    }

    normalized(): Vec2 {
        return this.scale(1 / this.norm());
    }

    clamp_unit(): Vec2 {
        const sqr_norm: number = this.x**2 + this.y**2;
        return (sqr_norm <= 1) ? this : this.scale(1 / Math.sqrt(sqr_norm));
    }

    clamp_norm(max: number = 1): Vec2 {
        const sqr_norm: number = this.x**2 + this.y**2;
        return (sqr_norm <= max**2) ? this : this.scale(max / Math.sqrt(sqr_norm));
    }

    orth(): Vec2 {
        return new Vec2(-this.y, this.x);
    }

    angle(): number {
        return Math.atan2(this.y, this.x);
    }

    angle2pi(): number {
        const ang = this.angle();
        return (ang >= 0 ? ang : 2*Math.PI + ang);
    }

    // binary operators

    plus(v: Vec2): Vec2 {
        return new Vec2(this.x + v.x, this.y + v.y);
    }

    minus(v: Vec2): Vec2 {
        return new Vec2(this.x - v.x, this.y - v.y);
    }

    dot(v: Vec2): number {
        return (this.x * v.x) + (this.y * v.y);
    }

    cross(v: Vec2): number {
        return (this.x * v.y) - (this.y * v.x);
    }

    sqr_dist(v: Vec2): number {
        return (this.x - v.x)**2 + (this.y - v.y)**2;
    }

    dist(v: Vec2): number {
        return Math.sqrt((this.x - v.x)**2 + (this.y - v.y)**2);
    }
    

    // static methods

    static random(scalar: number = 1): Vec2 {
        return new Vec2(scalar * (2 * Math.random() - 1), scalar * (2 * Math.random() - 1));
    }

    static polar(r: number, theta: number): Vec2 {
        return new Vec2(r * Math.cos(theta), r * Math.sin(theta));
    }
}



