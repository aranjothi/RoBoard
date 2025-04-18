import React, { useRef, useState } from 'react';
import TableTabs from './TableTabs';
import Graph from './Graph';
import './App.css';
import roboardLogo from './assets/RoBoard.png';

function App() {
  const fileInputRef = useRef(null);
  const [tables, setTables] = useState([]);
  const [selectedTables, setSelectedTables] = useState([]);
  const [showCodePopup, setShowCodePopup] = useState(false);
  const [showFaqPopup, setShowFaqPopup] = useState(false);
  const [showTutorialPopup, setShowTutorialPopup] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [idealCode, setIdealCode] = useState('');

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const event = new CustomEvent('fileUploaded', { detail: { file } });
      window.dispatchEvent(event);
      e.target.value = '';
    }
  };

  const handleTablesUpdate = (newTables) => {
    setTables(newTables);
  };

  const handleSelectedTablesUpdate = (newSelectedTables) => {
    setSelectedTables(newSelectedTables);
  };

  const handleCodeInputChange = (e) => {
    setCodeInput(e.target.value);
    setCodeError('');
  };

  const validateCode = (code) => {
    const validCommands = ['forward', 'right', 'left', 'reverse'];
    const commands = code.toLowerCase().split(' ');
    return commands.every(cmd => validCommands.includes(cmd));
  };

  const handleCodeSubmit = () => {
    if (!codeInput.trim()) {
      setCodeError('Please enter an input.');
      return;
    }
    if (!validateCode(codeInput)) {
      setCodeError('Invalid input. Only use: forward, right, left, reverse');
      return;
    }
    console.log('Setting ideal code:', codeInput);
    setIdealCode(codeInput);
    setShowCodePopup(false);
    setCodeInput('');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <img src={roboardLogo} alt="RoBoard Logo" className="logo-image" />
          <span>RoBoard</span>
        </div>
        <div className="button-container">
          <button className="upload-button" onClick={handleUploadClick}>Upload</button>
          <button className="code-button" onClick={() => setShowCodePopup(true)}>Ideal Code</button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv" 
            style={{ display: 'none' }} 
          />
        </div>
        <div className="header-right">
          <div className="button-container">
            <button className="tutorial-button" onClick={() => setShowTutorialPopup(true)}>Tutorial</button>
            <button className="faq-button" onClick={() => setShowFaqPopup(true)}>FAQ</button>
          </div>
        </div>
      </header>
      
      <main className="app-content">
        <div className="content-layout">
          <div className="tables-section">
            <TableTabs 
              onTablesUpdate={handleTablesUpdate}
              onSelectedTablesUpdate={handleSelectedTablesUpdate}
            />
          </div>
          <div className="graph-section">
            <div className="graph-container">
              {tables.length > 0 ? (
                <Graph 
                  tables={tables} 
                  selectedTables={selectedTables} 
                  idealCode={idealCode}
                />
              ) : (
                <div className="no-data-message">
                  <p>Upload a CSV file to see graphs</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="app-footer">
        <p>Have any feedback? Fill out <a href="https://forms.office.com/r/B5JUYkrH6B" target="_blank" rel="noopener noreferrer">this form</a></p>
      </footer>

      {showCodePopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>Enter the Ideal Code</h2>
            <p className="popup-description">
              Enter code separated by spaces. Valid commands are: forward, right, left, reverse
            </p>
            <p className="popup-example">
              Example: reverse right right forward left
            </p>
            
            {/* Current Ideal Code Display */}
            {idealCode && (
              <div className="current-ideal-code">
                <h3>Current Ideal Code:</h3>
                <div className="code-display">
                  {idealCode}
                </div>
              </div>
            )}
            
            <input
              type="text"
              value={codeInput}
              onChange={handleCodeInputChange}
              placeholder="Enter your code..."
              className="code-input"
            />
            {codeError && <p className="error-message">{codeError}</p>}
            <div className="popup-buttons">
              <button className="cancel-button" onClick={() => {
                setShowCodePopup(false);
                setCodeInput('');
                setCodeError('');
              }}>Cancel</button>
              <button className="submit-button" onClick={handleCodeSubmit}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {showFaqPopup && (
        <div className="popup-overlay">
          <div className="popup-content faq-popup">
            <h2>Frequently Asked Questions</h2>
            <div className="faq-content">
              <p><b>Q: What is RoBoard?</b></p>
              <p className="popup-description">RoBoard is a tool designed specifically for Roversa robots. Our goal is to help teachers further analyze student code and determine whether students are struggling with certain computer science concepts or topics.</p>
              <p><b>Q: How does RoBoard work?</b></p>
              <p className="popup-description">RoBoard uses a combination of a table and graph to visualize student code. The table shows the raw data, including the code that each student entered and the recorded timestamps for button presses, and the graph shows the time it took for each student to complete the code along with a comparison to the ideal code (if applicable).</p>
              <p><b>Q: How do I start using RoBoard?</b></p>
              <p className="popup-description">To use RoBoard, you need to upload CSV files from each Roversa robot's micro:bit. You can do so by: </p> 
              <p className="popup-description"> 1. Plugging in each robot's micro:bit to your computer</p>
              <p className="popup-description"> 2. Navigating to the "MICROBIT" folder in your directory</p>
              <p className="popup-description"> 3. Opening the "MY_DATA.htm" file (should open in your default browser)</p>
              <p className="popup-description"> 4. Downloading the file (as a .csv file)</p>
              <p className="popup-description"> 5. Uploading the .csv file to RoBoard</p>
              <p className="popup-description"> 6. Refer to the "Tutorial" tab for information on using RoBoard</p>
            </div>
            <div className="popup-buttons">
              <button className="cancel-button" onClick={() => setShowFaqPopup(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showTutorialPopup && (
        <div className="popup-overlay">
          <div className="popup-content tutorial-popup">
            <h2>Tutorial</h2>
            <div className="tutorial-content">
              <div className="tutorial-step">
                <h3>Step 1: Upload Data</h3>
                <p>Click the "Upload" button to select CSV files from your Roversa robots.</p>
              </div>
              
              <div className="tutorial-step">
                <h3>Step 2: Select Tables</h3>
                <p>In the left panel, check the checkboxes next to the tables you want to analyze. You can select multiple tables to compare data.</p>
              </div>
              
              <div className="tutorial-step">
                <h3>Step 3: Set Ideal Code (Optional)</h3>
                <p>Click the "Ideal Code" button to enter the correct solution. This will be used to compare student solutions.</p>
                <p>Example: <code>forward right left reverse</code></p>
              </div>
              
              <div className="tutorial-step">
                <h3>Step 4: View Graphs</h3>
                <p>The right panel displays three types of graphs:</p>
                <ul>
                  <li><strong>Compare to Ideal Code:</strong> Compares each student's solution to the ideal code you entered.</li>
                  <li><strong>Successful Runs:</strong> Shows how many students matched the ideal code exactly, and what run number they did so.</li>
                  <li><strong>Time Between Runs:</strong> Shows the time intervals between consecutive runs for each student.</li>
                </ul>
              </div>
              
              <div className="tutorial-step">
                <h3>Step 5: Analyze Data</h3>
                <p>Use the graphs and statistics provided to identify patterns, common mistakes, and areas where students may need additional instruction.</p>
              </div>
            </div>
            <div className="popup-buttons">
              <button className="cancel-button" onClick={() => setShowTutorialPopup(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
