import styled from 'styled-components';

const Button = styled.button`
  color: ${({ theme }) => theme.colors.primaryDarker};
  background: ${({ theme }) => theme.colors.button.secondary};
  border-radius: 18px;
  justify-content: center;
  align-items: center;
  padding: 8.5px 16px;
  gap: 8px;
  justify-self: end;
  position: relative;
  transition: background-color 0.4s ease, opacity 0.4s ease;
  will-change: background-color, opacity;
  justify-self: center;

  &.primary-btn {
    color: ${({ theme }) => theme.colors.primaryDarker};
    background: ${({ theme }) => theme.colors.button.secondary};
  }

  &.secondary-btn {
    /*background: ${({ theme }) => theme.colors.button.cancel};*/
  }

  &.cancel-btn {
    background: ${({ theme }) => theme.colors.button.cancel};
  }

  &:hover:not([disabled]) {
    cursor: pointer;
    background: ${({ theme }) => theme.colors.button.secondaryHover};
  }
`;

export default Button;
