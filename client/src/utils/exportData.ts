import { STORAGE_KEYS } from "./constants";

// Get all data from localStorage
export const getAllData = () => {
  const data: Record<string, any> = {};
  
  Object.values(STORAGE_KEYS).forEach(key => {
    const item = localStorage.getItem(key);
    if (item) {
      try {
        data[key] = JSON.parse(item);
      } catch (error) {
        console.error(`Error parsing ${key} from localStorage:`, error);
        data[key] = null;
      }
    }
  });
  
  return data;
};

// Export data as a downloadable JSON file
export const exportData = () => {
  const data = getAllData();
  
  // Remove sensitive information
  if (data[STORAGE_KEYS.USER]) {
    delete data[STORAGE_KEYS.USER].password;
  }
  delete data[STORAGE_KEYS.AUTH_TOKEN];
  
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  
  // Generate filename with current date
  const date = new Date().toISOString().split("T")[0];
  downloadAnchorNode.setAttribute("download", `rabbit_farm_data_${date}.json`);
  
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
  
  return true;
};

// Export data as CSV
export const exportDataAsCSV = (data: any[], filename: string) => {
  if (!data || !data.length) {
    return false;
  }
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Convert data to CSV
  const csvRows = [
    // Headers row
    headers.join(","),
    
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        
        // Handle different data types
        if (value === null || value === undefined) {
          return "";
        }
        
        if (typeof value === "object") {
          return JSON.stringify(value).replace(/"/g, '""');
        }
        
        if (typeof value === "string") {
          // Escape commas, quotes, and newlines
          return `"${value.replace(/"/g, '""')}"`;
        }
        
        return value;
      }).join(",")
    )
  ].join("\n");
  
  // Create and trigger download
  const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const downloadLink = document.createElement("a");
  downloadLink.setAttribute("href", url);
  downloadLink.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  
  return true;
};
