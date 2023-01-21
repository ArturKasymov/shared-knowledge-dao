import React from 'react';
import styled from 'styled-components';

interface AddressInputProps {
  valid: boolean;
  onAddressChange: (address: string) => void;
}

const AddressInput = styled.input.attrs(({ valid, onAddressChange }: AddressInputProps) => ({
  type: 'text',
  placeholder: 'Account address...',
  className: valid ? '' : 'invalid',
  onInput: (e: Event) => onAddressChange((e.target as HTMLInputElement).value),
}))`
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

export default AddressInput;
