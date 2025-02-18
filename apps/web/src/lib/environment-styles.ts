export const ENVIRONMENT_COLORS = {
  development: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    border: "border-emerald-500/20",
    icon: "bg-emerald-500",
  },
  staging: {
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    border: "border-amber-500/20",
    icon: "bg-amber-500",
  },
  production: {
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    border: "border-blue-500/20",
    icon: "bg-blue-500",
  },
  default: {
    bg: "bg-teal-500/10",
    text: "text-gray-300",
    border: "border-gray-500/20",
    icon: "bg-gray-500",
  },
};

export const getEnvironmentStyle = (environmentName: string) => {
  const name = environmentName.toLowerCase();
  if (name.includes("dev") || name.includes("development")) {
    return ENVIRONMENT_COLORS.development;
  }
  if (name.includes("staging") || name.includes("test")) {
    return ENVIRONMENT_COLORS.staging;
  }
  if (name.includes("prod") || name.includes("production")) {
    return ENVIRONMENT_COLORS.production;
  }
  return ENVIRONMENT_COLORS.default;
};
