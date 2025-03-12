import styled from 'styled-components';

// Form group container
export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

// Form label
export const Label = styled.label`
  font-size: 14px;
  color: var(--text-secondary);
`;

// Form input
export const Input = styled.input`
  background-color: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px 12px;
  color: var(--text-color);
  font-size: 14px;

  &:focus {
    border-color: var(--accent-color);
    outline: none;
  }
`;

// Color input container
export const ColorInput = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  input[type="color"] {
    -webkit-appearance: none;
    border: none;
    width: 32px;
    height: 32px;
    cursor: pointer;
    background: none;

    &::-webkit-color-swatch-wrapper {
      padding: 0;
    }

    &::-webkit-color-swatch {
      border: 1px solid var(--border-color);
      border-radius: 4px;
    }
  }
`;

// Select dropdown
export const Select = styled.select`
  background-color: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px 12px;
  color: var(--text-color);
  font-size: 14px;

  &:focus {
    border-color: var(--accent-color);
    outline: none;
  }
`;

// Checkbox container
export const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// Checkbox input
export const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  cursor: pointer;
  width: 16px;
  height: 16px;
`;

export default {
  FormGroup,
  Label,
  Input,
  ColorInput,
  Select,
  CheckboxContainer,
  Checkbox
}; 