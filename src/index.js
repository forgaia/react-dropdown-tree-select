/*!
 * React Dropdown Tree Select
 * A lightweight, fast and highly customizable tree select component.
 * Hrusikesh Panda <hrusikesh.panda@dowjones.com>
 * Copyright (c) 2017 Dow Jones, Inc. <support@dowjones.com> (http://dowjones.com)
 * license MIT
 * see https://github.com/dowjones/react-dropdown-tree-select
 */
import PropTypes from 'prop-types'
import React, { Component } from 'react'

import { isOutsideClick, clientIdGenerator } from './utils'
import Input from './input'
import Tags from './tags'
import Trigger from './trigger'
import Tree from './tree'
import TreeManager from './tree-manager'
import keyboardNavigation from './tree-manager/keyboardNavigation'

import './index.css'

import { getAriaLabel } from './a11y'

class DropdownTreeSelect extends Component {
  static propTypes = {
    data: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
    clearSearchOnChange: PropTypes.bool,
    keepTreeOnSearch: PropTypes.bool,
    keepChildrenOnSearch: PropTypes.bool,
    keepOpenOnSelect: PropTypes.bool,
    texts: PropTypes.shape({
      placeholder: PropTypes.string,
      searchPlaceholder: PropTypes.string,
      noMatches: PropTypes.string,
      label: PropTypes.string,
      labelRemove: PropTypes.string,
    }),
    showDropdown: PropTypes.oneOf(['default', 'initial', 'always']),
    className: PropTypes.string,
    onChange: PropTypes.func,
    onAction: PropTypes.func,
    onNodeToggle: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    mode: PropTypes.oneOf(['multiSelect', 'simpleSelect', 'radioSelect', 'hierarchical']),
    showPartiallySelected: PropTypes.bool,
    expandAllAncestors: PropTypes.bool,
    defaultCheckedValues: PropTypes.arrayOf(PropTypes.string),
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    id: PropTypes.string,
    searchPredicate: PropTypes.func,
    inlineSearchInput: PropTypes.bool,
    triggerComponent: PropTypes.oneOf([PropTypes.string, PropTypes.elementType]),
    triggerComponentClassName: PropTypes.string,
    triggerComponentProps: PropTypes.shape({}),
    renderTagContent: PropTypes.func,
    renderNodeContent: PropTypes.func,
  }

  static defaultProps = {
    onFocus: () => {},
    onBlur: () => {},
    onChange: () => {},
    texts: {},
    showDropdown: 'default',
    inlineSearchInput: false,
    defaultCheckedValues: [],
    triggerComponent: 'button',
    triggerComponentClassName: '',
    triggerComponentProps: {},
  }

  constructor(props) {
    super(props)
    this.state = {
      searchModeOn: false,
      currentFocus: undefined,
    }
    this.clientId = props.id || clientIdGenerator.get(this)
  }

  initNewProps = ({
    data,
    mode,
    showDropdown,
    showPartiallySelected,
    expandAllAncestors,
    defaultCheckedValues,
    searchPredicate,
  }) => {
    this.treeManager = new TreeManager({
      data,
      mode,
      showPartiallySelected,
      expandAllAncestors,
      defaultCheckedValues,
      rootPrefixId: this.clientId,
      searchPredicate,
    })
    // Restore focus-state
    const currentFocusNode = this.state.currentFocus && this.treeManager.getNodeById(this.state.currentFocus)
    if (currentFocusNode) {
      currentFocusNode._focused = true
    }
    this.setState(prevState => ({
      showDropdown: /initial|always/.test(showDropdown) || prevState.showDropdown === true,
      ...this.treeManager.getTreeAndTags(),
    }))
  }

  resetSearchState = () => {
    // clear the search criteria and avoid react controlled/uncontrolled warning
    // !this.props.inlineSearchInput is gated as inline search is not rendered until dropdown is shown
    if (!this.props.inlineSearchInput) {
      this.searchInput.value = ''
    }

    return {
      tree: this.treeManager.restoreNodes(), // restore the tree to its pre-search state
      searchModeOn: false,
      allNodesHidden: false,
    }
  }

  componentWillMount() {
    this.initNewProps(this.props)
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleOutsideClick, false)
  }

  componentWillReceiveProps(nextProps) {
    this.initNewProps(nextProps)
  }

  handleClick = (e, callback) => {
    this.setState(prevState => {
      // keep dropdown active when typing in search box
      const showDropdown = this.props.showDropdown === 'always' || this.keepDropdownActive || !prevState.showDropdown

      // register event listeners only if there is a state change
      if (showDropdown !== prevState.showDropdown) {
        if (showDropdown) {
          document.addEventListener('click', this.handleOutsideClick, false)
        } else {
          document.removeEventListener('click', this.handleOutsideClick, false)
        }
      }

      if (showDropdown) this.props.onFocus()
      else this.props.onBlur()

      return !showDropdown ? { showDropdown, ...this.resetSearchState() } : { showDropdown }
    }, callback)
  }

  handleOutsideClick = e => {
    if (this.props.showDropdown === 'always' || !isOutsideClick(e, this.node)) {
      return
    }

    this.handleClick()
  }

  onInputChange = value => {
    const { allNodesHidden, tree } = this.treeManager.filterTree(
      value,
      this.props.keepTreeOnSearch,
      this.props.keepChildrenOnSearch
    )
    const searchModeOn = value.length > 0

    this.setState({
      tree,
      searchModeOn,
      allNodesHidden,
    })
  }

  onTagRemove = (id, isKeyboardEvent) => {
    const { tags: prevTags } = this.state
    this.onCheckboxChange(id, false, tags => {
      if (!isKeyboardEvent) return

      keyboardNavigation.getNextFocusAfterTagDelete(id, prevTags, tags, this.searchInput).focus()
    })
  }

  onNodeToggle = id => {
    this.treeManager.toggleNodeExpandState(id)
    const tree = this.state.searchModeOn ? this.treeManager.matchTree : this.treeManager.tree
    this.setState({ tree })
    typeof this.props.onNodeToggle === 'function' && this.props.onNodeToggle(this.treeManager.getNodeById(id))
  }

  onCheckboxChange = (id, checked, callback) => {
    const { mode, keepOpenOnSelect, clearSearchOnChange } = this.props
    const { currentFocus, searchModeOn } = this.state
    this.treeManager.setNodeCheckedState(id, checked)
    let tags = this.treeManager.tags
    const isSingleSelect = ['simpleSelect', 'radioSelect'].indexOf(mode) > -1
    const showDropdown = isSingleSelect && !keepOpenOnSelect ? false : this.state.showDropdown
    const currentFocusNode = currentFocus && this.treeManager.getNodeById(currentFocus)
    const node = this.treeManager.getNodeById(id)

    if (!tags.length) {
      this.treeManager.restoreDefaultValues()
      tags = this.treeManager.tags
    }

    const tree = searchModeOn ? this.treeManager.matchTree : this.treeManager.tree
    const nextState = {
      tree,
      tags,
      showDropdown,
      currentFocus: id,
    }

    if ((isSingleSelect && !showDropdown) || clearSearchOnChange) {
      Object.assign(nextState, this.resetSearchState())
    }

    if (isSingleSelect && !showDropdown) {
      document.removeEventListener('click', this.handleOutsideClick, false)
    }

    keyboardNavigation.adjustFocusedProps(currentFocusNode, node)
    this.setState(nextState, () => {
      callback && callback(tags)
    })
    this.props.onChange(node, tags)
  }

  onAction = (nodeId, action) => {
    this.props.onAction(this.treeManager.getNodeById(nodeId), action)
  }

  onInputFocus = () => {
    this.keepDropdownActive = true
  }

  onInputBlur = () => {
    this.keepDropdownActive = false
  }

  onTrigger = e => {
    this.handleClick(e, () => {
      // If the dropdown is shown after key press, focus the input
      if (this.state.showDropdown) {
        this.searchInput.focus()
      }
    })
  }

  onKeyboardKeyDown = e => {
    const { readOnly, mode } = this.props
    const { showDropdown, tags, searchModeOn, currentFocus } = this.state
    const tm = this.treeManager
    const tree = searchModeOn ? tm.matchTree : tm.tree

    if (!showDropdown && (keyboardNavigation.isValidKey(e.key, false) || /^\w$/i.test(e.key))) {
      // Triggers open of dropdown and retriggers event
      e.persist()
      this.handleClick(null, () => this.onKeyboardKeyDown(e))
      if (/\w/i.test(e.key)) return
    } else if (showDropdown && keyboardNavigation.isValidKey(e.key, true)) {
      const newFocus = tm.handleNavigationKey(
        currentFocus,
        tree,
        e.key,
        readOnly,
        !searchModeOn,
        this.onCheckboxChange,
        this.onNodeToggle
      )
      if (newFocus !== currentFocus) {
        this.setState({ currentFocus: newFocus })
      }
    } else if (showDropdown && ['Escape', 'Tab'].indexOf(e.key) > -1) {
      if (mode === 'simpleSelect' && tree.has(currentFocus)) {
        this.onCheckboxChange(currentFocus, true)
      } else {
        // Triggers close
        this.keepDropdownActive = false
        this.handleClick()
      }
      return
    } else if (e.key === 'Backspace' && tags.length && this.searchInput.value.length === 0) {
      const lastTag = tags.pop()
      this.onCheckboxChange(lastTag._id, false)
    } else {
      return
    }
    e.preventDefault()
  }

  getAriaAttributes = () => {
    const { mode, texts } = this.props

    if (mode !== 'radioSelect') return {}

    return {
      role: 'radiogroup',
      ...getAriaLabel(texts.label),
    }
  }

  render() {
    const {
      disabled,
      readOnly,
      mode,
      texts,
      inlineSearchInput,
      triggerComponent,
      triggerComponentProps,
      triggerComponentClassName,
      renderTagContent,
      renderNodeContent,
    } = this.props
    const { showDropdown, currentFocus, tags } = this.state

    const activeDescendant = currentFocus ? `${currentFocus}_li` : undefined

    const commonProps = { disabled, readOnly, activeDescendant, texts, mode, clientId: this.clientId }

    const searchInput = (
      <Input
        inputRef={el => {
          this.searchInput = el
        }}
        onInputChange={this.onInputChange}
        onFocus={this.onInputFocus}
        onBlur={this.onInputBlur}
        onKeyDown={this.onKeyboardKeyDown}
        {...commonProps}
      />
    )
    return (
      <div
        id={this.clientId}
        className={[this.props.className && this.props.className, 'react-dropdown-tree-select']
          .filter(Boolean)
          .join(' ')}
        ref={node => {
          this.node = node
        }}
      >
        <div
          className={['dropdown', mode === 'simpleSelect' && 'simple-select', mode === 'radioSelect' && 'radio-select']
            .filter(Boolean)
            .join(' ')}
        >
          <Trigger
            triggerComponent={triggerComponent}
            triggerComponentClassName={triggerComponentClassName}
            triggerComponentProps={triggerComponentProps}
            onTrigger={this.onTrigger}
            showDropdown={showDropdown}
            {...commonProps}
            tags={tags}
          >
            <Tags renderTagContent={renderTagContent} tags={tags} onTagRemove={this.onTagRemove} {...commonProps}>
              {!inlineSearchInput && searchInput}
            </Tags>
          </Trigger>
          {showDropdown && (
            <div className="dropdown-content" {...this.getAriaAttributes()}>
              {inlineSearchInput && searchInput}
              {this.state.allNodesHidden ? (
                <span className="no-matches">{texts.noMatches || 'No matches found'}</span>
              ) : (
                <Tree
                  data={this.state.tree}
                  keepTreeOnSearch={this.props.keepTreeOnSearch}
                  keepChildrenOnSearch={this.props.keepChildrenOnSearch}
                  searchModeOn={this.state.searchModeOn}
                  onAction={this.onAction}
                  onCheckboxChange={this.onCheckboxChange}
                  onNodeToggle={this.onNodeToggle}
                  mode={mode}
                  showPartiallySelected={this.props.showPartiallySelected}
                  renderNodeContent={renderNodeContent}
                  {...commonProps}
                />
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default DropdownTreeSelect
