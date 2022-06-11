import { emit, on, showUI } from "@create-figma-plugin/utilities"
import { Event } from "./events"
import { Radial } from "./models/radial"
import { RadialConfig } from "./models/radial_config"
import { RadialManager } from "./radial_manager"
import { Utils } from "./utils"

let radialMenu: FrameNode

let radialComponents: FrameNode

const radials: Radial[] = []

const radialManager = new RadialManager()

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
  const radial = radialManager.createRadial()
  // createRadialMenu()
  // const radial = addRadial(DEFAULT_CONFIG)
  // figma.viewport.scrollAndZoomIntoView([radialMenu])
  emit(Event.RADIAL_ADDED, { config: radial.config })
}

function onDuplicateRadialRequested(index: number) {
  radialManager.duplicateRadial(index)
}

function onRadialUpdated(index: number, newConfig: RadialConfig) {
  radialManager.updateRadial(index, newConfig)
  // replaceRadial(index, newConfig)
  // figma.viewport.scrollAndZoomIntoView([radialMenu])
}

function onRadialRemoved(index: number) {
  radialManager.removeRadial(index)
  // removeRadial(index)
  // if (radials.length === 0) deleteRadialMenu()
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

      // Blend-related properties
      toSegment.opacity = fromSegment.opacity
      toSegment.blendMode = fromSegment.blendMode
      toSegment.isMask = fromSegment.isMask
      toSegment.effects = fromSegment.effects
      toSegment.effectStyleId = fromSegment.effectStyleId

      // Corner-related properties
      toSegment.cornerRadius = fromSegment.cornerRadius
      toSegment.cornerSmoothing = fromSegment.cornerSmoothing

      // Geometry-related properties
      toSegment.fills = fromSegment.fills
      toSegment.fillStyleId = fromSegment.fillStyleId
      // toSegment.fillGeometry = fromSegment.fillGeometry *** cannot be copied ***

      toSegment.strokes = fromSegment.strokes
      toSegment.strokeStyleId = fromSegment.strokeStyleId
      toSegment.strokeWeight = fromSegment.strokeWeight
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