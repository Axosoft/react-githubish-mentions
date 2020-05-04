import React from "react";
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';

class MentionMenuItem extends React.Component {
  componentDidUpdate(prevProps) {
    if (this.node && this.props.autoScroll && this.props.active && !prevProps.active) {
      scrollIntoViewIfNeeded(this.node, {
        behavior: 'smooth',
        block: 'nearest',
        boundary: document.getElementById('js-react-githubish-mentions-mention-menu'),
        duration: 250,
        scrollMode: 'if-needed'
      });
    }
  }

  render() {
    const {
      active,
      item: Item,
      onClick,
      onMouseOver,
      option
    } = this.props;

    return (
      <div
        onClick={onClick}
        onMouseOver={onMouseOver}
        ref={node => this.node = node}
      >
        <Item active={active} {...option} />
      </div>
    );
  }
}

export default MentionMenuItem;
