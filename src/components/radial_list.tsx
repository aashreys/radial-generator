import { IconButton, Text } from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useState } from 'preact/hooks'
import { Event as Event } from "../events";
import { PlusIcon } from "../icons/icon_plus";
import { RadialConfig } from "../models/radial_config";
import { RadialItem as RadialConfigItem } from "./radial_item";

function AddSection(props: any) {

  return(
    <div style='
    display: flex; 
    margin-left: var(--space-extra-small); 
    margin-bottom: 2px; 
    align-items: center'>

      <Text bold style={'flex-grow: 1'}>
        {props.title}
      </Text>

      <IconButton onClick={props.onAddClick} value={false} >
        <PlusIcon />
      </IconButton>

    </div>
  )

}

export function RadialList(props: any) {

  const [configs, setConfigs] = useState<RadialConfig[]>([])

  function onAddClick() {
    emit(Event.RADIAL_REQUESTED)
  }

  function onDuplicateClick(index: number) {
    let duplicateConfig = configs[index]
    let newConfigs = configs.slice()
    newConfigs.splice(index + 1, 0 , duplicateConfig)
    setConfigs(newConfigs)
    emit(Event.DUPLICATE_RADIAL_REQUESTED, { index : index })
  }

  function addRadialConfig(config: RadialConfig, index?: number) {
    let newConfigs = configs.slice()
    newConfigs.push(config)
    setConfigs(newConfigs)
  }

  function removeRadial(index: number) {
    let newConfigs = configs.slice()
    newConfigs.splice(index, 1)
    setConfigs(newConfigs)
    emit(Event.RADIAL_REMOVED, { index: index })
  }

  function updateRadial(index: number, newConfig: RadialConfig) {
    configs[index] = newConfig
    emit(Event.RADIAL_UPDATED, { index: index, newConfig: newConfig })
  }

  on(Event.RADIAL_ADDED, (data) => addRadialConfig(data.config))
  
  return (
    <div style='display: flex; flex-direction: column; padding-top: var(--space-extra-small); padding-bottom: var(--space-extra-small); padding-left: var(--space-extra-small); padding-right: var(--space-extra-small)'>

      <AddSection 
      title={configs.length > 0 ? 'Add Radial' : 'Create Radial Menu'} 
      onAddClick={onAddClick} />

      {
        configs.length > 0 &&
        configs.map((config, index) => 
          <RadialConfigItem
          name={'Radial ' + (index + 1)}
          config={config}
          onRemoveClick={() => removeRadial(index)}
          onDuplicateClick={() => onDuplicateClick(index)}
          onConfigChange={(newConfig: RadialConfig) => updateRadial(index, newConfig)} />
        )
      }

      {
        configs.length === 0 &&
        <Text 
        style={'margin-top: var(--space-extra-small); margin-left: var(--space-extra-small);'}>
          Create a new radial menu with one or more radials to get started.
        </Text>
      }

    </div>
  )

} 