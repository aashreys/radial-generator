import { convertHexColorToRgbColor, emit, on, once, showUI } from "@create-figma-plugin/utilities"
import { Events } from "./events"
import { Radial } from "./models/radial"
import { RadialConfig } from "./models/radial_config"
import { Utils } from "./utils"

const DEFAULT_RADIAL_CONFIG: RadialConfig = {
  size: 800,
  numSegments: 6,
  sweep: 360,
  rotation: 0,
  innerOffset: 0.5,
  gap: 12
}

export default function () {
  const options = { width: 240, height: 600}
  const data = { defaultConfig: DEFAULT_RADIAL_CONFIG }
  showUI(options, data)
  
  // figma.closePlugin()
}

on(Events.RADIAL_REQUESTED, () => {
  const radial: Radial = createDefaultRadial()
  emit(Events.NEW_RADIAL, { radial: radial })
})

function createDefaultRadial(): Radial {
  return createRadial('Default Radial', DEFAULT_RADIAL_CONFIG)
}

function createRadial(name: string, config: RadialConfig): Radial {
  const size = config.size
  const perSegmentSweep = config.sweep / config.numSegments

  let radial = figma.createFrame()
  radial.name = name
  radial.fills = []
  radial.clipsContent = false
  radial.resize(size, size)

  let radialCenter: Vector = {
    x: radial.x + radial.width / 2,
    y: radial.y + radial.height / 2
  }
  
  let refSegment = createArc(config)
  radial.appendChild(refSegment)
  
  let refSegmentVector = figma.flatten([refSegment])
  let refPosition: Vector = {
    x: refSegmentVector.x,
    y: refSegmentVector.y
  }

  const segmentComponents = createSegmentComponentSet(name + ' Segment', refSegmentVector)
  refSegmentVector.remove()

  let segmentInstance = segmentComponents.defaultVariant.createInstance()
  segmentInstance.name = 'Segment 1'
  radial.appendChild(segmentInstance)
  segmentInstance.x = refPosition.x
  segmentInstance.y = refPosition.y

  for (let i = 1; i < config.numSegments; i++) {
    let newSegmentInstance = segmentInstance.clone()
    newSegmentInstance.name = 'Segment ' + (i + 1)
    radial.appendChild(newSegmentInstance)
    let rotation = (perSegmentSweep * i)
    Utils.rotateAroundPoint(newSegmentInstance, radialCenter, rotation)
  }

  return {
    nodeId: radial.id,
    config: config,
    componentSetNodeId: segmentComponents.id
  }
  
}

function createSegmentComponentSet(name: string, refArc: VectorNode) {
  const unfocusedSegment = refArc.clone()

  const unfocusedComponent = figma.createComponent()
  unfocusedComponent.name = 'Focused=No'
  unfocusedComponent.resize(unfocusedSegment.width, unfocusedSegment.height)
  unfocusedComponent.x = unfocusedSegment.x + 2000
  unfocusedComponent.appendChild(unfocusedSegment)
  unfocusedSegment.x = unfocusedSegment.y = 0

  const focusedSegment = refArc.clone()
  focusedSegment.fills = [{
    type: 'SOLID',
    color: convertHexColorToRgbColor('ffffff') as RGB
  }]

  const focusedComponent = figma.createComponent()
  focusedComponent.name = 'Focused=Yes'
  focusedComponent.resize(focusedSegment.width, focusedSegment.height)
  focusedComponent.x = unfocusedComponent.x
  focusedComponent.y = unfocusedComponent.y + unfocusedComponent.height + 100
  focusedComponent.appendChild(focusedSegment)
  focusedSegment.x = focusedSegment.y = 0

  const componentSet = figma.combineAsVariants([unfocusedComponent, focusedComponent], figma.currentPage)
  componentSet.name = name
  componentSet.layoutMode = 'VERTICAL'
  componentSet.primaryAxisSizingMode = 'AUTO'
  componentSet.counterAxisSizingMode = 'AUTO'
  componentSet.itemSpacing = 48
  componentSet.verticalPadding = componentSet.horizontalPadding = 48

  unfocusedComponent.reactions = [
    {
      action: {
        type: 'NODE',
        destinationId: focusedComponent.id,
        navigation: 'CHANGE_TO',
        transition: {
          type: 'SMART_ANIMATE',
          easing: { type: 'EASE_OUT' },
          duration: 0.3 // 300ms
        },
        preserveScrollPosition: false
      },
      trigger: {
        type: 'ON_HOVER'
      }
    }
  ]

  return componentSet
}

function createArc(config: RadialConfig): EllipseNode {
  const startAngle = config.rotation
  const perArcSweep = config.sweep / config.numSegments

  const ellipse = figma.createEllipse()
  ellipse.resize(config.size, config.size)

  ellipse.fills = [{
    type: 'SOLID',
    color: convertHexColorToRgbColor('d9d9d9') as RGB
  }]

  ellipse.strokes = [
    {
      type: 'SOLID',
      color: {r: 1, g: 1, b: 1}
    }
  ]
  ellipse.strokeWeight = config.gap
  ellipse.strokeAlign = 'CENTER'

  ellipse.arcData = {
    startingAngle: Utils.degreesToRadians(startAngle),
    endingAngle: Utils.degreesToRadians(startAngle + perArcSweep),
    innerRadius: config.innerOffset
  }

  return ellipse
}

