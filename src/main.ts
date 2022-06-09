import { emit, on, showUI } from "@create-figma-plugin/utilities"
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
  gap: 10
}

export default function () { showUI({ width: 240, height: 480 }) }

on(Event.RADIAL_REQUESTED, onRadialRequested)

on(Event.DUPLICATE_RADIAL_REQUESTED, (data) => onDuplicateRadialRequested(data.index))

on(Event.RADIAL_UPDATED, (data) => onRadialUpdated(data.index, data.newConfig))

on(Event.RADIAL_REMOVED, (data) => onRadialRemoved(data.index))

function createRadialMenu() {
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

function deleteRadialMenu() {
  Utils.removeNodes(radialMenu, radialComponents)
}

function repositionRadialComponents() {
  radialComponents.x = radialMenu.x + radialMenu.width + 200
  radialComponents.y = radialMenu.y
}

function onRadialRequested() {
  createRadialMenu()
  const radial = addRadial(DEFAULT_CONFIG)
  figma.viewport.scrollAndZoomIntoView([radialMenu])
  emit(Event.RADIAL_ADDED, { config: radial.config })
}

function onDuplicateRadialRequested(index: number) {
  let configToDuplicate = radials[index].config
  insertRadial(index + 1, configToDuplicate)
}

function onRadialUpdated(index: number, newConfig: RadialConfig) {
  replaceRadial(index, newConfig)
  figma.viewport.scrollAndZoomIntoView([radialMenu])
}

function onRadialRemoved(index: number) {
  removeRadial(index)
  if (radials.length === 0) deleteRadialMenu()
}

function addRadial(config: RadialConfig): Radial {
  const radial: Radial = createRadial('Radial ' + (radials.length + 1), config)
  radials.push(radial)
  
  radialMenu.appendChild(radial.node)
  radialComponents.appendChild(radial.componentSetNode)

  updateRadialMenuLayout()

  return radial
}

function insertRadial(index: number, config: RadialConfig): Radial {
  const radial: Radial = createRadial('Radial ' + (index + 1), config)
  radials.splice(index, 0, radial)

  radialMenu.insertChild(index, radial.node)
  radialComponents.insertChild(index, radial.componentSetNode)

  updateRadialMenuLayout()

  return radial
}

function replaceRadial(index: number, newConfig: RadialConfig): Radial {
  const newRadial: Radial = createRadial('Radial ' + (index + 1), newConfig)
  try {
    copyRadialVisuals(radials[index], newRadial)
    Utils.removeNodes(radials[index].node, radials[index].componentSetNode)
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

function removeRadial(index: number): void {
  try {
    Utils.removeNodes(radials[index].node, radials[index].componentSetNode)
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
  let largestSize = ensureMinDimension()
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
  const size = ensureMinDimension(config.size)
  const gap = config.gap > size ? size : config.gap // gap cannot exceed radial size
  const perSegmentSweep = config.sweep / config.numSegments
  const centerXY = config.size / 2

  const radialContainer = figma.createFrame()
  radialContainer.name = name
  radialContainer.fills = []
  radialContainer.clipsContent = false
  radialContainer.resize(size, size)

  const gapAngle = Utils.arcAngle(size / 2, gap) / 2
  const startAngle = gapAngle
  const endAngle = (gapAngle * 2) < perSegmentSweep ? perSegmentSweep - gapAngle : gapAngle

  const ellipse: EllipseNode = createArcEllipse(size, startAngle, endAngle, config.innerOffset, 'd9d9d9')  

  radialContainer.appendChild(ellipse)
  ellipse.x = ellipse.y = 0

  const arc = figma.flatten([ellipse])
  radialContainer.appendChild(arc)

  const segmentComponents = createRadialComponents(arc)
  segmentComponents.name = name + ' Segment'
  segmentComponents.x = radialContainer.x - segmentComponents.width - 200
  segmentComponents.y = radialContainer.y

  const segmentInstance = segmentComponents.defaultVariant.createInstance()
  segmentInstance.x = arc.x
  segmentInstance.y = arc.y

  const segmentInstances: InstanceNode[] = []
  segmentInstances.push(segmentInstance)
  for (let i = 1; i < config.numSegments; i++) {
    let newSegmentInstance = segmentInstance.clone()
    segmentInstances.push(newSegmentInstance)
  }

  for (let i = 0; i < config.numSegments; i++) {
    segmentInstances[i].name = 'Segment ' + (i + 1)
    radialContainer.appendChild(segmentInstances[i])
    Utils.rotateAroundRelativePoint(segmentInstances[i], {x: centerXY, y: centerXY}, config.rotation + ((perSegmentSweep) * i))
  }

  Utils.removeNodes(arc)

  return {
    node: radialContainer,
    config: config,
    componentSetNode: segmentComponents
  }
  
}

function createRadialComponents(arc: VectorNode): ComponentSetNode {
  let width = ensureMinDimension(arc.width)
  let height = ensureMinDimension(arc.height)

  const unfocusedSegment = arc.clone()

  const unfocusedComponent = figma.createComponent()
  unfocusedComponent.name = 'Focused=No'
  unfocusedComponent.resize(width, height)
  unfocusedComponent.x = unfocusedSegment.x + 2000
  unfocusedComponent.appendChild(unfocusedSegment)
  unfocusedSegment.x = unfocusedSegment.y = 0

  const focusedSegment = unfocusedSegment.clone()
  Utils.setSolidFill('ffffff', focusedSegment)

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

function createArcEllipse(
  size: number, 
  startingAngle: number, 
  endingAngle: number,
  offset: number, 
  hex?: string): EllipseNode {
  const ellipse = figma.createEllipse()
  ellipse.resize(size, size)

  ellipse.arcData = {
    startingAngle: Utils.degreesToRadians(startingAngle),
    endingAngle: Utils.degreesToRadians(endingAngle),
    innerRadius: offset
  }

  if (hex) Utils.setSolidFill(hex, ellipse)

  return ellipse
}

function updateRadialMenuLayout() {
  if (!radialMenu.removed) {
    resizeMenu()
    centerRadialsInMenu()
    repositionRadialComponents()
  }
}

function copyRadialVisuals(from: Radial, to: Radial) {
  try {
    for (let i in to.componentSetNode.children) {
      let toSegment = (to.componentSetNode.children[i] as ComponentNode).children[0] as VectorNode
      let fromSegment = (from.componentSetNode.children[i] as ComponentNode).children[0] as VectorNode

      let j = 0
      // Blend-related properties
      toSegment.opacity = fromSegment.opacity
      console.log(j++)
      toSegment.blendMode = fromSegment.blendMode
      console.log(j++)
      toSegment.isMask = fromSegment.isMask
      console.log(j++)
      toSegment.effects = fromSegment.effects
      console.log(j++)
      toSegment.effectStyleId = fromSegment.effectStyleId
      console.log(j++)

      // Corner-related properties
      toSegment.cornerRadius = fromSegment.cornerRadius
      console.log(j++)
      toSegment.cornerSmoothing = fromSegment.cornerSmoothing
      console.log(j++)

      // Geometry-related properties
      toSegment.fills = fromSegment.fills
      console.log(j++)
      toSegment.fillStyleId = fromSegment.fillStyleId
      console.log(j++)
      // toSegment.fillGeometry = fromSegment.fillGeometry *** cannot be copied ***

      toSegment.strokes = fromSegment.strokes
      console.log(j++)
      toSegment.strokeStyleId = fromSegment.strokeStyleId
      console.log(j++)
      toSegment.strokeWeight = fromSegment.strokeWeight
      console.log(j++)
      toSegment.strokeJoin = fromSegment.strokeJoin
      console.log(j++)
      toSegment.strokeAlign = fromSegment.strokeAlign
      console.log(j++)
      toSegment.dashPattern = fromSegment.dashPattern
      console.log(j++)
      // toSegment.strokeGeometry = fromSegment.strokeGeometry *** cannot be copied ***
      toSegment.strokeCap = fromSegment.strokeCap
      console.log(j++)
      toSegment.strokeMiterLimit = fromSegment.strokeMiterLimit
      console.log(j++)
    }
  }
  catch (e) {
    console.warn('Error while copying visuals: ' + JSON.stringify(e))
  }
}

function ensureMinDimension(currentDimension?: number) {
  const minDimension = 0.01 // minimum size allowed by Figma for width and height
  if (currentDimension) {
    return currentDimension >= minDimension ? currentDimension : minDimension
  } else {
    return minDimension
  }
}