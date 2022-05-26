import { render, Container, Text, VerticalSpace } from '@create-figma-plugin/ui'
import { h } from 'preact'
 
function Plugin (props: { greeting: string }) {
  return (
    <Container space='medium'>
      <VerticalSpace space='medium' />
      <Text>{props.greeting}</Text>
      <VerticalSpace space='medium' />
    </Container>
  )
}
 
export default render(Plugin)