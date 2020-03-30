import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'

import './index.css'

export const getTagId = id => `${id}_tag`

class Tag extends PureComponent {
  static propTypes = {
    id: PropTypes.string.isRequired,
    tag: PropTypes.shape({}).isRequired,
    onDelete: PropTypes.func,
    readOnly: PropTypes.bool,
    disabled: PropTypes.bool,
    labelRemove: PropTypes.string,
    renderTagContent: PropTypes.func,
  }

  handleClick = e => {
    const { id, onDelete } = this.props
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    onDelete(id, (e.key || e.keyCode) !== undefined)
  }

  onKeyDown = e => {
    if (e.key === 'Backspace') {
      this.handleClick(e)
      e.preventDefault()
    }
  }

  onKeyUp = e => {
    if (e.keyCode === 32 || ['Delete', 'Enter'].indexOf(e.key) > -1) {
      this.handleClick(e)
      e.preventDefault()
    }
  }

  render() {
    const { id, tag, labelRemove = 'Remove', readOnly, disabled, renderTagContent } = this.props

    const tagId = getTagId(id)
    const buttonId = `${id}_button`
    const className = ['tag-remove', readOnly && 'readOnly', disabled && 'disabled'].filter(Boolean).join(' ')
    const isDisabled = readOnly || disabled

    return (
      <span className="tag" id={tagId} aria-label={tag.label}>
        {renderTagContent ? renderTagContent(tag) : tag.label}
        <a
          id={buttonId}
          onClick={!isDisabled ? this.handleClick : undefined}
          onKeyDown={!isDisabled ? this.onKeyDown : undefined}
          onKeyUp={!isDisabled ? this.onKeyUp : undefined}
          className={className}
          aria-label={labelRemove}
          aria-labelledby={`${buttonId} ${tagId}`}
          aria-disabled={isDisabled}
        >
          x
        </a>
      </span>
    )
  }
}

export default Tag
