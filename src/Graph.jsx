import React, { useEffect, useRef, useState } from 'react';
import './Graph.css';

// Define styles object
const styles = {
  background: 'transparent',
  axisColor: 'rgba(255, 255, 255, 0.1)',
  gridColor: 'rgba(255, 255, 255, 0.05)',
  textColor: 'rgba(255, 255, 255, 0.7)',
  titleColor: 'rgba(255, 255, 255, 0.9)',
  font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  tableColors: [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#6366f1', // Indigo
    '#ec4899', // Pink
    '#14b8a6'  // Teal
  ]
};

function Graph({ tables, selectedTables, idealCode }) {
  const canvasRef = useRef(null);
  const legendRef = useRef(null);
  const [activeTab, setActiveTab] = useState('time'); // 'time', 'score', or 'match'
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);
  const [legendPosition, setLegendPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [legendData, setLegendData] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Set canvas size accounting for device pixel ratio
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Calculate content height based on active tab
    let calculatedContentHeight = rect.height;
    
    if (activeTab === 'time') {
      calculatedContentHeight = calculateTimeGraphHeight(rect.width, selectedTables.length);
    } else if (activeTab === 'score') {
      calculatedContentHeight = calculateScoreGraphHeight(rect.width, selectedTables.length);
    } else if (activeTab === 'match') {
      calculatedContentHeight = calculateMatchGraphHeight(rect.width, selectedTables.length);
    }
    
    setContentHeight(calculatedContentHeight);
    setCanvasHeight(rect.height);
    setIsScrollable(calculatedContentHeight > rect.height);
    
    // Set initial legend position if not already set
    if (legendPosition.x === 0 && legendPosition.y === 0) {
      setLegendPosition({
        x: rect.width - 200,
        y: 60
      });
    }
    
    // Draw the graph with scroll position
    if (activeTab === 'time') {
      drawTimeGraph(ctx, rect.width, calculatedContentHeight, scrollPosition);
    } else if (activeTab === 'score') {
      drawScoreGraph(ctx, rect.width, calculatedContentHeight, scrollPosition);
    } else if (activeTab === 'match') {
      drawMatchGraph(ctx, rect.width, calculatedContentHeight, scrollPosition);
    }
  }, [tables, selectedTables, activeTab, idealCode, scrollPosition]);

  // Handle mouse down on legend
  const handleLegendMouseDown = (e) => {
    setIsDragging(true);
    const rect = legendRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - canvasRect.left - dragOffset.x;
      const newY = e.clientY - canvasRect.top - dragOffset.y;
      
      setLegendPosition({
        x: Math.max(0, Math.min(newX, canvasRect.width - 200)),
        y: Math.max(0, Math.min(newY, canvasRect.height - 200))
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Calculate height needed for time graph
  const calculateTimeGraphHeight = (width, tableCount) => {
    const baseHeight = 400; // Minimum height
    const legendHeight = tableCount * 25 + 30; // Height for legend items
    return Math.max(baseHeight, 200 + legendHeight);
  };

  // Calculate height needed for score graph
  const calculateScoreGraphHeight = (width, tableCount) => {
    const baseHeight = 400; // Minimum height
    const legendHeight = tableCount * 25 + 30; // Height for legend items
    return Math.max(baseHeight, 200 + legendHeight);
  };

  // Calculate height needed for match graph
  const calculateMatchGraphHeight = (width, tableCount) => {
    const baseHeight = 400; // Minimum height
    const barHeight = 30;
    const barSpacing = 10;
    const totalBarHeight = (barHeight + barSpacing) * tableCount + 100; // Add padding
    return Math.max(baseHeight, 200 + totalBarHeight);
  };

  // Handle scroll events
  const handleScroll = (e) => {
    if (!isScrollable) return;
    
    const newPosition = Math.max(0, Math.min(scrollPosition + e.deltaY, contentHeight - canvasHeight));
    setScrollPosition(newPosition);
  };

  const drawTimeGraph = (ctx, width, height, scrollPos) => {
    // Process data from selected tables
    const allPlayTimes = [];
    
    // First, collect all data points from all selected tables
    selectedTables.forEach((tableIndex, colorIndex) => {
      const table = tables[tableIndex];
      
      // Find the Button and Time (seconds) columns
      const buttonIndex = table.headers.findIndex(header => 
        header.toLowerCase().includes('button'));
      const timeIndex = table.headers.findIndex(header => 
        header === 'Time (seconds)');
      
      if (buttonIndex === -1 || timeIndex === -1) return;
      
      const buttonHeader = table.headers[buttonIndex];
      const timeHeader = table.headers[timeIndex];
      
      // Find all "Play" button presses and their times
      let playTimes = [];
      
      for (let i = 0; i < table.data.length; i++) {
        const row = table.data[i];
        if (row[buttonHeader] === 'Play') {
          const timeValue = parseFloat(row[timeHeader]);
          if (!isNaN(timeValue)) {
            playTimes.push(timeValue);
          }
        }
      }
      
      // Calculate time differences between consecutive Play button presses
      let timeDiffs = [];
      for (let i = 1; i < playTimes.length; i++) {
        const diff = Math.abs(playTimes[i] - playTimes[i-1]);
        timeDiffs.push({
          tableName: table.title,
          runNumber: i,
          timeDiff: diff,
          color: styles.tableColors[colorIndex % styles.tableColors.length]
        });
      }
      
      allPlayTimes.push(...timeDiffs);
    });
    
    // If no data points, show a message
    if (allPlayTimes.length === 0) {
      ctx.fillStyle = styles.textColor;
      ctx.font = `14px ${styles.font}`;
      ctx.textAlign = 'center';
      ctx.fillText('No recorded runs (plays) found in the selected tables.', width / 2, height / 2);
      return;
    }
    
    // Define graph area
    const padding = 60;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    
    // Find min and max values for scaling
    const times = allPlayTimes.map(dp => dp.timeDiff);
    const minTime = 0; // Always start at 0
    const maxTimeRaw = Math.max(...times);
    const maxTime = Math.ceil(maxTimeRaw / 10) * 10; // Round up to nearest 10
    
    // Group data points by run number
    const runGroups = {};
    allPlayTimes.forEach(dp => {
      if (!runGroups[dp.runNumber]) {
        runGroups[dp.runNumber] = [];
      }
      runGroups[dp.runNumber].push(dp);
    });
    
    // Sort run numbers
    const sortedRunNumbers = Object.keys(runGroups).map(Number).sort((a, b) => a - b);
    const maxRunNumber = Math.max(...sortedRunNumbers);
    
    // Add spacing from y-axis
    const xAxisSpacing = 20; // Pixels to add between y-axis and first data point
    
    // Draw grid
    const gridLines = 8;
    ctx.strokeStyle = styles.gridColor;
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= gridLines; i++) {
      const y = padding + (graphHeight * i) / gridLines - scrollPos;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= maxRunNumber; i++) {
      const x = padding + xAxisSpacing + (graphWidth - xAxisSpacing) * i / maxRunNumber;
      ctx.beginPath();
      ctx.moveTo(x, padding - scrollPos);
      ctx.lineTo(x, height - padding - scrollPos);
      ctx.stroke();
    }
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = styles.axisColor;
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.moveTo(padding, height - padding - scrollPos);
    ctx.lineTo(width - padding, height - padding - scrollPos);
    
    // Y-axis
    ctx.moveTo(padding, padding - scrollPos);
    ctx.lineTo(padding, height - padding - scrollPos);
    ctx.stroke();
    
    // Draw Y-axis labels
    ctx.fillStyle = styles.textColor;
    ctx.font = `13px ${styles.font}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= gridLines; i++) {
      const y = padding + (graphHeight * i) / gridLines - scrollPos;
      const value = maxTime - ((maxTime - minTime) * i) / gridLines;
      ctx.fillText(value.toFixed(1), padding - 10, y);
    }
    
    // Draw X-axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = styles.textColor;
    
    sortedRunNumbers.forEach((runNumber) => {
      const x = padding + xAxisSpacing + (graphWidth - xAxisSpacing) * (runNumber - 1) / maxRunNumber;
      ctx.fillText(`Runs ${runNumber}-${runNumber + 1}`, x, height - padding + 10 - scrollPos);
    });
    
    // Prepare table data
    const tableData = {};
    selectedTables.forEach((tableIndex, colorIndex) => {
      const table = tables[tableIndex];
      tableData[table.title] = {
        color: styles.tableColors[colorIndex % styles.tableColors.length],
        points: []
      };
    });
    
    // Add points to each table's data
    sortedRunNumbers.forEach((runNumber) => {
      const x = padding + xAxisSpacing + (graphWidth - xAxisSpacing) * (runNumber - 1) / maxRunNumber;
      
      runGroups[runNumber].forEach(dp => {
        const y = height - padding - ((dp.timeDiff - minTime) / (maxTime - minTime) * graphHeight) - scrollPos;
        tableData[dp.tableName].points.push({ x, y, timeDiff: dp.timeDiff });
      });
    });
    
    // Draw lines and points
    Object.values(tableData).forEach(table => {
      // Draw lines with gradient
      if (table.points.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = table.color;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        table.points.forEach((point, i) => {
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        
        ctx.stroke();
      }
      
      // Draw data points
      table.points.forEach(point => {
        // Draw point shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        
        // Draw outer circle
        ctx.beginPath();
        ctx.fillStyle = styles.background;
        ctx.strokeStyle = table.color;
        ctx.lineWidth = 2.5;
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw inner circle
        ctx.beginPath();
        ctx.fillStyle = table.color;
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        
        // Draw value label
        ctx.fillStyle = styles.textColor;
        ctx.font = `12px ${styles.font}`;
        ctx.textAlign = 'center';
        ctx.fillText(point.timeDiff.toFixed(1), point.x, point.y - 25);
      });
    });
    
    // Draw axis labels
    ctx.fillStyle = styles.textColor;
    ctx.font = `bold 14px ${styles.font}`;
    ctx.textAlign = 'center';
    
    // X-axis label
    ctx.fillText('Run #', width / 2, height - padding / 2 - scrollPos);
    
    // Y-axis label (rotated)
    ctx.save();
    ctx.translate(padding / 15, height / 2 - scrollPos);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Time Between Runs (s)', 0, 0);
    ctx.restore();
    
    // Prepare table data for legend
    const legendItems = [];
    selectedTables.forEach((tableIndex, colorIndex) => {
      const table = tables[tableIndex];
      legendItems.push({
        name: table.title,
        color: styles.tableColors[colorIndex % styles.tableColors.length]
      });
    });
    
    setLegendData(legendItems);
  };

  const drawScoreGraph = (ctx, width, height, scrollPos) => {
    if (!idealCode) {
      ctx.fillStyle = styles.textColor;
      ctx.font = `14px ${styles.font}`;
      ctx.textAlign = 'center';
      ctx.fillText('Please submit an ideal code to see similarity scores.', width / 2, height / 2);
      return;
    }

    const idealCommands = idealCode.toLowerCase().split(' ');
    const allScores = [];
    
    selectedTables.forEach((tableIndex, colorIndex) => {
      const table = tables[tableIndex];
      
      // Find the Button column
      const buttonIndex = table.headers.findIndex(header => 
        header.toLowerCase().includes('button'));
      
      if (buttonIndex === -1) return;
      
      const buttonHeader = table.headers[buttonIndex];
      const programHeader = table.headers[buttonIndex + 1]; // Program is in the cell to the right of Play
      
      let scores = [];
      let currentRun = 1;
      
      for (let i = 0; i < table.data.length; i++) {
        const row = table.data[i];
        if (row[buttonHeader] === 'Play') {
          const studentCode = row[programHeader]?.toLowerCase().split(' ') || [];
          
          // Calculate similarity score
          const score = calculateSimilarityScore(studentCode, idealCommands);
          
          scores.push({
            tableName: table.title,
            runNumber: currentRun,
            score: score,
            color: styles.tableColors[colorIndex % styles.tableColors.length]
          });
          
          currentRun++;
        }
      }
      
      allScores.push(...scores);
    });

    if (allScores.length === 0) {
      ctx.fillStyle = styles.textColor;
      ctx.font = `14px ${styles.font}`;
      ctx.textAlign = 'center';
      ctx.fillText('No runs found in the selected tables.', width / 2, height / 2);
      return;
    }

    // Define graph area
    const padding = 60;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Find min and max values for scaling
    const scores = allScores.map(dp => dp.score);
    const minScore = 0; // Always start at 0
    const maxScore = 100; // Always end at 100
    
    // Find the maximum run number
    const maxRunNumber = Math.max(...allScores.map(dp => dp.runNumber));
    
    // Add spacing from y-axis
    const xAxisSpacing = 20; // Pixels to add between y-axis and first data point

    // Draw grid
    const gridLines = 8;
    ctx.strokeStyle = styles.gridColor;
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= gridLines; i++) {
      const y = padding + (graphHeight * i) / gridLines - scrollPos;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= maxRunNumber; i++) {
      const x = padding + xAxisSpacing + (graphWidth - xAxisSpacing) * i / maxRunNumber;
      ctx.beginPath();
      ctx.moveTo(x, padding - scrollPos);
      ctx.lineTo(x, height - padding - scrollPos);
      ctx.stroke();
    }
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = styles.axisColor;
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.moveTo(padding, height - padding - scrollPos);
    ctx.lineTo(width - padding, height - padding - scrollPos);
    
    // Y-axis
    ctx.moveTo(padding, padding - scrollPos);
    ctx.lineTo(padding, height - padding - scrollPos);
    ctx.stroke();
    
    // Draw Y-axis labels
    ctx.fillStyle = styles.textColor;
    ctx.font = `13px ${styles.font}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= gridLines; i++) {
      const y = padding + (graphHeight * i) / gridLines - scrollPos;
      const value = maxScore - ((maxScore - minScore) * i) / gridLines;
      ctx.fillText(value.toFixed(0), padding - 10, y);
    }
    
    // Draw X-axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    for (let i = 1; i <= maxRunNumber; i++) {
      const x = padding + xAxisSpacing + (graphWidth - xAxisSpacing) * (i - 1) / maxRunNumber;
      ctx.fillText(`Run ${i}`, x, height - padding + 10 - scrollPos);
    }
    
    // Draw data points and lines
    const tableData = {};
    selectedTables.forEach((tableIndex, colorIndex) => {
      const table = tables[tableIndex];
      tableData[table.title] = {
        color: styles.tableColors[colorIndex % styles.tableColors.length],
        points: []
      };
    });
    
    allScores.forEach(score => {
      const x = padding + xAxisSpacing + (graphWidth - xAxisSpacing) * (score.runNumber - 1) / maxRunNumber;
      const y = height - padding - ((score.score - minScore) / (maxScore - minScore) * graphHeight) - scrollPos;
      tableData[score.tableName].points.push({ x, y, score: score.score });
    });
    
    // Draw lines and points
    Object.values(tableData).forEach(table => {
      if (table.points.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = table.color;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        table.points.forEach((point, i) => {
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        
        ctx.stroke();
      }
      
      table.points.forEach(point => {
        // Draw point shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        
        // Draw outer circle
        ctx.beginPath();
        ctx.fillStyle = styles.background;
        ctx.strokeStyle = table.color;
        ctx.lineWidth = 2.5;
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw inner circle
        ctx.beginPath();
        ctx.fillStyle = table.color;
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        
        // Draw value label
        ctx.fillStyle = styles.textColor;
        ctx.font = `12px ${styles.font}`;
        ctx.textAlign = 'center';
        ctx.fillText(point.score.toFixed(0), point.x, point.y - 25);
      });
    });
    
    // Draw axis labels
    ctx.fillStyle = styles.textColor;
    ctx.font = `bold 14px ${styles.font}`;
    ctx.textAlign = 'center';
    
    // X-axis label
    ctx.fillText('Run #', width / 2, height - padding / 2 - scrollPos);
    
    // Y-axis label (rotated)
    ctx.save();
    ctx.translate(padding / 15, height / 2 - scrollPos);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Score (%)', 0, 0);
    ctx.restore();
    
    // Prepare table data for legend
    const legendItems = [];
    selectedTables.forEach((tableIndex, colorIndex) => {
      const table = tables[tableIndex];
      legendItems.push({
        name: table.title,
        color: styles.tableColors[colorIndex % styles.tableColors.length]
      });
    });
    
    setLegendData(legendItems);
  };

  const calculateSimilarityScore = (studentCode, idealCode) => {
    if (!studentCode.length || !idealCode.length) {
      return 0;
    }
    
    // Count correct instructions
    let correctCount = 0;
    const maxLength = Math.max(studentCode.length, idealCode.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (studentCode[i] === idealCode[i]) {
        correctCount++;
      }
    }
    
    // Calculate score as percentage of correct instructions
    const score = (correctCount / maxLength) * 100;
    
    return Math.max(0, Math.min(100, score));
  };

  const drawMatchGraph = (ctx, width, height, scrollPos) => {
    if (!idealCode) {
      ctx.fillStyle = styles.textColor;
      ctx.font = `14px ${styles.font}`;
      ctx.textAlign = 'center';
      ctx.fillText('Please submit an ideal code to see matching runs.', width / 2, height / 2);
      return;
    }

    const idealCommands = idealCode.toLowerCase().split(' ');
    const matchData = [];
    
    // Process data from selected tables
    selectedTables.forEach((tableIndex, colorIndex) => {
      const table = tables[tableIndex];
      
      // Find the Button column
      const buttonIndex = table.headers.findIndex(header => 
        header.toLowerCase().includes('button'));
      
      if (buttonIndex === -1) return;
      
      const buttonHeader = table.headers[buttonIndex];
      const programHeader = table.headers[buttonIndex + 1]; // Program is in the cell to the right of Play
      
      let currentRun = 1;
      let matchRun = null;
      
      for (let i = 0; i < table.data.length; i++) {
        const row = table.data[i];
        if (row[buttonHeader] === 'Play') {
          const studentCode = row[programHeader]?.toLowerCase().split(' ') || [];
          
          // Check if this run matches the ideal code
          if (arraysEqual(studentCode, idealCommands)) {
            matchRun = currentRun;
            break; // Found a match, no need to continue
          }
          
          currentRun++;
        }
      }
      
      // Add to match data (even if no match was found)
      matchData.push({
        tableName: table.title,
        matchRun: matchRun,
        color: styles.tableColors[colorIndex % styles.tableColors.length]
      });
    });

    if (matchData.length === 0) {
      ctx.fillStyle = styles.textColor;
      ctx.font = `14px ${styles.font}`;
      ctx.textAlign = 'center';
      ctx.fillText('No data found in the selected tables.', width / 2, height / 2);
      return;
    }

    // Calculate the maximum width needed for y-axis labels
    ctx.font = `13px ${styles.font}`;
    let maxLabelWidth = 0;
    matchData.forEach(data => {
      const labelWidth = ctx.measureText(data.tableName).width;
      maxLabelWidth = Math.max(maxLabelWidth, labelWidth);
    });
    
    // Define graph area with adjusted padding for y-axis labels
    const basePadding = 60;
    const yAxisPadding = Math.max(basePadding, maxLabelWidth + 20); // Add extra space for labels
    const padding = {
      left: yAxisPadding,
      right: basePadding,
      top: basePadding,
      bottom: basePadding
    };
    
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;
    
    // Calculate bar height based on number of tables
    const barHeight = Math.min(30, graphHeight / (matchData.length + 1));
    const barSpacing = 10;
    const totalBarHeight = (barHeight + barSpacing) * matchData.length;
    
    // Find the maximum run number for scaling
    const maxRunNumber = Math.max(...matchData.map(d => d.matchRun || 0), 10);
    
    // Draw grid
    const gridLines = 10;
    ctx.strokeStyle = styles.gridColor;
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let i = 0; i <= gridLines; i++) {
      const x = padding.left + (graphWidth * i) / gridLines;
      ctx.beginPath();
      ctx.moveTo(x, padding.top - scrollPos);
      ctx.lineTo(x, height - padding.bottom - scrollPos);
      ctx.stroke();
    }
    
    // Horizontal grid lines (one for each table)
    matchData.forEach((_, index) => {
      const y = padding.top + (index * (barHeight + barSpacing)) + barHeight / 2 - scrollPos;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    });
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = styles.axisColor;
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.moveTo(padding.left, height - padding.bottom - scrollPos);
    ctx.lineTo(width - padding.right, height - padding.bottom - scrollPos);
    
    // Y-axis
    ctx.moveTo(padding.left, padding.top - scrollPos);
    ctx.lineTo(padding.left, height - padding.bottom - scrollPos);
    ctx.stroke();
    
    // Draw X-axis labels
    ctx.fillStyle = styles.textColor;
    ctx.font = `13px ${styles.font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    for (let i = 0; i <= gridLines; i++) {
      const x = padding.left + (graphWidth * i) / gridLines;
      const value = Math.round((maxRunNumber * i) / gridLines);
      ctx.fillText(value.toString(), x, height - padding.bottom + 10 - scrollPos);
    }
    
    // Draw Y-axis labels (table names)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    matchData.forEach((data, index) => {
      const y = padding.top + (index * (barHeight + barSpacing)) + barHeight / 2 - scrollPos;
      ctx.fillText(data.tableName, padding.left - 10, y);
    });
    
    // Draw bars
    matchData.forEach((data, index) => {
      const y = padding.top + (index * (barHeight + barSpacing)) - scrollPos;
      
      if (data.matchRun !== null) {
        // Draw bar
        const barWidth = (data.matchRun / maxRunNumber) * graphWidth;
        
        // Draw bar with shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        
        ctx.fillStyle = data.color;
        ctx.fillRect(padding.left, y, barWidth, barHeight);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        
        // Draw run number on the bar
        ctx.fillStyle = styles.textColor;
        ctx.font = `bold 12px ${styles.font}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Run ${data.matchRun}`, padding.left + 5, y + barHeight / 2);
      } else {
        // Draw "No match" text
        ctx.fillStyle = styles.textColor;
        ctx.font = `italic 12px ${styles.font}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('No successful runs...', padding.left + 5, y + barHeight / 2);
      }
    });
    
    // Draw axis labels
    ctx.fillStyle = styles.textColor;
    ctx.font = `bold 14px ${styles.font}`;
    ctx.textAlign = 'center';
    
    // X-axis label
    ctx.fillText('Successful Run #', width / 2, height - padding.bottom / 4 - scrollPos);
     
    // Y-axis label
    ctx.fillText('Student', padding.left / 2, padding.top / 2 - scrollPos);
    
    // Prepare table data for legend
    const legendItems = [];
    selectedTables.forEach((tableIndex, colorIndex) => {
      const table = tables[tableIndex];
      legendItems.push({
        name: table.title,
        color: styles.tableColors[colorIndex % styles.tableColors.length]
      });
    });
    
    setLegendData(legendItems);
  };

  // Helper function to check if two arrays are equal
  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  return (
    <div className="graph-wrapper">
      <div className="graph-tabs">
        <button 
          className={`graph-tab ${activeTab === 'time' ? 'active' : ''}`}
          onClick={() => setActiveTab('time')}
        >
          Time Between Runs
        </button>
        <button 
          className={`graph-tab ${activeTab === 'score' ? 'active' : ''}`}
          onClick={() => setActiveTab('score')}
        >
          Compare to Ideal Code
        </button>
        <button 
          className={`graph-tab ${activeTab === 'match' ? 'active' : ''}`}
          onClick={() => setActiveTab('match')}
        >
          Successful Runs
        </button>
      </div>
      <div 
        className="graph-canvas-container"
        onWheel={handleScroll}
        style={{ 
          overflow: isScrollable ? 'auto' : 'hidden',
          height: `${canvasHeight}px`,
          position: 'relative'
        }}
      >
        <canvas 
          ref={canvasRef}
          className="graph-canvas"
          style={{ 
            height: `${contentHeight}px`,
            transform: `translateY(-${scrollPosition}px)`
          }}
        />
        {legendData.length > 0 && activeTab !== 'match' && 
         !(activeTab === 'score' && !idealCode) && 
         !(activeTab === 'match' && !idealCode) && (
          <div 
            ref={legendRef}
            className="graph-legend"
            style={{
              position: 'absolute',
              left: `${legendPosition.x}px`,
              top: `${legendPosition.y}px`,
              transform: `translateY(-${scrollPosition}px)`,
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleLegendMouseDown}
          >
            <div className="legend-header">Legend</div>
            <div className="legend-content">
              {legendData.map((item, index) => (
                <div key={index} className="legend-item">
                  <div 
                    className="legend-color" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <div className="legend-name">{item.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Graph; 