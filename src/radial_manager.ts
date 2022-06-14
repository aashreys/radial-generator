import { Radial } from "./models/radial";
import { RadialConfig } from "./models/radial_config";
import { Utils } from "./utils";

export class RadialManager {

  private readonly radials: Radial[] = []

  private componentsFrame: FrameNode | undefined

  private readonly DEFAULT_CONFIG: RadialConfig = {
    size: 640,
    numSegments: 6,
    sweep: 360,
    rotation: 0,
    offset: 0.5,
    gap: 10
  }

  public createRadial(): Radial {
    // Create radial
    const radial = this._createRadial(this.DEFAULT_CONFIG)

    // Position radial
    if (this.radials.length > 0 && this.isRadialOnCanvas(this.radials[0])) {
      this.centerAtRadial(radial, this.radials[0]) 
    }
    else this.centerInViewport(radial)

    // Add to radials list
    this.radials.push(radial)

    // Perform housekeeping
    this.nameRadialNodes(this.radials)
    if (!this.componentsFrame || this.componentsFrame.removed) {
      this.componentsFrame = this.createComponentsFrame()
      this.positionComponentsRadial(this.componentsFrame, radial)
    }
    this.organizeRadialComponents(this.radials, this.componentsFrame as FrameNode)

    return radial
  }

  public duplicateRadial(index: number) {
    const sourceRadial = this.radials[index]
    const dupeConfig = sourceRadial.config
    const dupeIndex = index + 1
    
    // Create duplicate radial
    const dupeRadial = this._createRadial(dupeConfig)

    // Position radial
    if (this.isRadialOnCanvas(sourceRadial)) {
      const parent = sourceRadial.node.parent
      parent?.insertChild(parent?.children.indexOf(sourceRadial.node) + 1, dupeRadial.node)
      this.centerAtRadial(dupeRadial, sourceRadial)
    } 
    else {
      this.centerInViewport(dupeRadial)
    }

    // Add to radials list
    this.radials.splice(dupeIndex, 0, dupeRadial)

    // Perform housekeeping
    this.nameRadialNodes(this.radials)
    if (!this.componentsFrame || this.componentsFrame.removed) {
      this.componentsFrame = this.createComponentsFrame()
      this.positionComponentsRadial(this.componentsFrame, dupeRadial)
    }
    this.organizeRadialComponents(this.radials, this.componentsFrame as FrameNode)

    return dupeRadial
  }

  public updateRadial(index: number, newConfig: RadialConfig) {
    const oldRadial = this.radials[index]

    // Create radial from new config
    const newRadial = this._createRadial(newConfig)
    
    // Position radial
    if (this.isRadialOnCanvas(oldRadial)) {
      const parent = oldRadial.node.parent
      parent?.insertChild(parent?.children.indexOf(oldRadial.node) + 1, newRadial.node)
      this.centerAtRadial(newRadial, oldRadial)
    } 
    else {
      this.centerInViewport(newRadial)
    }

    // Copy visual properties from old radial
    this.copyRadialVisuals(oldRadial, newRadial)

    // Replace old radial in radials list
    this.radials.splice(index, 1, newRadial)

    // Remove old radial and components from canvas
    this.removeFromCanvas(oldRadial)

    // Perform housekeeping
    this.nameRadialNodes(this.radials)
    if (!this.componentsFrame || this.componentsFrame.removed) {
      this.componentsFrame = this.createComponentsFrame()
      this.positionComponentsRadial(this.componentsFrame, newRadial)
    }
    this.organizeRadialComponents(this.radials, this.componentsFrame as FrameNode)
  }

  public removeRadial(index: number) {
    // Remove radial from canvas
    this.removeFromCanvas(this.radials[index])

    // Remove radial from radials array
    this.radials.splice(index, 1)

    // Perform housekeeping
    this.nameRadialNodes(this.radials)
    if (!this.componentsFrame || this.componentsFrame.removed) {
      this.componentsFrame = this.createComponentsFrame()
    }
    this.organizeRadialComponents(this.radials, this.componentsFrame as FrameNode)

    // Remove components frame when last radial is removed
    if (this.radials.length === 0) Utils.removeNodes(this.componentsFrame)
  }

  private _createRadial(config: RadialConfig): Radial {
    const size = this.ensureMinDimension(config.size)
    const gap = config.gap > size ? size : config.gap // gap cannot exceed radial size
    const perSegmentSweep = config.sweep / config.numSegments

    const radialContainer = figma.createFrame()
    radialContainer.fills = []
    radialContainer.clipsContent = false
    radialContainer.resize(size, size)

    const gapAngle = Utils.arcAngle(size / 2, gap) / 2
    const startAngle = gapAngle
    const endAngle = (gapAngle * 2) < perSegmentSweep ? perSegmentSweep - gapAngle : gapAngle

    const ellipse: EllipseNode = this.createEllipseArc(size, startAngle, endAngle, config.offset, 'd9d9d9')

    radialContainer.appendChild(ellipse)
    ellipse.x = ellipse.y = 0

    const arc = figma.flatten([ellipse])
    radialContainer.appendChild(arc)

    const segmentComponents = this.createRadialComponents(arc)
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
      Utils.rotateAroundRelativePoint(
        segmentInstances[i],
        { x: size / 2, y: size / 2 }, 
        config.rotation + (i * perSegmentSweep)
      )
    }

    Utils.removeNodes(arc)

    return {
      node: radialContainer,
      config: config,
      componentSetNode: segmentComponents
    }

  }

  private createRadialComponents(arc: VectorNode): ComponentSetNode {
    let width = this.ensureMinDimension(arc.width)
    let height = this.ensureMinDimension(arc.height)

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

  private createEllipseArc(
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

  private ensureMinDimension(currentDimension?: number) {
    const minDimension = 0.01 // minimum size allowed by Figma for width and height
    if (currentDimension) {
      return currentDimension >= minDimension ? currentDimension : minDimension
    } else {
      return minDimension
    }
  }

  private centerInViewport(radial: Radial) {
    Utils.centerInViewport(radial.node)
    radial.componentSetNode.x = radial.node.x + radial.node.width + 200
  }

  private centerAtRadial(radial: Radial, centerRadial: Radial) {
    Utils.centerAtPoint(radial.node, this.getRadialCenter(centerRadial))
  }

  private getRadialCenter(radial: Radial): Vector {
    return {
      x: radial.node.x + radial.node.width / 2,
      y: radial.node.y + radial.node.height / 2
    }
  }

  private copyRadialVisuals(from: Radial, to: Radial) {
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

  private removeFromCanvas(radial: Radial) {
    try { Utils.removeNodes(radial.node, radial.componentSetNode) } 
    catch {}
  }

  private createComponentsFrame(): FrameNode {
    const componentsFrame = figma.createFrame()
    componentsFrame.name = 'Radial Components'
    componentsFrame.fills = []
    componentsFrame.layoutMode = 'HORIZONTAL'
    componentsFrame.primaryAxisSizingMode = 'AUTO'
    componentsFrame.counterAxisSizingMode = 'AUTO'
    componentsFrame.itemSpacing = 48
    return componentsFrame
  }

  private positionComponentsRadial(componentsFrame: FrameNode, radial: Radial) {
    componentsFrame.x = radial.node.x + radial.node.width + 600
    componentsFrame.y = radial.node.y
  }

  private isRadialOnCanvas(radial: Radial) {
    return radial.node && !radial.node.removed
  }

  private isRadialComponentOnCanvas(radial: Radial) {
    return radial.componentSetNode && !radial.componentSetNode.removed
  }

  private nameRadialNodes(radials: Radial[]) {
    let i = 0
    while (i < radials.length) {
      const radial = radials[i]
      if (this.isRadialOnCanvas(radial)) radial.node.name = 'Radial ' + (i + 1)
      if (this.isRadialComponentOnCanvas(radial)) radial.componentSetNode.name = 'Radial ' + (i + 1) + ' Segments'
      i++
    }
  }

  private organizeRadialComponents(radials: Radial[], componentsFrame: FrameNode) {
    let i = 0
    let childIndex = 0
    while (i < radials.length) {
      const radial = radials[i]
      if (this.isRadialComponentOnCanvas(radial)) {
        componentsFrame.insertChild(childIndex, radial.componentSetNode)
        childIndex++
      }
      i++
    }
  }

}