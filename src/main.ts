export default function () {
  const width = 400
  const height = 400
  const numSections = 6
  const sweep = (2 * Math.PI) / numSections

  let frame1 = figma.createFrame()
  frame1.resize(width, height)
  frame1.fills = []

  for (let i = 0; i < numSections; i++) {
    frame1.appendChild(createArc(width, height, sweep * i, sweep, 0.2))
  }
  
  figma.closePlugin()
}

function createArc(
  width: number, 
  height: number, 
  startAngle: number, 
  sweep: number, 
  innerRadius: number): EllipseNode {
  const arcData: ArcData = {
    startingAngle: startAngle,
    endingAngle: startAngle + sweep,
    innerRadius: innerRadius
  }
  const ellipse = figma.createEllipse()

  ellipse.strokes = [
    {
      type: 'SOLID',
      color: {r: 1, g: 1, b: 1}
    }
  ]
  ellipse.strokeWeight = 4
  ellipse.strokeAlign = 'CENTER'

  ellipse.resize(width, height)
  ellipse.arcData = arcData
  return ellipse
}