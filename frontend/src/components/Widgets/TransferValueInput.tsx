import React from 'react';
import styled from 'styled-components';

import { getProposalPrice } from 'utils/getProposalPrice';

const TransferValueInputWrapper = styled.input`
  width: 12ch;
  height: 100%;
  align-self: center;
  box-sizing: border-box;
  border: transparent;
  font-weight: 500;
  font-size: 16px;
  text-align: right;
  padding: 8px 4px;

  &:disabled {
    background-color: ${({ theme }) => theme.colors.background};
    color: white;
  }

  &.invalid {
    outline-color: ${({ theme }) => theme.colors.error};
  }
`;

interface TransferValueInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  sufficient?: boolean;
  proposalPrice?: number;
  onInputChange?: (value: number) => void;
}

const TransferValueInput = ({
  sufficient,
  proposalPrice,
  onInputChange,
  ...props
}: TransferValueInputProps): JSX.Element => (
  <TransferValueInputWrapper
    type="number"
    placeholder={`Fee >= ${proposalPrice ?? 0}`}
    className={sufficient !== false ? '' : 'invalid'}
    onInput={(e) => onInputChange?.(parseInt((e.target as HTMLInputElement).value, 10))}
    {...props}
  />
);

export default TransferValueInput;
