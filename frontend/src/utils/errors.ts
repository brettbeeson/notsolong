import axios from "axios";

export const getErrorMessage = (
  error: unknown,
  fallback = "Something went wrong"
) => {
  if (axios.isAxiosError(error)) {
    if (typeof error.response?.data === "string") {
      return error.response.data;
    }
    if (error.response?.data?.detail) {
      return error.response.data.detail as string;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};
