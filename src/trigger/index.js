import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import { getAriaLabel } from '../a11y'
import { getTagId } from '../tag'

class Trigger extends PureComponent {
  static propTypes = {
    onTrigger: PropTypes.func,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    showDropdown: PropTypes.bool,
    mode: PropTypes.oneOf(['multiSelect', 'simpleSelect', 'radioSelect', 'hierarchical']),
    texts: PropTypes.object,
    clientId: PropTypes.string,
    tags: PropTypes.array,
    triggerComponent: PropTypes.oneOf([PropTypes.string, PropTypes.elementType]).isRequired,
    triggerComponentProps: PropTypes.shape({}).isRequired,
  }

  getAriaAttributes = () => {
    const { mode, texts = {}, showDropdown, clientId, tags } = this.props

    const triggerId = `${clientId}_trigger`
    const labelledBy = []
    let labelAttributes = getAriaLabel(texts.label)
    if (tags && tags.length) {
      if (labelAttributes['aria-label']) {
        // Adds reference to self when having aria-label
        labelledBy.push(triggerId)
      }
      tags.forEach(t => {
        labelledBy.push(getTagId(t._id))
      })
      labelAttributes = getAriaLabel(texts.label, labelledBy.join(' '))
    }

    return {
      id: triggerId,
      role: 'button',
      tabIndex: 0,
      'aria-haspopup': mode === 'simpleSelect' ? 'listbox' : 'tree',
      'aria-expanded': showDropdown ? 'true' : 'false',
      ...labelAttributes,
    }
  }

  handleTrigger = e => {
    // Just return if triggered from keyDown and the key isn't enter, space or arrow down
    if (e.key && e.keyCode !== 13 && e.keyCode !== 32 && e.keyCode !== 40) {
      return
    } else if (e.key && this.triggerNode && this.triggerNode !== document.activeElement) {
      // Do not trigger if not activeElement
      return
    } else if (!this.props.showDropdown && e.keyCode === 32) {
      // Avoid adding space to input on open
      e.preventDefault()
    }

    // Else this is a key press that should trigger the dropdown
    this.props.onTrigger(e)
  }

  render() {
    const {
      disabled,
      readOnly,
      showDropdown,
      triggerComponent,
      triggerComponentProps,
      triggerComponentClassName,
    } = this.props

    const dropdownTriggerClassname = [
      'dropdown-trigger',
      'arrow',
      disabled && 'disabled',
      readOnly && 'readOnly',
      showDropdown && 'top',
      !showDropdown && 'bottom',
      triggerComponentClassName,
    ]
      .filter(Boolean)
      .join(' ')

    const Component = triggerComponent

    return (
      <Component
        ref={node => {
          this.triggerNode = node
        }}
        className={dropdownTriggerClassname}
        onClick={!disabled ? this.handleTrigger : undefined}
        onKeyDown={!disabled ? this.handleTrigger : undefined}
        {...this.getAriaAttributes()}
        {...triggerComponentProps}
      >
        {this.props.children}
      </Component>
    )
  }
}

export default Trigger
