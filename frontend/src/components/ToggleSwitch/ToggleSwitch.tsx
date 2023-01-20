import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.label`
  cursor: pointer;
  display: inline-block;

  *,
  *:before,
  *:after {
    box-sizing: border-box;
  }

  input.toggle-checkbox {
    &:checked + div.toggle-switch {
      background: #56c080;
    }

    &:checked + div.toggle-switch:before {
      left: 30px;
    }

    position: absolute;
    visibility: hidden;
  }

  div.toggle-switch {
    display: inline-block;
    background: #ccc;
    border-radius: 16px;
    width: 58px;
    height: 32px;
    position: relative;
    vertical-align: middle;
    transition: background 0.25s;

    &:before,
    &:after {
      content: '';
    }

    &:before {
      display: block;
      background: linear-gradient(to bottom, #fff 0%, #eee 100%);
      border-radius: 50%;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
      width: 24px;
      height: 24px;
      position: absolute;
      top: 4px;
      left: 4px;
      transition: left 0.25s;
    }
  }

  &:hover div.toggle-switch:before {
    background: linear-gradient(to bottom, #fff 0%, #fff 100%);
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
  }

  span.toggle-label {
    margin-left: 5px;
    position: relative;
    top: 2px;
  }
`;

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleSwitch = ({ checked, onChange }: ToggleSwitchProps) => (
  <Wrapper>
    <input
      type="checkbox"
      className="toggle-checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <div className="toggle-switch" />
    <span className="toggle-label">Show executed</span>
  </Wrapper>
);

export default ToggleSwitch;
