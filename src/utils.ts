import { convertHexColorToRgbColor } from "@create-figma-plugin/utilities";

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
    this.centerAtPoint(node, {x: figma.viewport.bounds.x + (figma.viewport.bounds.width / 2), y: figma.viewport.bounds.y + (figma.viewport.bounds.height / 2)})
  }

  static centerAtPoint(node: SceneNode, point: Vector) {
    node.x = point.x - (node.width / 2)
    node.y = point.y - (node.height / 2)
  }

  static removeNodes(...nodes: SceneNode[]) {
    for (let node of nodes) {
      if (node && !node.removed) node.remove()
    }
  }
  
  /**
   * Calculates the angle of an arc on a circle given the distance between 
   * the arc's points. The calulations are derived from sin(theta) calculations 
   * for an isoceles triangle which is what the arc makes on the circle.
   * 
   * https://www.cuemath.com/trigonometry/trigonometry-formula/
   *
   * @static 
   * @param {number} radius radius of the circle
   * @param {number} distance distance between the points of the arc
   * @return {number} angle made at the center of the circle
   * @memberof Utils
   */
  static arcAngle(radius: number, distance: number): number {
    let sine = (distance / 2) / radius
    let halfAngle = Utils.radiansToDegrees(Math.asin(sine))
    return (halfAngle * 2)
  }

  /**
   * Calcuates the distance between two points of an arc on a circle given the 
   * angle of the arc. The calulations are derived from sin(theta) calculations 
   * for an isoceles triangle which is what the arc makes on the circle.
   * 
   * https://www.cuemath.com/trigonometry/trigonometry-formula/
   *
   * @static
   * @param {number} radius radius of the circle
   * @param {number} angle angle of the arc
   * @return {number} distance between the points of the arc
   * @memberof Utils
   */
  static arcDistance(radius: number, angle: number): number {
    const radians = Utils.degreesToRadians(angle / 2)
    return 2 * (Math.sin(radians) * radius)
  }

  static setSolidFill(hex: string, ...nodes: any[]) {
    for (let node of nodes) {
      node.fills = [{
        type: 'SOLID',
        color: convertHexColorToRgbColor(hex) as RGB
      }]
    }
  }

}