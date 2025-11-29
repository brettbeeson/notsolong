import { keyframes } from "@mui/material/styles";

export const attentionPulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(63, 42, 252, 0.45);
    transform: scale(1);
  }
  70% {
    box-shadow: 0 0 0 12px rgba(63, 42, 252, 0);
    transform: scale(1.05);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(63, 42, 252, 0);
    transform: scale(1);
  }
`;

export const slideForward = keyframes`
  0% {
    opacity: 0;
    transform: translateX(48px);
    filter: blur(10px);
  }
  60% {
    opacity: 1;
    filter: blur(0);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
    filter: blur(0);
  }
`;

export const slideBackward = keyframes`
  0% {
    opacity: 0;
    transform: translateX(-48px);
    filter: blur(10px);
  }
  60% {
    opacity: 1;
    filter: blur(0);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
    filter: blur(0);
  }
`;
