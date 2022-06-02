import { convertHexColorToRgbColor, emit, on, showUI } from "@create-figma-plugin/utilities"
import { Event } from "./events"
import { Radial } from "./models/radial"
import { RadialConfig } from "./models/radial_config"
import { Utils } from "./utils"

let radialMenu: FrameNode

let radialComponents: FrameNode

const radials: Radial[] = []

const DEFAULT_CONFIG: RadialConfig = {
  size: 640,
  numSegments: 6,
  sweep: 360,
  rotation: 0,
  innerOffset: 0.5,
  gap: 8
}

export default function () { showUI({ width: 240, height: 480 }) }

on(Event.RADIAL_REQUESTED, onRadialRequested)

on(Event.RADIAL_DUPLICATE_REQUESTED, (data) => onRadialDuplicateRequested(data.index))

on(Event.RADIAL_UPDATED, (data) => onRadialUpdated(data.index, data.newConfig))

on(Event.RADIAL_REMOVED, (data) => onRadialRemoved(data.index))

function createRadialFrames() {
  if (!radialMenu || radialMenu.removed) {
    radialMenu = figma.createFrame()
    radialMenu.name = 'Radial Menu'
    radialMenu.fills = []
    radialMenu.clipsContent = false
  }

  if (!radialComponents || radialComponents.removed) {
    radialComponents = figma.createFrame()
    radialComponents.name = 'Radial Components'
    radialComponents.fills = []

    radialComponents.layoutMode = 'HORIZONTAL'
    radialComponents.primaryAxisSizingMode = 'AUTO'
    radialComponents.counterAxisSizingMode = 'AUTO'
    radialComponents.itemSpacing = 48
  }
}

function deleteRadialFrames() {
  radialMenu?.remove()
  radialComponents?.remove()
}

function repositionRadialFrames() {
  radialComponents.x = radialMenu.x + radialMenu.width + 200
  radialComponents.y = radialMenu.y
}

function onRadialRequested() {
  createRadialFrames()
  const radial = addRadialToMenu(DEFAULT_CONFIG)
  figma.viewport.scrollAndZoomIntoView([radialMenu])
  emit(Event.RADIAL_ADDED, { config: radial.config })
}

function onRadialDuplicateRequested(index: number) {

}

function onRadialUpdated(index: number, newConfig: RadialConfig) {
  updateRadialInMenu(index, newConfig)
  figma.viewport.scrollAndZoomIntoView([radialMenu])
}

function onRadialRemoved(index: number) {
  removeRadialInMenu(index)
  if (radials.length === 0) deleteRadialFrames()
}

function addRadialToMenu(config: RadialConfig): Radial {
  const radial: Radial = createRadial('Radial ' + (radials.length + 1), config)
  radials.push(radial)
  
  radialMenu.appendChild(radial.node)
  radialComponents.appendChild(radial.componentSetNode)

  resizeMenu()
  centerRadialsInMenu()
  repositionRadialFrames()

  return radial
}

function updateRadialInMenu(index: number, newConfig: RadialConfig): Radial {
  const newRadial: Radial = createRadial('Radial ' + (index + 1), newConfig)
  try {
    copyRadialVisuals(radials[index], newRadial)
    radials[index].node?.remove()
    radials[index].componentSetNode?.remove()
  } 
  catch (e) {
    console.warn('Error deleting node:' + JSON.stringify(e))
    figma.notify('Recreating radial...')
  }
  finally {
    radials.splice(index, 1, newRadial)

    radialMenu.insertChild(index, newRadial.node)
    radialComponents.insertChild(index, newRadial.componentSetNode)

    resizeMenu()
    centerRadialsInMenu()
    repositionRadialFrames()

    return newRadial
  }
}

function removeRadialInMenu(index: number): void {
  try {
    radials[index].node?.remove()
    radials[index].componentSetNode?.remove()
  } 
  catch (e) {
    console.warn('Error deleting node:' + JSON.stringify(e))
  }
  finally {
    radials.splice(index, 1)
    resizeMenu()
    centerRadialsInMenu()
    repositionRadialFrames()
  }
}

function resizeMenu() {
  let center: Vector = {
    x: radialMenu.x + radialMenu.width / 2,
    y: radialMenu.y + radialMenu.height / 2
  }
  let largestSize = 0.01
  for (let radial of radials) {
    largestSize = radial.config.size > largestSize ? radial.config.size : largestSize
  }
  radialMenu.resize(largestSize, largestSize)

  let newCenter: Vector = {
    x: radialMenu.x + largestSize / 2,
    y: radialMenu.y + largestSize / 2
  }

  radialMenu.x += - newCenter.x + center.x
  radialMenu.y += - newCenter.y + center.y
}

function centerRadialsInMenu() {
  for (let radial of radials) {
    radial.node.x = radial.node.y = 0
    radial.node.x = (radialMenu.width - radial.config.size) / 2
    radial.node.y = (radialMenu.height - radial.config.size) / 2
  }
}

function createRadial(name: string, config: RadialConfig): Radial {
  const size = config.size
  const perSegmentSweep = config.sweep / config.numSegments

  let container = figma.createFrame()
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
  let width = refArc.width ? refArc.width : 0.01
  let height = refArc.height ? refArc.height : 0.01

  const unfocusedSegment = refArc.clone()

  const unfocusedComponent = figma.createComponent()
  unfocusedComponent.name = 'Focused=No'
  unfocusedComponent.resize(width, height)
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
  focusedComponent.resize(width, height)
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

function copyRadialVisuals(from: Radial, to: Radial) {
  try {
    for (let i in to.componentSetNode.children) {
      let toSegment = (to.componentSetNode.children[i] as ComponentNode).children[0] as VectorNode
      let fromSegment = (from.componentSetNode.children[i] as ComponentNode).children[0] as VectorNode
      toSegment.fills = fromSegment.fills
      toSegment.effects = fromSegment.effects
      toSegment.strokes = fromSegment.strokes
      // toSegment.strokeWeight = fromSegment.strokeWeight // config value overrides this
      toSegment.strokeJoin = fromSegment.strokeJoin
      toSegment.strokeAlign = fromSegment.strokeAlign
      toSegment.dashPattern = fromSegment.dashPattern
      // toSegment.strokeGeometry = fromSegment.strokeGeometry // cannot be copied
      toSegment.strokeCap = fromSegment.strokeCap
      toSegment.strokeMiterLimit = fromSegment.strokeMiterLimit
    }
  }
  catch (e) {
    console.warn('Error while copying visuals: ' + JSON.stringify(e))
  }
}