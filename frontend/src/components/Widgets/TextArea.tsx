import styled from 'styled-components';

const TextArea = styled.textarea`
  width: 100%;
  height: 150px;
  align-self: center;
  box-sizing: border-box;
  border: transparent;
  font-weight: 500;
  font-size: 16px;
  padding: 12px 20px;
  resize: none;

  &:disabled {
    background-color: ${({ theme }) => theme.colors.background};
    color: white;
  }
`;

export default TextArea;
