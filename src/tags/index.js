import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Tag from '../tag'
import { getDataset } from '../utils'

import './index.css'

const getTags = (tags = [], onDelete, readOnly, disabled, labelRemove, renderTagContent) =>
  tags.map(tag => {
    const { _id, tagClassName, dataset, ...tagRest } = tag
    return (
      <li
        className={['tag-item', tagClassName].filter(Boolean).join(' ')}
        key={`tag-item-${_id}`}
        {...getDataset(dataset)}
      >
        <Tag
          tag={tagRest}
          id={_id}
          onDelete={onDelete}
          readOnly={readOnly}
          disabled={disabled || tag.disabled}
          labelRemove={labelRemove}
          renderTagContent={renderTagContent}
        />
      </li>
    )
  })

class Tags extends PureComponent {
  static propTypes = {
    tags: PropTypes.array,
    onTagRemove: PropTypes.func,
    readOnly: PropTypes.bool,
    disabled: PropTypes.bool,
    texts: PropTypes.object,
    children: PropTypes.node,
  }

  render() {
    const { tags, onTagRemove, texts = {}, disabled, readOnly, children, renderTagContent } = this.props
    const lastItem = children || (
      <span className="placeholder">{typeof texts.placeholder !== 'undefined' ? texts.placeholder : 'Choose...'}</span>
    )

    return (
      <ul className="tag-list">
        {getTags(tags, onTagRemove, readOnly, disabled, texts.labelRemove, renderTagContent)}
        <li className="tag-item">{lastItem}</li>
      </ul>
    )
  }
}

export default Tags
