import React from 'react';
import styled from 'styled-components';

const AddressInputWrapper = styled.input`
  width: 100%;
  align-self: center;
  box-sizing: border-box;
  border: transparent;
  font-weight: 500;
  font-size: 16px;
  text-align: center;
  padding: 12px 10px;

  &:disabled {
    background-color: ${({ theme }) => theme.colors.background};
    color: white;
  }

  &.invalid {
    outline-color: ${({ theme }) => theme.colors.error};
  }
`;

interface AddressInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  valid?: boolean;
  onInputChange?: (address: string) => void;
}

const AddressInput = ({ valid, onInputChange, ...props }: AddressInputProps): JSX.Element => (
  <AddressInputWrapper
    type="text"
    placeholder="Account address..."
    className={valid === undefined || valid ? '' : 'invalid'}
    onInput={(e) => onInputChange && onInputChange((e.target as HTMLInputElement).value)}
    {...props}
  />
);

export default AddressInput;
