// ✅ Load Supabase SDK from CDN (ESM version)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
// ✅ Load PapaParse from CDN for CSV parsing
import Papa from 'https://cdn.jsdelivr.net/npm/papaparse/+esm';

// ✅ Initialize Supabase connection
const supabaseUrl = 'https://pbekzjgteinnntprfzhm.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWt6amd0ZWlubm50cHJmemhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNDM5MjYsImV4cCI6MjA2NDkxOTkyNn0.1yRQEisizC-MpDR6B5fJc2Z7Wzk1xcwsySyJMktSsF4';
const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ Track selected files
let salesFile = null;
let inventoryFile = null;

// ✅ Track cancellation state
let uploadCanceled = false;

// ✅ DOM Elements
const salesInput = document.getElementById("salesFileInput");
const inventoryInput = document.getElementById("inventoryFileInput");
const salesList = document.getElementById("salesFileList");
const inventoryList = document.getElementById("inventoryFileList");
const uploadBtn = document.getElementById("uploadBtn");

// ✅ Update upload button state - NEVER disable the button so validation can run
function updateUploadButtonState() {
  // Keep button enabled so we can show validation messages
  uploadBtn.disabled = false;
  
  // Optional: Change button text to indicate state
  if (!(salesFile && inventoryFile)) {
    uploadBtn.textContent = "Upload";
  } else {
    uploadBtn.textContent = "Upload";
  }
}

// ✅ Show preview with remove button
function showFile(file, type) {
  const wrapper = document.createElement("div");
  wrapper.className = "file-row";

  const fileName = document.createElement("span");
  fileName.textContent = `📄 ${file.name}`;
  wrapper.appendChild(fileName);

  const removeBtn = document.createElement("button");
  removeBtn.textContent = "Remove";
  removeBtn.className = "remove-btn";
  removeBtn.onclick = () => {
    if (type === "sales") {
      salesFile = null;
      salesInput.value = "";
      salesList.innerHTML = "";
    } else {
      inventoryFile = null;
      inventoryInput.value = "";
      inventoryList.innerHTML = "";
    }
    updateUploadButtonState();
  };
  wrapper.appendChild(removeBtn);

  if (type === "sales") {
    salesList.innerHTML = "";
    salesList.appendChild(wrapper);
  } else {
    inventoryList.innerHTML = "";
    inventoryList.appendChild(wrapper);
  }

  updateUploadButtonState();
}

// ✅ Input Listeners
salesInput.addEventListener("change", () => {
  if (salesInput.files.length > 0) {
    salesFile = salesInput.files[0];
    showFile(salesFile, "sales");
  }
});

inventoryInput.addEventListener("change", () => {
  if (inventoryInput.files.length > 0) {
    inventoryFile = inventoryInput.files[0];
    showFile(inventoryFile, "inventory");
  }
});

// ✅ Drag-and-drop support
function setupDropArea(areaId, input, type) {
  const dropArea = document.getElementById(areaId);
  if (!dropArea) return;
  
  dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.classList.add("drag-over");
  });
  dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("drag-over");
  });
  dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    dropArea.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      input.files = e.dataTransfer.files;
      if (type === "sales") {
        salesFile = file;
      } else {
        inventoryFile = file;
      }
      showFile(file, type);
    }
  });
}

setupDropArea("drop-area-sales", salesInput, "sales");
setupDropArea("drop-area-inventory", inventoryInput, "inventory");

// ✅ Enhanced field mappings with better detection
const fieldMappings = [
    { keywords: ["fiscal", "Fiscal", "wk", "week", "Week"], result: "fiscalwk" },
    { keywords: ["sum", "Sum", "qty", "quantity", "Quantity", "QTY"], result: "sum_of_qty" },
    { keywords: ["sales", "Sales", "myr", "MYR", "amount", "Amount"], result: "sales_myr" },
    { keywords: ["brand", "Brand", "BRAND"], result: "brand_name" },
    { keywords: ["gender", "Gender", "GENDER"], result: "gender" },
    { keywords: ["stock", "Stock", "TOTSTK", "totstk", "TotStk", "total_stock"], result: "totstk" },
    { keywords: ["activity", "Activity", "ACTIVITY"], result: "activity" },
    { keywords: ["branch", "Branch", "BRANCH"], result: "branch_name" },
    { keywords: ["barcode", "Barcode", "BARCODE"], result: "barcode_c" },
    { keywords: ["category", "Category", "CATEGORY"], result: "category" }
];

// ✅ Define allowed columns for each table
const allowedColumns = {
  sales_cleaned: [
    'fiscalwk', 'sum_of_qty', 'sales_myr', 'brand_name', 'gender', 
    'activity', 'branch_name', 'barcode_c', 'category'
  ],
  inventory_cleaned: [
    'fiscalwk', 'totstk', 'activity', 'branch_name', 'barcode_c', 'category'
  ]
};

function guessFieldName(fieldName) {
  if (!fieldName || typeof fieldName !== 'string') {
    return 'unknown_field';
  }
  
  // Clean the field name first (remove spaces, special characters)
  const cleanFieldName = fieldName.trim().replace(/[^\w\s]/g, '');
  
  for (let mapping of fieldMappings) {
    const found = mapping.keywords.find(keyword => 
      cleanFieldName.toLowerCase().includes(keyword.toLowerCase())
    );
    if (found) {
      return mapping.result;
    }
  }
  
  // If no mapping found, return sanitized field name
  const sanitized = cleanFieldName.toLowerCase().replace(/\s+/g, '_');
  return sanitized || fieldName.toLowerCase().replace(/\s+/g, '_');
}

// Enhanced header mapping with better debugging
function mapAndStandardizeHeaders(rawData, tableName) {
  if (!rawData || rawData.length === 0) {
    throw new Error(`❌ The ${tableName} file contains no data.`);
  }

  const originalHeaders = Object.keys(rawData[0]);

  // Use the appropriate schema based on the table name
  const requiredCols = allowedColumns[tableName];
  if (!requiredCols || requiredCols.length === 0) {
    throw new Error(`❌ No schema defined for table: ${tableName}`);
  }

  const headerMap = {};
  const mappedFields = new Set();

  // Map each original header to a standardized form
  for (const header of originalHeaders) {
    const mapped = guessFieldName(header);
    headerMap[header] = mapped;
    mappedFields.add(mapped);
  }

  // Check if all required columns are present
  const missingFields = requiredCols.filter(col => !mappedFields.has(col));
  if (missingFields.length > 0) {
    throw new Error(`❌ Missing required fields in ${tableName}: ${missingFields.join(', ')}`);
  }

  // Map rows with only the required columns
  const mappedData = rawData.map((row) => {
    const newRow = {};
    for (const key in row) {
      const mappedKey = headerMap[key] || guessFieldName(key);
      if (requiredCols.includes(mappedKey)) {
        newRow[mappedKey] = row[key];
      }
    }
    return newRow;
  });

  return mappedData;
}

// Enhanced sales data cleaning with better validation
function cleanSalesData(salesData) {
  if (salesData.length === 0) {
    return [];
  }
  
  let filteredCount = 0;
  const cleaned = salesData.filter((row, index) => {
    const qtyValue = row.sum_of_qty;
    const salesValue = row.sales_myr;
    
    const hasValidQty = qtyValue !== undefined && qtyValue !== null && qtyValue !== '' && !isNaN(qtyValue);
    const hasValidSales = salesValue !== undefined && salesValue !== null && salesValue !== '' && !isNaN(salesValue);
    
    const isValid = hasValidQty && hasValidSales;
    
    if (!isValid) {
      filteredCount++;
    }
    
    return isValid;
  });
  
  return cleaned;
}

// Enhanced stock data cleaning with better validation
function cleanStockData(stockData) {
  if (stockData.length === 0) {
    return [];
  }
  
  let filteredCount = 0;
  const cleaned = stockData.filter((row) => {
    const stockValue = row.totstk;
    const hasValidStock = stockValue !== undefined && stockValue !== null && stockValue !== '' && !isNaN(stockValue);
    
    if (!hasValidStock) {
      filteredCount++;
    }
    
    return hasValidStock;
  });
  
  return cleaned;
}

// Enhanced uploading to Supabase - single unified prompt for both files
async function uploadToSupabase(tableName, data) {
  try {
    if (uploadCanceled) {
      return null;
    }

    if (data.length === 0) {
      return { success: true, message: `No valid data found in ${tableName} file`, uploaded: 0, duplicatesFound: 0 };
    }

    const cleanedData = data.map(row => {
      const { id, ...rowWithoutId } = row;
      return rowWithoutId;
    });

    let duplicatesFound = 0;
    let finalDataToUpload = [...cleanedData];

    try {
      const { data: existingData } = await supabase
        .from(tableName)
        .select('*');
      
      if (existingData) {
        const existingKeys = new Set(existingData.map(row => `${row.fiscalwk}|${row.barcode_c}|${row.branch_name}`));
        
        finalDataToUpload = cleanedData.filter(row => {
          const rowKey = `${row.fiscalwk}|${row.barcode_c}|${row.branch_name}`;
          return !existingKeys.has(rowKey);
        });
        
        duplicatesFound = cleanedData.length - finalDataToUpload.length;
        if (finalDataToUpload.length === 0) {
          return { success: true, message: `All rows already exist in ${tableName}`, uploaded: 0, duplicatesFound };
        }
      }
    } catch (duplicateCheckError) {
      finalDataToUpload = cleanedData;
      duplicatesFound = 0;
    }

    const batchSize = 1000;
    let totalUploaded = 0;
    let totalErrors = 0;
    
    for (let i = 0; i < finalDataToUpload.length; i += batchSize) {
      if (uploadCanceled) {
        return null;
      }

      const batch = finalDataToUpload.slice(i, i + batchSize);
      try {
        const { data: result, error } = await supabase
          .from(tableName)
          .insert(batch);

        if (error) {
          totalErrors++;
        } else {
          totalUploaded += batch.length;
        }
      } catch (batchError) {
        totalErrors += batch.length;
      }
    }

    return {
      success: totalErrors === 0,
      uploaded: totalUploaded,
      errors: totalErrors,
      duplicatesFound,
      tableName
    };
    
  } catch (e) {
    return { success: false, error: e.message, uploaded: 0, errors: 1, duplicatesFound: 0, tableName };
  }
}

// Enhanced CSV file upload and processing logic - returns detailed results
async function processCsvUpload(file, tableName) {
  try {
    const text = await file.text();
    
    const parseResult = Papa.parse(text, { 
      header: true, 
      skipEmptyLines: true,
      dynamicTyping: true,
      delimitersToGuess: [',', '\t', '|', ';'],
      transformHeader: (header) => header.trim()
    });
    
    const parsedData = parseResult.data;
    
    if (parsedData.length === 0) {
      return { success: false, message: `No data found in ${file.name}`, fileName: file.name, tableName };
    }

    const standardizedData = mapAndStandardizeHeaders(parsedData, tableName);
    const cleanedData = tableName === 'sales_cleaned' ? 
      cleanSalesData(standardizedData) : 
      cleanStockData(standardizedData);

    const uploadResult = await uploadToSupabase(tableName, cleanedData);
    
    return {
      ...uploadResult,
      fileName: file.name,
      originalRows: parsedData.length,
      cleanedRows: cleanedData.length
    };

  } catch (error) {
    return { success: false, error: error.message, fileName: file.name, tableName };
  }
}

// FIXED: Upload button with proper validation - button is never disabled
uploadBtn.addEventListener("click", async () => {
  // Don't disable button until validation passes
  uploadBtn.textContent = "Checking...";
  
  uploadCanceled = false;

  try {
    // 🔒 VALIDATION FIRST: Enhanced file validation with proper error messages
    if (!salesFile && !inventoryFile) {
      alert("⚠️ No files selected. Please upload BOTH sales and inventory files before proceeding.");
      uploadBtn.textContent = "Upload";
      return;
    }

    if (!salesFile) {
      alert("⚠️ Sales file is missing. Please upload the sales CSV file.");
      uploadBtn.textContent = "Upload";
      return;
    }

    if (!inventoryFile) {
      alert("⚠️ Inventory file is missing. Please upload the inventory CSV file.");
      uploadBtn.textContent = "Upload";
      return;
    }

    if (!salesFile.name.endsWith(".csv")) {
      alert("⚠️ Sales file must be in CSV format (.csv). Please check your upload.");
      uploadBtn.textContent = "Upload";
      return;
    }

    if (!inventoryFile.name.endsWith(".csv")) {
      alert("⚠️ Inventory file must be in CSV format (.csv). Please check your upload.");
      uploadBtn.textContent = "Upload";
      return;
    }

    // NOW disable button and start upload process
    uploadBtn.disabled = true;
    uploadBtn.textContent = "Uploading...";

    // Continue with processing if all validations pass
    const filesToProcess = [];
    filesToProcess.push({ file: salesFile, table: "sales_cleaned", type: "Sales" });
    filesToProcess.push({ file: inventoryFile, table: "inventory_cleaned", type: "Inventory" });

    const fileList = filesToProcess.map(f => `• ${f.type}: ${f.file.name}`).join('\n');
    const confirmMessage = `📋 Ready to upload ${filesToProcess.length} file(s):\n\n${fileList}\n\n✨ Smart merge will be used:\n• Skip duplicate rows\n• Add only new data\n• No existing data will be deleted\n\nProceed with upload?`;
    
    const shouldProceed = confirm(confirmMessage);
    
    if (!shouldProceed) {
      alert("ℹ️ Upload canceled by user.");
      uploadBtn.textContent = "Upload";
      uploadBtn.disabled = false;
      return;
    }
    
    const results = [];
    
    for (const fileInfo of filesToProcess) {
      if (uploadCanceled) break;
      
      const result = await processCsvUpload(fileInfo.file, fileInfo.table);
      
      if (result === null) {
        uploadCanceled = true;
        break;
      }
      
      results.push({ ...result, type: fileInfo.type });
    }
    
    if (uploadCanceled) {
      alert("ℹ️ Upload was canceled by user.");
    } else {
      generateUploadSummary(results);
    }
    
  } catch (e) {
    alert(`❌ Upload failed: ${e.message}`);
  }

  // Re-enable button and update state
  uploadBtn.disabled = false;
  updateUploadButtonState();
});

function generateUploadSummary(results) {
  let successCount = 0;
  let errorCount = 0;
  let totalUploaded = 0;
  let totalDuplicates = 0;
  let summaryDetails = [];
  
  results.forEach(result => {
    const isSuccess = result.success || 
                      (result.message && result.message.includes("All rows already exist")) ||
                      (result.uploaded === 0 && result.duplicatesFound > 0);
    
    if (isSuccess) {
      successCount++;
      totalUploaded += result.uploaded || 0;
      totalDuplicates += result.duplicatesFound || 0;
      
      if ((result.uploaded === 0 || !result.uploaded) && result.duplicatesFound > 0) {
        summaryDetails.push(`✅ ${result.type}: 0 new rows uploaded, ${result.duplicatesFound} duplicates skipped`);
      } else if ((result.uploaded === 0 || !result.uploaded) && result.message && result.message.includes("All rows already exist")) {
        summaryDetails.push(`✅ ${result.type}: 0 new rows uploaded, all rows already exist`);
      } else if (result.uploaded > 0) {
        const duplicateMsg = result.duplicatesFound > 0 ? `, ${result.duplicatesFound} duplicates skipped` : '';
        summaryDetails.push(`✅ ${result.type}: ${result.uploaded} new rows uploaded${duplicateMsg}`);
      } else {
        summaryDetails.push(`✅ ${result.type}: No new data to upload`);
      }
    } else {
      errorCount++;
      const errorMsg = result.message || result.error || 'Unknown error';
      summaryDetails.push(`❌ ${result.type}: ${errorMsg}`);
    }
  });
  
  let summaryMessage = `📊 Upload Summary:\n\n`;
  summaryMessage += summaryDetails.join('\n') + '\n\n';
  
  if (errorCount === 0) {
    summaryMessage += `🎉 All files processed successfully!\n`;
    if (totalUploaded > 0) {
      summaryMessage += `Total: ${totalUploaded} new rows added`;
      if (totalDuplicates > 0) {
        summaryMessage += `, ${totalDuplicates} duplicates skipped`;
      }
    } else if (totalDuplicates > 0) {
      summaryMessage += `Total: ${totalDuplicates} duplicate rows skipped, no new data added`;
    } else {
      summaryMessage += `No new data was found to upload`;
    }

    // Redirect to 'forecast.html' after successful upload
    window.location.href = 'forecast.html'; // Redirect to the dashboard page
  } else {
    summaryMessage += `⚠️ ${successCount} successful, ${errorCount} failed`;
    if (totalUploaded > 0) {
      summaryMessage += `\nPartial success: ${totalUploaded} rows uploaded`;
    }
  }
  
  alert(summaryMessage);
}

// ✅ Initialize button state immediately on page load
updateUploadButtonState();