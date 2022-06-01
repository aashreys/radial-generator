import { convertHexColorToRgbColor, emit, on, showUI } from "@create-figma-plugin/utilities"
import { Event } from "./events"
import { Radial } from "./models/radial"
import { RadialConfig } from "./models/radial_config"
import { Utils } from "./utils"

const radials: Radial[] = []

const DEFAULT_RADIAL_CONFIG: RadialConfig = {
  size: 800,
  numSegments: 6,
  sweep: 360,
  rotation: 0,
  innerOffset: 0.5,
  gap: 12
}

export default function () {
  showUI({ width: 240, height: 480 })
}

on(Event.RADIAL_REQUESTED, onRadialRequested)

on(Event.RADIAL_UPDATED, (data) => onRadialUpdated(data.index, data.newConfig))

on(Event.RADIAL_REMOVED, (data) => onRadialRemoved(data.index))

function onRadialRequested() {
  const radial: Radial = createDefaultRadial()
  radials.push(radial)
  emit(Event.RADIAL_ADDED, { config: radial.config })
}

function onRadialUpdated(index: number, newConfig: RadialConfig) {
  deleteRadial(radials[index])
  let newRadial = createRadial('Radial ' + (index + 1), newConfig)
  radials.splice(index, 0, newRadial)
}

function onRadialRemoved(index: number) {
  console.log('onRadialRemoved: ' + index)
}

function deleteRadial(radial: Radial) {
  radial.node.remove()
  radial.componentSetNode.remove()
  radials.splice(radials.indexOf(radial), 1)
}

function createDefaultRadial(): Radial {
  return createRadial('Default Radial', DEFAULT_RADIAL_CONFIG)
}

function createRadial(name: string, config: RadialConfig): Radial {
  const size = config.size
  const perSegmentSweep = config.sweep / config.numSegments

  let container = figma.createFrame()
  // Utils.centerInViewport(container)
  container.name = name
  container.fills = []
  container.clipsContent = false
  container.resize(size, size)

  let radialCenter: Vector = {
    x: size / 2,
    y: size / 2
  }
  
  let refSegment = createArc(config)
  refSegment.x = refSegment.y = 0
  container.appendChild(refSegment)
  
  let refSegmentVector = figma.flatten([refSegment])
  let refPosition: Vector = {
    x: refSegmentVector.x,
    y: refSegmentVector.y
  }

  const segmentComponents = createSegmentComponentSet(name + ' Segment', refSegmentVector)
  segmentComponents.x = container.x - segmentComponents.width - 200
  segmentComponents.y = container.y
  refSegmentVector.remove()

  let segmentInstance = segmentComponents.defaultVariant.createInstance()
  segmentInstance.name = 'Segment 1'
  container.appendChild(segmentInstance)
  segmentInstance.x = refPosition.x
  segmentInstance.y = refPosition.y

  for (let i = 1; i < config.numSegments; i++) {
    let newSegmentInstance = segmentInstance.clone()
    newSegmentInstance.name = 'Segment ' + (i + 1)
    container.appendChild(newSegmentInstance)
    let rotation = (perSegmentSweep * i)
    Utils.rotateAroundRelativePoint(newSegmentInstance, radialCenter, rotation)
  }

  return {
    node: container,
    config: config,
    componentSetNode: segmentComponents
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

