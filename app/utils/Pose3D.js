import {
  FilesetResolver,
  PoseLandmarker
} from "@mediapipe/tasks-vision"

let landmarker = null

export async function initPose3D(){

  const vision =
  await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  )

  landmarker =
  await PoseLandmarker.createFromOptions(
    vision,
    {
      baseOptions:{
        modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task"
      },
      runningMode:"VIDEO"
    }
  )
}

export function getPose3D(video){

  if(!landmarker) return null
  if(video.readyState < 2) return null

  const now = performance.now()

  const result =
  landmarker.detectForVideo(video, now)

  if(!result.landmarks.length)
    return null

  return {
    world: result.worldLandmarks[0],
    image: result.landmarks[0]
  }
}