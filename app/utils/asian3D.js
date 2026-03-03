export {}

let asianCounter = 0


function angle(a,b,c){
  const ab = [a.x-b.x, a.y-b.y, a.z-b.z]
  const cb = [c.x-b.x, c.y-b.y, c.z-b.z]

  const dot = ab[0]*cb[0] + ab[1]*cb[1] + ab[2]*cb[2]
  const magAB = Math.sqrt(ab[0]**2+ab[1]**2+ab[2]**2)
  const magCB = Math.sqrt(cb[0]**2+cb[1]**2+cb[2]**2)

  const denom = magAB*magCB
  if(denom === 0) return 180

  const cos = Math.max(-1, Math.min(1, dot/denom))
  return Math.acos(cos) * (180/Math.PI)
}

function dist2D(a,b){
  const dx = a.x-b.x
  const dy = a.y-b.y
  return Math.sqrt(dx*dx + dy*dy)
}

function vis(p){ return (p?.visibility ?? 0) }



function sideScore(l, side){

  const idx = side === "L"
    ? { shoulder:11, hip:23, knee:25, ankle:27, heel:29, toe:31 }
    : { shoulder:12, hip:24, knee:26, ankle:28, heel:30, toe:32 }

  const sh = l[idx.shoulder]
  const hip = l[idx.hip]
  const knee = l[idx.knee]
  const ankle = l[idx.ankle]
  const heel = l[idx.heel]
  const toe = l[idx.toe]

  const ok =
    vis(sh) > 0.6 &&
    vis(hip) > 0.6 &&
    vis(knee) > 0.6 &&
    vis(ankle) > 0.6 &&
    vis(heel) > 0.6 &&
    vis(toe) > 0.6

  if(!ok) return null

  const kneeAngle  = angle(hip, knee, ankle)
  const hipAngle   = angle(sh, hip, knee)
  const ankleAngle = angle(knee, ankle, toe)

  const thigh = dist2D(hip, knee)
  const depthNorm = thigh > 0
    ? (hip.y - knee.y) / thigh
    : 0

  const shin = dist2D(knee, ankle)
  const compactNorm = shin > 0
    ? dist2D(hip, heel) / shin
    : 999

  const kScore = 1 - Math.min(Math.abs(kneeAngle - 55)/55, 1)
  const hScore = 1 - Math.min(Math.abs(hipAngle - 70)/70, 1)
  const aScore = 1 - Math.min(Math.abs(ankleAngle - 80)/80, 1)
  const dScore = Math.min(depthNorm / 0.35, 1)
  const cScore = 1 - Math.min((compactNorm - 0.7) / (1.35-0.7), 1)

  const score =
    0.25*kScore +
    0.20*hScore +
    0.20*aScore +
    0.20*dScore +
    0.15*cScore

  return {
    score,
    kneeAngle,
    hipAngle,
    ankleAngle,
    depthNorm,
    compactNorm,
    side
  }
}



function bothSides(l){
  const L = sideScore(l,"L")
  const R = sideScore(l,"R")
  if(!L || !R) return null
  return { L, R }
}

function bestSide(l){
  const sides = bothSides(l)
  if(!sides) return null
  return (sides.L.score >= sides.R.score)
    ? sides.L
    : sides.R
}


function isAsianSquat3D(l){

  const sides = bothSides(l)

  if(!sides){
    asianCounter = 0
    return false
  }

  const { L, R } = sides


  const hipDistance2D = dist2D(l[23], l[24])
  const isSideView = hipDistance2D < 0.08   // justér 0.06–0.10 hvis nødvendigt

  let poseOk = false

  if(isSideView){

    // Vælg mest synlige side
    const leftVis =
      vis(l[23]) + vis(l[25]) + vis(l[27])

    const rightVis =
      vis(l[24]) + vis(l[26]) + vis(l[28])

    const mainSide = leftVis > rightVis ? L : R

    if(!mainSide){
      asianCounter = 0
      return false
    }

    const hipOk = mainSide.hipAngle < 75
    const kneeOk = mainSide.kneeAngle < 80
    const depthOk = mainSide.depthNorm > 0.20
    const compactOk = mainSide.compactNorm < 1.25

    poseOk =
      hipOk &&
      kneeOk &&
      depthOk &&
      compactOk
  }

  // =================================================
  // FRONT VIEW
  // =================================================
  else {

    const hipOk =
      L.hipAngle < 80 &&
      R.hipAngle < 80

    const kneeOk =
      L.kneeAngle < 85 &&
      R.kneeAngle < 85

    const kneeForward =
      (l[25].x > l[27].x) &&
      (l[26].x < l[28].x)

    const hipOverFoot =
      Math.abs(l[23].x - l[27].x) < 0.12 &&
      Math.abs(l[24].x - l[28].x) < 0.12

    const torsoAngleL = angle(l[11], l[23], l[25])
    const torsoAngleR = angle(l[12], l[24], l[26])

    const torsoOk =
      torsoAngleL < 100 &&
      torsoAngleR < 100

    const symmetric =
      Math.abs(L.kneeAngle - R.kneeAngle) < 20 &&
      Math.abs(L.hipAngle  - R.hipAngle)  < 20

    const depthOk =
      L.depthNorm > 0.15 &&
      R.depthNorm > 0.15

    const compactOk =
      L.compactNorm < 1.40 &&
      R.compactNorm < 1.40

    poseOk =
      hipOk &&
      kneeOk &&
      kneeForward &&
      hipOverFoot &&
      torsoOk &&
      symmetric &&
      depthOk &&
      compactOk
  }

  asianCounter = poseOk ? asianCounter + 1 : 0

  return asianCounter > 3
}

function squatScore3D(l){
  const s = bestSide(l)
  if(!s) return 0
  return s.score
}

export {
  squatScore3D,
  isAsianSquat3D,
  bestSide
}