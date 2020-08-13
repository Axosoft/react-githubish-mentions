import * as R from 'ramda';
import React, { Component, Children } from "react";
import getCaretCoords from "textarea-caret";
import PropTypes from "prop-types";
import MentionMenu from "./MentionMenu";

const getMenuProps = (keystrokeTriggered, children) => {
  const child = Array.isArray(children)
    ? children[keystrokeTriggered]
    : children;
  return child ? child.props : {};
};

const defaultReplace = (userObj, trigger) => `${trigger}${userObj.value} `;

class MentionWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      child: {},
      options: []
    };
    const { children } = props;
    this.triggers = Children.map(children, child => child.props.trigger);
    this.closeMenu = this.closeMenu.bind(this);
  }

  makeOptions = (query, resolve) => Promise.resolve(resolve(query))
    .then((options) => {
      if (options.length > 0) {
        this.setState({
          options
        });
      } else {
        this.closeMenu();
      }
    });

  maybeMention() {
    // get the text preceding the cursor position
    const textBeforeCaret = this.ref.value.slice(0, this.ref.selectionStart);

    // split string by whitespaces and get the last word (where the cursor currently stands)
    const tokens = textBeforeCaret.split(/\s/);
    const lastToken = tokens[tokens.length - 1];

    // Get active trigger
    const activeTrigger = this.triggers.find(trigger => lastToken.startsWith(trigger)) || "";

    // check if the text before the caret ends with the last word
    let triggerIdx = textBeforeCaret.endsWith(lastToken) ? textBeforeCaret.length - (lastToken.length - activeTrigger.length) : -1;

    // and if that last word starts with a trigger
    const maybeTrigger = textBeforeCaret.substring(triggerIdx - activeTrigger.length, triggerIdx);

    const keystrokeTriggered = this.triggers.indexOf(maybeTrigger);

    if (keystrokeTriggered !== -1) {
      let positionIndex = this.ref.selectionStart;
      if (this.props.position === "start") {
        positionIndex = triggerIdx + 1;
      }
      const query = textBeforeCaret.substring(triggerIdx);
      const coords = getCaretCoords(this.ref, positionIndex);
      const { top, left } = this.ref.getBoundingClientRect();
      const child = getMenuProps(keystrokeTriggered, this.props.children);
      const { replace, resolve } = child;
      this.replace = replace || defaultReplace;
      this.makeOptions(query, resolve);

      // that stupid bug where the caret moves to the end happens unless we do it next tick
      setTimeout(() => {
        this.setState({
          active: 0,
          child,
          left: window.pageXOffset + coords.left + left - this.ref.scrollLeft,
          triggerIdx,
          top:
            (window.pageYOffset || 0) +
            coords.top +
            top +
            coords.height -
            this.ref.scrollTop
        });
      }, 0);
    } else {
      this.closeMenu();
    }
  }

  closeMenu() {
    setTimeout(() => {
      const resetState = {
        child: {},
        options: [],
        left: undefined,
        top: undefined,
        triggerIdx: undefined
      }
      if (!R.equals(this.state, resetState)) {
        this.setState(resetState);
      }
    }, 0);
  }

  handleInput = e => {
    this.maybeMention();
    const { onInput } = this.props;
    if (onInput) {
      onInput(e);
    }
  };

  inputRef = c => {
    this.ref = c;
    const { getRef } = this.props;
    if (getRef) {
      getRef(c);
    }
  };

  handleBlur = e => {
    // if the menu is open, don't treat a click as a blur (required for the click handler)
    const { onBlur } = this.props;
    if (onBlur && !this.state.top) {
      onBlur(e);
    }
  };

  handleChange = e => {
    const { onChange } = this.props;
    if (onChange) {
      // The purpose of this is so that the onChange is consistent with
      // how it is called in 'selectItem' and the value is always passed
      // as the second arg, instead of the user having to check both args.
      onChange(e, (e.target && e.target.value) || '');
    }
  }

  handleKeyDown = e => {
    const { options, active, triggerIdx } = this.state;
    let keyCaught;
    if (triggerIdx !== undefined) {
      if (e.key === "ArrowDown") {
        let newActive = active + 1;
        if (newActive >= options.length) {
          newActive = 0;
        }
        this.setState({
          active: newActive
        });
        keyCaught = true;
      } else if (e.key === "ArrowUp") {
        let newActive = active - 1;
        if (newActive < 0) {
          newActive = options.length - 1;
        }
        this.setState({
          active: newActive
        });
        keyCaught = true;
      } else if (e.key === "Tab" || e.key === "Enter") {
        this.selectItem(active)(e);
        keyCaught = true;
      }
    }
    const { onKeyDown } = this.props;
    if (keyCaught) {
      e.preventDefault();
    } else if (onKeyDown) {
      // only call the passed in keyDown handler if the key wasn't one of ours
      onKeyDown(e);
    }
  };

  selectItem = active => e => {
    const { options, triggerIdx } = this.state;
    const { onBeforeItemSelect, onChange } = this.props;

    const preMention = this.ref.value.substr(0, triggerIdx);
    const option = options[active];
    let mention = option.value;

    if (onBeforeItemSelect) {
      mention = onBeforeItemSelect(mention);
    }

    const postMention = this.ref.value.substr(this.ref.selectionStart);
    const newValue = `${preMention}${mention}${postMention}`;

    this.ref.value = newValue;
    if (onChange) {
      onChange(e, newValue);
    }

    const caretPosition = this.ref.value.length - postMention.length;
    this.ref.setSelectionRange(caretPosition, caretPosition);
    this.closeMenu();
    this.ref.focus();
  };

  setActiveOnEvent = active => e => {
    this.setState({
      active: active
    });
  }

  render() {
    const {
      autoScroll = true,
      children,
      CustomInputComponent,
      CustomComponent,
      getRef,
      containerStyle,
      textWrapperClassName,
      ...inputProps
    } = this.props;
    delete inputProps.onBeforeItemSelect;
    const { active, child, left, top, options } = this.state;
    const { item, className, style } = child;

    const componentProps = {
      ...inputProps,
      ref: this.inputRef,
      onBlur: this.handleBlur,
      onChange: this.handleChange,
      onInput: this.handleInput,
      onKeyDown: this.handleKeyDown
    };

    let inputElement;
    if (CustomInputComponent) {
      inputElement = <CustomInputComponent {...componentProps} />;
    } else {
      inputElement = <textarea {...componentProps} />;
    }

    return (
      <div className={textWrapperClassName} style={containerStyle}>
        {inputElement}
        {CustomComponent ?
          top !== undefined && (
            <CustomComponent
              active={active}
              className={className}
              closeFunc={this.closeMenu}
              left={left}
              isOpen={options.length > 0}
              item={item}
              options={options}
              hoverItem={this.setActiveOnEvent}
              selectItem={this.selectItem}
              style={style}
              top={top}
            />) :
          top !== undefined && (
            <MentionMenu
              active={active}
              autoScroll={autoScroll}
              className={className}
              left={left}
              isOpen={options.length > 0}
              item={item}
              options={options}
              hoverItem={this.setActiveOnEvent}
              selectItem={this.selectItem}
              style={style}
              top={top}
            />
          )
        }
      </div>
    );
  }
}

MentionWrapper.propTypes = {
  position: PropTypes.oneOf(["start", "caret"])
};

MentionWrapper.defaultProps = {
  position: "caret"
};

export default MentionWrapper;
