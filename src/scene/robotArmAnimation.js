function restoreRobotPose(item) {
  const { joints, basePose } = item
  if (!joints || !basePose) return
  if (joints.turntable) joints.turntable.rotation.y = basePose.turntableY
  if (joints.shoulder) joints.shoulder.rotation.z = basePose.shoulderZ
  if (joints.elbow) joints.elbow.rotation.z = basePose.elbowZ
  if (joints.wrist) joints.wrist.rotation.z = basePose.wristZ
  if (joints.gripperLeft) joints.gripperLeft.position.x = basePose.gripperLeftX
  if (joints.gripperRight) joints.gripperRight.position.x = basePose.gripperRightX
  if (joints.payload) joints.payload.position.y = basePose.payloadY
}

export function updateRobotArmAnimations(animatedItems, seconds, reducedMotion = false) {
  animatedItems.forEach((item) => {
    if (item.kind !== 'robot-arm') return
    if (reducedMotion || item.speed <= 0) {
      restoreRobotPose(item)
      return
    }

    const cycle = (seconds * item.speed + item.phase) % 1
    const reach = Math.sin(cycle * Math.PI * 2)
    const carrying = Math.max(0, reach)
    const { joints, basePose } = item
    if (joints.turntable) joints.turntable.rotation.y = basePose.turntableY + reach * .45
    if (joints.shoulder) joints.shoulder.rotation.z = basePose.shoulderZ - reach * .35
    if (joints.elbow) joints.elbow.rotation.z = basePose.elbowZ + reach * .55
    if (joints.wrist) joints.wrist.rotation.z = basePose.wristZ - reach * .25
    if (joints.gripperLeft) joints.gripperLeft.position.x = basePose.gripperLeftX + carrying * .025
    if (joints.gripperRight) joints.gripperRight.position.x = basePose.gripperRightX - carrying * .025
    if (joints.payload) joints.payload.position.y = basePose.payloadY + carrying * .22
  })
}
