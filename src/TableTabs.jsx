import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import './TableTabs.css';

function TableTabs({ onTablesUpdate, onSelectedTablesUpdate }) {
  const [tables, setTables] = useState([]); // all uploaded tables
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTables, setSelectedTables] = useState([]);
  const [editingTab, setEditingTab] = useState(null); // Track which tab is being renamed
  const [editValue, setEditValue] = useState(''); // Store the new name during editing

  // Update parent component when tables change
  useEffect(() => {
    onTablesUpdate(tables);
  }, [tables, onTablesUpdate]);

  // Update parent component when selected tables change
  useEffect(() => {
    onSelectedTablesUpdate(selectedTables);
  }, [selectedTables, onSelectedTablesUpdate]);

  // Listen for file upload events from the App component
  useEffect(() => {
    const handleFileUploaded = (event) => {
      const file = event.detail.file;
      processFile(file);
    };

    window.addEventListener('fileUploaded', handleFileUploaded);
    
    return () => {
      window.removeEventListener('fileUploaded', handleFileUploaded);
    };
  }, []);

  const processFile = (file) => {
    if (!file || file.type !== 'text/csv') {
      alert('Please upload a valid CSV file.');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        // Filter out the Language column from headers
        const headers = results.meta.fields.filter(header => header !== 'Language');
        
        // Create new data array without the Language column
        const parsedData = results.data.map(row => {
          const newRow = { ...row };
          delete newRow.Language;
          return newRow;
        });

        const newTable = {
          title: file.name,
          headers: headers,
          data: parsedData
        };

        setTables((prev) => [...prev, newTable]);
        setActiveTab(tables.length); // switch to the new tab
      },
    });
  };

  const handleCheckboxChange = (index) => {
    setSelectedTables(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  // Delete a table tab
  const handleDeleteTab = (index, e) => {
    e.stopPropagation(); // Prevent tab selection when clicking delete
    
    // Remove the table from the tables array
    setTables(prev => prev.filter((_, i) => i !== index));
    
    // Update selected tables
    setSelectedTables(prev => {
      // Remove the deleted index from selected tables
      const newSelected = prev.filter(i => i !== index);
      // Adjust indices greater than the deleted index
      return newSelected.map(i => i > index ? i - 1 : i);
    });
    
    // If the active tab is being deleted, set active tab to the previous one or 0
    if (activeTab === index) {
      setActiveTab(Math.max(0, index - 1));
    } else if (activeTab > index) {
      // Adjust active tab index if it's after the deleted tab
      setActiveTab(activeTab - 1);
    }
  };

  // Start renaming a tab
  const handleStartRename = (index, e) => {
    e.stopPropagation(); // Prevent tab selection when clicking rename
    setEditingTab(index);
    setEditValue(tables[index].title);
  };

  // Save the new name
  const handleSaveRename = (index) => {
    if (editValue.trim() === '') return; // Don't save empty names
    
    setTables(prev => {
      const newTables = [...prev];
      newTables[index] = {
        ...newTables[index],
        title: editValue.trim()
      };
      return newTables;
    });
    
    setEditingTab(null);
  };

  const handleRenameKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      handleSaveRename(index);
    } else if (e.key === 'Escape') {
      setEditingTab(null);
    }
  };

  // Don't render anything if no tables are loaded
  if (tables.length === 0) {
    return (
      <div className="empty-state">
        <p>No Roversa data has been uploaded yet. Use the upload button to upload your data in .csv format.</p>
      </div>
    );
  }

  return (
    <div className="table-tabs-container">
      <div className="tabs-header">
        <div className="tabs-container">
          {tables.map((table, index) => (
            <div key={index} className="tab-item">
              <input 
                type="checkbox" 
                checked={selectedTables.includes(index)}
                onChange={() => handleCheckboxChange(index)}
                className="table-checkbox"
              />
              <div className="tab-content">
                {editingTab === index ? (
                  <div className="tab-rename-container">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => handleRenameKeyDown(e, index)}
                      onBlur={() => handleSaveRename(index)}
                      autoFocus
                      className="tab-rename-input"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveTab(index)}
                    className={`tab-button ${activeTab === index ? 'active' : ''}`}
                  >
                    {table.title}
                  </button>
                )}
                <div className="tab-actions">
                  <button 
                    className="tab-rename-btn"
                    onClick={(e) => handleStartRename(index, e)}
                    title="Rename"
                  >
                    ✎
                  </button>
                  <button 
                    className="tab-delete-btn"
                    onClick={(e) => handleDeleteTab(index, e)}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Render Active Table */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                {tables[activeTab].headers.map((header, i) => (
                  <th key={i}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tables[activeTab].data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {tables[activeTab].headers.map((header, colIndex) => (
                    <td key={colIndex}>{row[header]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TableTabs;
