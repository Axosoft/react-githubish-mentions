import React from "react";
import portal from "react-portal-hoc";
import MentionMenuItem from './MentionMenuItem';

class MentionMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      left: props.left,
      top: props.top
    };

    this.bindTopAndLeftToWindow = this.bindTopAndLeftToWindow.bind(this);
  }

  bindTopAndLeftToWindow(props) {
    let top = props.top;
    let left = props.left;

    const windowHeight = window.innerHeight + window.pageYOffset;
    const windowWidth = window.innerWidth + window.pageXOffset;
    //prevent menu from going off bottom of screen
    if (this.node && top + this.node.offsetHeight > windowHeight) {
      top = windowHeight - (this.node.offsetHeight + 10);
    }

    //prevent menu from going off the right of the screen
    if (this.node && left + this.node.offsetWidth > windowWidth) {
      left = windowWidth - (this.node.offsetWidth + 10);
    }
    if (this.state.top !== top || this.state.left !== left) {
      this.setState({ top, left });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.left != this.state.left || nextProps.top != this.state.top) {
      this.bindTopAndLeftToWindow(nextProps);
    }
  }

  componentDidMount() {
    this.bindTopAndLeftToWindow(this.props);
  }

  render() {
    const {
      active,
      autoScroll,
      className,
      item,
      options,
      hoverItem,
      selectItem,
      style = {}
    } = this.props;

    const {
      top,
      left
    } = this.state;

    const menuStyle = {
      ...style,
      left,
      top,
      position: "absolute"
    };

    return (
      <div
        className={className}
        id='js-react-githubish-mentions-mention-menu'
        ref={node => this.node = node}
        style={menuStyle}
      >
        {options.map((option, idx) => (
          <MentionMenuItem
            active={active === idx}
            autoScroll={autoScroll}
            item={item}
            key={idx}
            onClick={selectItem(idx)}
            onMouseOver={hoverItem(idx)}
            option={option}
          />
        ))}
      </div>
    );
  }
}

export default portal({ clickToClose: true, escToClose: true })(MentionMenu);
