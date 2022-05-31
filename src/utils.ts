export class Utils {

  static degreesToRadians(degrees: number) {
    return degrees * (Math.PI / 180)
  }
  
  static radiansToDegrees(radians: number) {
    return radians * (180 / Math.PI);
  }

  static rotateAroundPoint(node: any, point: Vector, angle: number) {
    let radian = -1 * angle * (Math.PI / 180)
    let newx = Math.cos(radian) * node.x + node.y * Math.sin(radian) - point.y * Math.sin(radian) - point.x * Math.cos(radian) + point.x
    let newy = - Math.sin(radian) * node.x + point.x * Math.sin(radian) + node.y * Math.cos(radian) - point.y * Math.cos(radian) + point.y
    node.relativeTransform = [[Math.cos(radian), Math.sin(radian), newx],
    [-Math.sin(radian), Math.cos(radian), newy ]]
  }

}