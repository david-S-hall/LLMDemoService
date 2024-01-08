import React, { useState } from 'react';
import { Col, InputNumber, Row, Slider, Space } from 'antd';


const IntegerSlider = ({min, max, defaultValue}) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  const onChange = (newValue) => {
    setInputValue(newValue);
  };

  return (
    <Row>
      <Col flex="23">
        <Slider
          min={min}
          max={max}
          onChange={onChange}
          value={typeof inputValue === 'number' ? inputValue : 0}
        />
      </Col>
      <Col flex="auto">
        <InputNumber
          min={min}
          max={max}
        //   style={{ margin: '0 16px' }}
          value={inputValue}
          onChange={onChange}
        />
      </Col>
    </Row>
  );
};

export default IntegerSlider;
