export function angle(a,b,c){

    const ab = [a.x-b.x, a.y-b.y]
    const cb = [c.x-b.x, c.y-b.y]

    const dot = ab[0]*cb[0] + ab[1]*cb[1]

    const magAB = Math.sqrt(ab[0]**2+ab[1]**2)
    const magCB = Math.sqrt(cb[0]**2+cb[1]**2)

    const cos = dot/(magAB*magCB)

    return Math.acos(cos)*(180/Math.PI)
}
