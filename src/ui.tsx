import { render } from '@create-figma-plugin/ui'
import { h } from 'preact'
import { EmptyState } from './components/empty_state'
import { RadialList } from './components/radial_list'
 
function Plugin () {

  function onClickNewRadial() {
    console.log('Button clicked')
  }

  function renderScene() {
    let isCreating = true;
    if (!isCreating) {
      return <EmptyState onClickNewRadial={onClickNewRadial} />
    }
    else {
      return <RadialList />
    }
  }

  return (
    renderScene()
  )

}
 
export default render(Plugin)