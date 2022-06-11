import { emit, on, showUI } from "@create-figma-plugin/utilities"
import { Event } from "./events"
import { RadialConfig } from "./models/radial_config"
import { RadialManager } from "./radial_manager"

const radialManager = new RadialManager()

export default function () { showUI({ width: 240, height: 480 }) }

on(Event.RADIAL_REQUESTED, onRadialRequested)

on(Event.DUPLICATE_RADIAL_REQUESTED, (data) => onDuplicateRadialRequested(data.index))

on(Event.RADIAL_UPDATED, (data) => onRadialUpdated(data.index, data.newConfig))

on(Event.RADIAL_REMOVED, (data) => onRadialRemoved(data.index))


function onRadialRequested() {
  const radial = radialManager.createRadial()
  emit(Event.RADIAL_ADDED, { config: radial.config })
}

function onDuplicateRadialRequested(index: number) {
  radialManager.duplicateRadial(index)
}

function onRadialUpdated(index: number, newConfig: RadialConfig) {
  radialManager.updateRadial(index, newConfig)
}

function onRadialRemoved(index: number) {
  radialManager.removeRadial(index)
}