import axios from "axios";

const formatFieldMessage = (field: string | undefined, message: string) => {
  if (!field || field === "non_field_errors") {
    return message;
  }
  const label = field.replace(/_/g, " ");
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}: ${message}`;
};

export const getErrorMessage = (
  error: unknown,
  fallback = "Something went wrong"
) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string") {
      return data;
    }
    if (data && typeof data === "object") {
      if (typeof (data as Record<string, unknown>).detail === "string") {
        return (data as Record<string, string>).detail;
      }
      const entries = Object.entries(data as Record<string, unknown>);
      if (entries.length) {
        const [field, value] = entries[0];
        if (
          Array.isArray(value) &&
          value.length &&
          typeof value[0] === "string"
        ) {
          return formatFieldMessage(field, value[0]);
        }
        if (typeof value === "string") {
          return formatFieldMessage(field, value);
        }
      }
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};
