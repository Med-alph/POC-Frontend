const isProd = true
const isLocal = false

export const baseUrl = isProd 
  ? "https://backend-emr.medalph.com" 
  : isLocal 
    ? "http://localhost:9009" 
    : ""
