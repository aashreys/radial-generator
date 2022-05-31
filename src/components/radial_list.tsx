import { IconButton, Text } from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useState } from 'preact/hooks'
import { Events } from "../events";
import { PlusIcon } from "../icons/icon_plus";
import { Radial } from "../models/radial";
import { RadialConfig } from "../models/radial_config";
import { RadialItem } from "./radial_item";

const DEFAULT_RADIAL_CONFIG: RadialConfig = {
  size: 800,
  numSegments: 6,
  sweep: 360,
  rotation: 0,
  innerOffset: 0.5,
  gap: 12
}

function AddRadial(props: any) {

  return(
    <div style='
    display: flex; 
    margin-left: 
    var(--space-extra-small); 
    margin-bottom: 2px; 
    align-items: center'>

      <Text bold style={'flex-grow: 1'}>
        Radial
      </Text>

      <IconButton onClick={props.onAddRadialClicked} value={false} >
        <PlusIcon />
      </IconButton>

    </div>  
  )

}

export function RadialList(props: any) {

  const [radials, setRadials] = useState<Radial[]>([])

  function onAddRadialClicked() {
    emit(Events.RADIAL_REQUESTED)
  }

  function addRadial(radial: Radial) {
    let newRadials = radials.slice()
    newRadials.push(radial)
    setRadials(newRadials)
  }

  function removeRadial(index: number) {
    let newRadials = radials.slice()
    newRadials.splice(index, 1)
    setRadials(newRadials)
  }

  on(Events.NEW_RADIAL, (data) => addRadial(data.radial))
  
  return (
    <div style='display: flex; flex-direction: column; padding-top: var(--space-extra-small); padding-bottom: var(--space-extra-small); padding-left: var(--space-extra-small); padding-right: var(--space-extra-small)'>
      <AddRadial onAddRadialClicked={onAddRadialClicked} />
        {
          radials.map((radial, index) => 
            <RadialItem 
            config={radial.config}
            onRemove={() => removeRadial(index)}
            onConfigChange={() => {}} />
          )
        }
    </div>
  )

} 