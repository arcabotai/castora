const defaultStyle = {
  control: {
    backgroundColor: '#fff',
    fontSize: 14,
    fontWeight: 'normal'
  },
  '&multiLine': {
    control: {
      minHeight: 64,
      focus: {
        borderColor: '#000',
      },
    },
    highlighter: {
      // padding: 8,
    },
    input: {
      // padding: 8,
      // no outline on focus
      outline: 'none',
    }
  },
  '&singleLine': {
    display: 'inline-block',
    width: 180,

    highlighter: {
      padding: 1,
      border: '2px inset transparent'
    },
    input: {
      padding: 1,
    }
  },
  suggestions: {
    list: {
      backgroundColor: 'white',
      border: '1px solid #F3F4F6',
      fontSize: 14
    },
    item: {
      '&focused': {
        backgroundColor: '#F3F4F6'
      }
    }
  }
};

export default defaultStyle;
