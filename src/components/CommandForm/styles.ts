import styled from "styled-components";

export const FormContainer = styled.div`
  max-width: 600px;
  width: 100%;
  padding: 0 24px;
`;

export const FormTitle = styled.h2`
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 24px 0;
  color: #262626;

  @media (prefers-color-scheme: dark) {
    color: #e6e6e6;
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
`;
