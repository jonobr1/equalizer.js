var colors = {
  'eee': '#eee',
  'ccc': '#ccc',
  'bbb': '#bbb',
  '888': '#888',
  'black': 'black',
  'green': 'rgb(100, 255, 100)',
  'blue': 'rgb(50, 150, 255)',
  'purple': 'rgb(150, 50, 255)',
  'pink': 'rgb(255, 100, 100)',
  'red': 'rgb(255, 50, 50)',
  'orange': 'orange',
  'gold': 'rgb(255, 150, 50)',
  'white': 'white'
};

var styles = {
  font: {
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    size: 11,
    fill: colors['888'],
    leading: 20,
    weight: 500
  },
  classic: {
    display: 'block',
    position: 'relative',
    background: 'transparent',
    padding: 20 + 'px'
  },
  recording: {
    position: 'absolute',
    borderRadius: '50%',
    top: 10 + 'px',
    left: '50%',
    width: 8 + 'px',
    height: 8 + 'px',
    marginLeft: - 4 + 'px',
    marginTop: - 4 + 'px',
    cursor: 'pointer',
    background: colors['ccc'],
    content: ''
  }
};

export {
  styles,
  colors
};
