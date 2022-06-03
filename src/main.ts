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
  Utils.removeNodes([radialMenu, radialComponents])
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
  let configToDuplicate = radials[index].config
  insertRadialInMenu(index + 1, configToDuplicate)
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

  updateRadialMenuLayout()

  return radial
}

function insertRadialInMenu(index: number, config: RadialConfig): Radial {
  const radial: Radial = createRadial('Radial ' + (index + 1), config)
  radials.splice(index, 0, radial)

  radialMenu.insertChild(index, radial.node)
  radialComponents.insertChild(index, radial.componentSetNode)

  updateRadialMenuLayout()

  return radial
}

function updateRadialInMenu(index: number, newConfig: RadialConfig): Radial {
  const newRadial: Radial = createRadial('Radial ' + (index + 1), newConfig)
  try {
    copyRadialVisuals(radials[index], newRadial)
    Utils.removeNodes([radials[index].node, radials[index].componentSetNode])
  } 
  catch (e) {
    console.warn('Error deleting node:' + JSON.stringify(e))
    figma.notify('Recreating radial...')
  }
  finally {
    radials.splice(index, 1, newRadial)

    radialMenu.insertChild(index, newRadial.node)
    radialComponents.insertChild(index, newRadial.componentSetNode)

    updateRadialMenuLayout()

    return newRadial
  }
}

function removeRadialInMenu(index: number): void {
  try {
    Utils.removeNodes([radials[index].node, radials[index].componentSetNode])
  } 
  catch (e) {
    console.warn('Error deleting node:' + JSON.stringify(e))
  }
  finally {
    radials.splice(index, 1)
    updateRadialMenuLayout()
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

  const radialContainer = figma.createFrame()
  radialContainer.name = name
  radialContainer.fills = []
  radialContainer.clipsContent = false
  radialContainer.resize(size, size)

  const center = size / 2
  
  const ellipse: EllipseNode = createArc(config)
  radialContainer.appendChild(ellipse)
  ellipse.x = ellipse.y = 0

  // const refSegmentVector: VectorNode = figma.flatten([arc])
  
  const arc = figma.flatten([ellipse])
  console.log('Flatten 1')
  radialContainer.appendChild(arc)

  const gapRect1 = figma.createRectangle()
  radialContainer.appendChild(gapRect1)
  gapRect1.x = gapRect1.y = center
  gapRect1.resize((config.size / 2) + 10, config.gap / 2 > 0 ? config.gap / 2 : 0.01)

  const gapRect2 = gapRect1.clone()
  radialContainer.appendChild(gapRect2)
  const angleOffset = Utils.arcAngle(config.size / 2, config.gap / 2)
  Utils.rotateAroundRelativePoint(gapRect2, {x: center, y: center}, perSegmentSweep - angleOffset)

  let arcGroup = figma.group([gapRect1, gapRect2, arc], radialContainer)

  let arcFrame = figma.createFrame()
  arcFrame.clipsContent = false
  radialContainer.appendChild(arcFrame)
  arcFrame.fills = []
  arcFrame.x = arcGroup.x
  arcFrame.y = arcGroup.y
  arcFrame.resizeWithoutConstraints(arc.width, arc.height)
  arcFrame.appendChild(arcGroup)  
  arcGroup.x = arcGroup.y = 0
  let delta = arc.x
  arcGroup.x -= delta
  arcFrame.x += delta
  
  let subtract = figma.createBooleanOperation()
  subtract.name = 'Subtract'
  subtract.booleanOperation = 'SUBTRACT'
  arcFrame.appendChild(subtract)
  for (let child of arcGroup.children) {
    subtract.appendChild(child)
  }
  const arcWithGap: VectorNode = figma.flatten([subtract], arcFrame)
  arcWithGap.resize(arcFrame.width, arcWithGap.height)

  const segmentComponents = createSegmentComponentSet(arcFrame, config)
  segmentComponents.name = name + ' Segment'
  segmentComponents.x = radialContainer.x - segmentComponents.width - 200
  segmentComponents.y = radialContainer.y

  const segmentInstance = segmentComponents.defaultVariant.createInstance()
  segmentInstance.x = arcFrame.x
  segmentInstance.y = arcFrame.y

  const segmentInstances: InstanceNode[] = []
  segmentInstances.push(segmentInstance)
  for (let i = 1; i < config.numSegments; i++) {
    let newSegmentInstance = segmentInstance.clone()
    segmentInstances.push(newSegmentInstance)
  }

  for (let i = 0; i < config.numSegments; i++) {
    segmentInstances[i].name = 'Segment ' + (i + 1)
    radialContainer.appendChild(segmentInstances[i])
    Utils.rotateAroundRelativePoint(segmentInstances[i], {x: center, y: center}, config.rotation + (perSegmentSweep * i))
  }

  Utils.removeNodes([arcFrame])

  return {
    node: radialContainer,
    config: config,
    componentSetNode: segmentComponents
  }
  
}

function createSegmentComponentSet(arcFrame: FrameNode, config: RadialConfig) {
  let width = arcFrame.width ? arcFrame.width : 0.01 // must be >= 0.01 else Figma throws an error
  let height = arcFrame.height ? arcFrame.height : 0.01 // must be >= 0.01 else Figma throws an error

  const unfocusedSegment = arcFrame.children[0] as VectorNode

  const unfocusedComponent = figma.createComponent()
  unfocusedComponent.name = 'Focused=No'
  unfocusedComponent.resize(width, height)
  unfocusedComponent.x = unfocusedSegment.x + 2000
  unfocusedComponent.appendChild(unfocusedSegment)

  const focusedSegment = unfocusedSegment.clone()
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

  const componentSet = figma.combineAsVariants([unfocusedComponent, focusedComponent], figma.currentPage)
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
  const perArcSweep = config.sweep / config.numSegments

  const ellipse = figma.createEllipse()
  ellipse.resize(config.size, config.size)

  ellipse.fills = [{
    type: 'SOLID',
    color: convertHexColorToRgbColor('d9d9d9') as RGB
  }]

  ellipse.strokeWeight = config.gap
  ellipse.strokeAlign = 'CENTER'

  ellipse.arcData = {
    startingAngle: 0,
    endingAngle: Utils.degreesToRadians(perArcSweep),
    innerRadius: config.innerOffset
  }

  return ellipse
}

function updateRadialMenuLayout() {
  if (!radialMenu.removed) {
    resizeMenu()
    centerRadialsInMenu()
    repositionRadialFrames()
  }
}

function copyRadialVisuals(from: Radial, to: Radial) {
  try {
    for (let i in to.componentSetNode.children) {
      let toSegment = (to.componentSetNode.children[i] as ComponentNode).children[0] as VectorNode
      let fromSegment = (from.componentSetNode.children[i] as ComponentNode).children[0] as VectorNode
      toSegment.fills = fromSegment.fills
      toSegment.effects = fromSegment.effects
      toSegment.strokes = fromSegment.strokes
      // toSegment.strokeWeight = fromSegment.strokeWeight *** config value overrides this ***
      toSegment.strokeJoin = fromSegment.strokeJoin
      toSegment.strokeAlign = fromSegment.strokeAlign
      toSegment.dashPattern = fromSegment.dashPattern
      // toSegment.strokeGeometry = fromSegment.strokeGeometry *** cannot be copied ***
      toSegment.strokeCap = fromSegment.strokeCap
      toSegment.strokeMiterLimit = fromSegment.strokeMiterLimit
    }
  }
  catch (e) {
    console.warn('Error while copying visuals: ' + JSON.stringify(e))
  }
}