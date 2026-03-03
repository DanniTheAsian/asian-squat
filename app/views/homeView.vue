<script setup>

import { ref, onMounted } from "vue"

import { initPose3D, getPose3D }
from "~/utils/Pose3D"

import { isAsianSquat3D, squatScore3D }
from "~/utils/asian3D"

const asian = ref(false)
const video = ref(null)
const canvas = ref(null)
const score = ref(0)
let ctx

const skeleton = [
[11,13],[13,15],
[12,14],[14,16],
[11,12],
[11,23],[12,24],
[23,24],
[23,25],[25,27],
[24,26],[26,28]
]

onMounted(async()=>{

  const stream =
  await navigator.mediaDevices.getUserMedia({video:true})

  video.value.srcObject = stream

  ctx = canvas.value.getContext("2d")
  ctx.strokeStyle = "hotpink"
  ctx.fillStyle   = "hotpink"
  ctx.lineWidth   = 6

  await initPose3D()

  // 🔥 Kun drawing på RAF
  requestAnimationFrame(drawLoop)

  // 🧠 Inference throttled (bedre CPU)
  setInterval(inferenceLoop, 60)
})

function draw(l){

  ctx.clearRect(0,0,640,480)

  l.forEach(p=>{

    const x = p.x * 640
    const y = p.y * 480

    ctx.beginPath()
    ctx.arc(x,y,6,0,2*Math.PI)
    ctx.fill()
  })

  skeleton.forEach(([a,b])=>{

    const p1 = l[a]
    const p2 = l[b]

    ctx.beginPath()
    ctx.moveTo(p1.x*640,p1.y*480)
    ctx.lineTo(p2.x*640,p2.y*480)
    ctx.stroke()
  })
}

let lastPose = null

function drawLoop(){

  if(lastPose){
    draw(lastPose.image)
  }

  requestAnimationFrame(drawLoop)
}

function inferenceLoop(){

  const pose = getPose3D(video.value)

  if(!pose || !pose.world) return

  lastPose = pose

  score.value = squatScore3D(pose.world)
  asian.value = isAsianSquat3D(pose.world)
}

</script>

<template>

<div class="wrapper">
<video
ref="video"
autoplay
playsinline
width="640"
height="480"
style="position:absolute"
/>

<canvas
ref="canvas"
width="640"
height="480"
style="position:absolute"
/>
</div>

<div class="text">
<p>
{{ asian
? "Asiat!"
: "Hmmm måske ikke......"
}}
</p>
<br>
<!--
<p>
Score: {{ score.toFixed(2) }}
</p>
-->
</div>
</template>
<style scoped>
.wrapper {
  display: flex;
  justify-content: center;
}

.text {
  display: flex;
  background: yellow;
  padding: 5px 15px;
  border-radius: 100px;
  margin-top: 30px;
  margin-bottom: auto;
  justify-content: center;
  z-index: 10;
  position: absolute;
  left: 50%;
}
</style>