import { IconButton, Text, TextboxNumeric } from "@create-figma-plugin/ui";
import { Component, h } from "preact";
import { CopyIcon } from "../icons/icon_copy";
import { GapIcon } from "../icons/icon_gap";
import { MinusIcon } from "../icons/icon_minus";
import { OffsetIcon } from "../icons/icon_offset";
import { RotateIcon } from "../icons/icon_rotate";
import { SegmentIcon } from "../icons/icon_segment";
import { SizeIcon } from "../icons/icon_size";
import { SweepIcon } from "../icons/icon_sweep";
import { RadialConfig } from "../models/radial_config";

export class RadialItem extends Component<{name: string, config: RadialConfig, onRemoveClick: any, onDuplicateClick: any, onConfigChange: any, style?: string}, any> {
  
  constructor(props: {name: string, config: RadialConfig, onConfigChange: any, onRemoveClick: any, onDuplicateClick: any, style?: string}) {
    super()
    this.state = {
      size: props.config.size.toString(),
      numSegments: props.config.numSegments.toString(),
      sweep: props.config.sweep.toString() + '°',
      rotation: props.config.rotation.toString() + '°',
      offset: (props.config.offset * 100).toString() + '%',
      gap: props.config.gap.toString()
    }
  }

  onSizeChange(value: string) {
    if (this.isFloat(value)) {
      if (value.length > 0) {
        this.setState(prevState => ({
          ...prevState,
          size: value
        }), this.onConfigChange)
      }
    }
  }

  onNumSegmentsChange(value: string) {
    if (this.isInteger(value)) {
      this.setState(prevState => ({
        ...prevState,
        numSegments: value
      }), this.onConfigChange)
    }
  }

  onSweepChange(value: string) {
    if (this.isAngle(value)) {
      value = this.rolloverAngle(parseFloat(value)) + '°'
      this.setState(prevState => ({
        ...prevState,
        sweep: value
      }), this.onConfigChange)
    }
  }

  onRotationChange(value: string) {
    if (this.isAngle(value)) {
      value = this.rolloverAngle(parseFloat(value)) + '°'
      this.setState(prevState => ({
        ...prevState,
        rotation: value
      }), this.onConfigChange)
    }
  }

  onOffsetChange(value: string) {
    if (this.isPercent(value)) {
      this.setState(prevState => ({
        ...prevState,
        offset: value
      }), this.onConfigChange)
    }
  }

  onGapChange(value: string) {
    if (this.isFloat(value)) {
      this.setState(prevState => ({
        ...prevState,
        gap: value
      }), this.onConfigChange)
    }
  }

  isAngle(value: string): boolean {
    return this.isFloat(value)
  }

  isPercent(value: string): boolean {
    return this.isFloat(value)
  }

  isFloat(value: string): boolean {
    return value !== undefined && !isNaN(parseFloat(value))
  }

  isInteger(value: string): boolean {
    return value !== undefined && !isNaN(parseInt(value))
  }

  rolloverAngle(angle: number) {
    if (angle >= 0) {
      return angle % 360
    }
    else {
      return (angle % 360) + 360
    }
  }

  onConfigChange() {
    this.props.onConfigChange({
      size: parseFloat(this.state.size),
      numSegments: parseInt(this.state.numSegments),
      sweep: parseFloat(this.state.sweep),
      rotation: parseFloat(this.state.rotation),
      offset: parseFloat(this.state.offset) / 100,
      gap: parseFloat(this.state.gap)
    })
  }
 
  render(props: {name: string, config: RadialConfig, onRemoveClick: any, onDuplicateClick: any, onConfigChange: any, style?: string}, state: any) {
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
          icon={<SizeIcon />}
          minimum={0}
          incrementBig={10}
          incrementSmall={1}
          onInput={e => this.onSizeChange(e.currentTarget.value)}
          value={state.size}  />

          <div style='width: var(--space-extra-small)'/>

          <TextboxNumeric 
          style={'flex-grow: 1;'}
          noBorder
          icon={<SegmentIcon />}
          minimum={1}
          incrementBig={2}
          incrementSmall={1}
          integer
          onInput={e => this.onNumSegmentsChange(e.currentTarget.value)}
          value={state.numSegments}  />

          <div style='width: var(--space-extra-small)'/>

          <TextboxNumeric 
          style={'flex-grow: 1;'}
          noBorder
          icon={<SweepIcon />}
          incrementBig={10}
          incrementSmall={1}
          suffix='°'
          onInput={e => this.onSweepChange(e.currentTarget.value)}
          value={state.sweep}  />

        </div>

        <div style='display: flex'>

          <TextboxNumeric 
          style={'flex-grow: 1;'}
          noBorder
          icon={<RotateIcon />}
          incrementBig={10}
          incrementSmall={1}
          suffix='°'
          onInput={e => this.onRotationChange(e.currentTarget.value)}
          value={state.rotation}  />
          
          <div style='width: var(--space-extra-small)'/>

          <TextboxNumeric
          style={'flex-grow: 1;'}
          noBorder
          icon={<OffsetIcon />}
          minimum={0}
          maximum={100}
          incrementBig={10}
          incrementSmall={1}
          suffix='%'
          onInput={e => this.onOffsetChange(e.currentTarget.value)}
          value={state.offset}  />

          <div style='width: var(--space-extra-small)'/>

          <TextboxNumeric 
          style={'flex-grow: 1;'}
          noBorder
          icon={<GapIcon />}
          minimum={0}
          incrementBig={10}
          incrementSmall={1}
          onInput={e => this.onGapChange(e.currentTarget.value)}
          value={state.gap}  />

        </div>

      </div>
    )
  }

}