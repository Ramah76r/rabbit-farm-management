import { STORAGE_KEYS } from "./constants";

// Import data from JSON file
export const importData = async (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        
        // Validate imported data structure
        const validDataKeys = Object.values(STORAGE_KEYS).filter(key => 
          key !== STORAGE_KEYS.AUTH_TOKEN && key !== STORAGE_KEYS.USER
        );
        
        let hasValidData = false;
        
        // Store each valid data section
        validDataKeys.forEach(key => {
          if (jsonData[key] && Array.isArray(jsonData[key])) {
            localStorage.setItem(key, JSON.stringify(jsonData[key]));
            hasValidData = true;
          }
        });
        
        if (!hasValidData) {
          reject(new Error("ملف غير صالح: لا توجد بيانات صالحة للاستيراد"));
          return;
        }
        
        resolve(true);
      } catch (error) {
        reject(new Error("حدث خطأ أثناء معالجة الملف: " + (error as Error).message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("حدث خطأ أثناء قراءة الملف"));
    };
    
    reader.readAsText(file);
  });
};

// Merge imported data with existing data
export const mergeData = async (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        
        // Validate imported data structure
        const validDataKeys = Object.values(STORAGE_KEYS).filter(key => 
          key !== STORAGE_KEYS.AUTH_TOKEN && key !== STORAGE_KEYS.USER
        );
        
        let hasValidData = false;
        
        // Merge each valid data section
        validDataKeys.forEach(key => {
          if (jsonData[key] && Array.isArray(jsonData[key])) {
            // Get existing data
            const existingDataStr = localStorage.getItem(key);
            let existingData: any[] = [];
            
            if (existingDataStr) {
              try {
                existingData = JSON.parse(existingDataStr);
              } catch (e) {
                console.error(`Error parsing existing data for ${key}:`, e);
              }
            }
            
            // Create a map of existing IDs
            const existingIds = new Set(existingData.map(item => item.id));
            
            // Merge new data (add if ID doesn't exist, update if it does)
            const mergedData = [
              ...existingData,
              ...jsonData[key].filter((item: any) => !existingIds.has(item.id))
            ];
            
            localStorage.setItem(key, JSON.stringify(mergedData));
            hasValidData = true;
          }
        });
        
        if (!hasValidData) {
          reject(new Error("ملف غير صالح: لا توجد بيانات صالحة للدمج"));
          return;
        }
        
        resolve(true);
      } catch (error) {
        reject(new Error("حدث خطأ أثناء معالجة الملف: " + (error as Error).message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("حدث خطأ أثناء قراءة الملف"));
    };
    
    reader.readAsText(file);
  });
};
