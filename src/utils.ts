export class Utils {

  static degreesToRadians(degrees: number) {
    return degrees * (Math.PI / 180)
  }
  
  static radiansToDegrees(radians: number) {
    return radians * (180 / Math.PI);
  }

  static rotateAroundRelativePoint(node: any, point: Vector, angle: number) {
    let radian = -1 * angle * (Math.PI / 180)
    let newx = Math.cos(radian) * node.x + node.y * Math.sin(radian) - point.y * Math.sin(radian) - point.x * Math.cos(radian) + point.x
    let newy = - Math.sin(radian) * node.x + point.x * Math.sin(radian) + node.y * Math.cos(radian) - point.y * Math.cos(radian) + point.y
    node.relativeTransform = [[Math.cos(radian), Math.sin(radian), newx],
    [-Math.sin(radian), Math.cos(radian), newy ]]
  }

  static centerInViewport(node: SceneNode) {
    node.x = Math.round(figma.viewport.bounds.x + (figma.viewport.bounds.width / 2) - (node.width / 2))
    node.y = Math.round(figma.viewport.bounds.y + (figma.viewport.bounds.height / 2) - (node.height / 2))
  }

  static centerInParent(nodes: SceneNode[]) {
    
  }

  static removeNodes(nodes: SceneNode[]) {
    for (let node of nodes) {
      if (node && !node.removed) node.remove()
    }
  }

  static angleOfArc(radius: number, distance: number): number {
    // let height = Math.sqrt(Math.pow(radius, 2) - (Math.pow(distance, 2) / 4))
    let sine = (distance / 2) / radius
    let radians = Math.asin(sine)
    let degrees = Utils.degreesToRadians(radians)
    return degrees
  }

}