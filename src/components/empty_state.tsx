import { Button, Text } from "@create-figma-plugin/ui";
import { h } from "preact";

export function EmptyState(props: any) {
  return (
    <div style={'display: flex; flex-direction: column; padding: var(--space-small); width: 100%; height: 100%; align-items: center; justify-content:center'}>

      <Button onClick={props.onClickNewRadial}>New Radial Menu</Button>

      <div style={'height: var(--space-small)'} />

      {/* <Text style={'text-align: center'}>
        Or edit a radial menu created with this plugin by selecting it.
      </Text> */}

    </div>
  )
}