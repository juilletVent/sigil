import styled from "styled-components";

export const NavBarContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 2px 6px;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  z-index: 1000;

  @media (prefers-color-scheme: dark) {
    background-color: #1f1f1f;
    border-bottom-color: #3a3a3a;
  }
`;

export const BackButton = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

