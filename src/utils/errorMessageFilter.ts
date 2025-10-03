// Utility to filter out "Service Temporarily Unavailable" messages
export const filterErrorMessage = (message: string): string => {
  if (!message) return message;
  
  // List of messages to replace
  const replacements = [
    { from: "Service temporarily unavailable", to: "Service is currently unavailable" },
    { from: "Service Temporarily Unavailable", to: "Service is currently unavailable" },
    { from: "service temporarily unavailable", to: "service is currently unavailable" },
    { from: "SERVICE TEMPORARILY UNAVAILABLE", to: "SERVICE IS CURRENTLY UNAVAILABLE" }
  ];
  
  let filteredMessage = message;
  
  replacements.forEach(({ from, to }) => {
    filteredMessage = filteredMessage.replace(new RegExp(from, 'gi'), to);
  });
  
  return filteredMessage;
};

// Hook to use in components
export const useErrorMessageFilter = () => {
  return { filterErrorMessage };
};







