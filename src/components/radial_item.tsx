import { IconButton, Text, TextboxNumeric } from "@create-figma-plugin/ui";
import { Component, h } from "preact";
import { CopyIcon } from "../icons/icon_copy";
import { MinusIcon } from "../icons/icon_minus";
import { RadialConfig } from "../models/radial_config";

export class RadialItem extends Component<{name: string, config: RadialConfig, onRemoveClick: any, onDuplicateClick: any, onConfigChange: any, style?: string}, RadialConfig> {
  
  constructor(props: {name: string, config: RadialConfig, onConfigChange: any, onRemoveClick: any, onDuplicateClick: any, style?: string}) {
    super()
    this.state = props.config
  }

  onSizeChange(value: string) {
    if (!isNaN(parseInt(value))) {
      this.setState(prevState => ({
        ...prevState,
        size: parseInt(value)
      }), this.onConfigChange)
    }
  }

  onNumSegmentsChange(value: string) {
    if (!isNaN(parseInt(value))) {
      this.setState(prevState => ({
        ...prevState,
        numSegments: parseInt(value)
      }), this.onConfigChange)
    }
  }

  onSweepChange(value: string) {
    if (!isNaN(parseInt(value))) {
      this.setState(prevState => ({
        ...prevState,
        sweep: parseInt(value)
      }), this.onConfigChange)
    }
  }

  onRotationChange(value: string) {
    if (!isNaN(parseInt(value))) {
      this.setState(prevState => ({
        ...prevState,
        rotation: parseInt(value)
      }), this.onConfigChange)
    }
  }

  onOffsetChange(value: string) {
    if (!isNaN(parseInt(value))) {
      this.setState(prevState => ({
        ...prevState,
        innerOffset: parseInt(value) / 100
      }), this.onConfigChange)
    }
  }

  onGapChange(value: string) {
    if (!isNaN(parseInt(value))) {
      this.setState(prevState => ({
        ...prevState,
        gap: parseInt(value)
      }), this.onConfigChange)
    }
  }

  onConfigChange() {
    this.props.onConfigChange(this.state)
  }

  render(props: {name: string, config: RadialConfig, onRemoveClick: any, onDuplicateClick: any, onConfigChange: any, style?: string}, state: RadialConfig) {
    return (
      <div style={'margin-bottom: var(--space-extra-small)'}>

        <div style='
        display: flex; 
        margin-left: var(--space-extra-small); 
        margin-bottom: 2px; 
        align-items: center'>

          <Text bold style={'flex-grow: 1'}>
            {props.name}
          </Text>

          <IconButton onClick={props.onDuplicateClick} value={false}>
            <CopyIcon />
          </IconButton>

          <IconButton onClick={props.onRemoveClick} value={false}>
            <MinusIcon />
          </IconButton>

        </div>
        

        <div style='display: flex; margin-bottom: var(--space-extra-small)'>
          <TextboxNumeric 
          style={'flex-grow: 1;'}
          noBorder
          icon="S"
          minimum={0}
          incrementBig={10}
          incrementSmall={1}
          integer
          onInput={e => this.onSizeChange(e.currentTarget.value)}
          value={state.size.toString()}  />

          <div style='width: var(--space-extra-small)'/>

          <TextboxNumeric 
          style={'flex-grow: 1;'}
          noBorder
          icon="N"
          minimum={1}
          incrementBig={2}
          incrementSmall={1}
          integer
          onInput={e => this.onNumSegmentsChange(e.currentTarget.value)}
          value={state.numSegments.toString()}  />

          <div style='width: var(--space-extra-small)'/>

          <TextboxNumeric 
          style={'flex-grow: 1;'}
          noBorder
          icon="S"
          minimum={0}
          maximum={360}
          incrementBig={10}
          incrementSmall={1}
          integer
          onInput={e => this.onSweepChange(e.currentTarget.value)}
          value={state.sweep.toString()}  />

        </div>

        <div style='display: flex'>

          <TextboxNumeric 
          style={'flex-grow: 1;'}
          noBorder
          icon="R"
          minimum={0}
          maximum={360}
          incrementBig={10}
          incrementSmall={1}
          integer
          onInput={e => this.onRotationChange(e.currentTarget.value)}
          value={state.rotation.toString()}  />
          
          <div style='width: var(--space-extra-small)'/>

          <TextboxNumeric
          style={'flex-grow: 1;'}
          noBorder
          icon="O"
          minimum={0}
          maximum={100}
          incrementBig={10}
          incrementSmall={1}
          integer
          onInput={e => this.onOffsetChange(e.currentTarget.value)}
          value={Math.round((state.innerOffset * 100)).toString()}  />

          <div style='width: var(--space-extra-small)'/>

          <TextboxNumeric 
          style={'flex-grow: 1;'}
          noBorder
          icon="G"
          minimum={0}
          incrementBig={10}
          incrementSmall={1}
          integer
          onInput={e => this.onGapChange(e.currentTarget.value)}
          value={state.gap.toString()}  />

        </div>

      </div>
    )
  }

}