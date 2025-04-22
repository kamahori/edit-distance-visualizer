document.addEventListener('DOMContentLoaded', () => {
    // Input elements
    const referenceStringTextarea = document.getElementById('reference-string');
    const targetStringsContainer = document.getElementById('target-strings-container');
    const addStringBtn = document.getElementById('add-string-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultsContainer = document.getElementById('results-container');

    // Counter for target string IDs
    let targetStringCounter = 1;

    // Function to auto-resize textareas
    function autoResizeTextarea(textarea) {
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        // Set the height to match the content
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    // Add event listener for the reference string textarea
    referenceStringTextarea.addEventListener('input', () => {
        autoResizeTextarea(referenceStringTextarea);
        calculateAllEditDistances();
    });
    
    // Add event listener for the initial target string textarea
    const initialTargetTextarea = document.getElementById('target-string-1');
    if (initialTargetTextarea) {
        initialTargetTextarea.addEventListener('input', () => {
            autoResizeTextarea(initialTargetTextarea);
            calculateAllEditDistances();
        });
    }

    // Function to add a new target string input
    function addTargetStringInput() {
        targetStringCounter++;
        
        const targetStringGroup = document.createElement('div');
        targetStringGroup.className = 'input-group target-string-group';
        targetStringGroup.dataset.id = targetStringCounter;
        
        const label = document.createElement('label');
        label.setAttribute('for', `target-string-${targetStringCounter}`);
        label.textContent = `Target String ${targetStringCounter}:`;
        
        const textarea = document.createElement('textarea');
        textarea.id = `target-string-${targetStringCounter}`;
        textarea.className = 'target-string';
        textarea.placeholder = 'Enter target string (can be any length)';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-string-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.dataset.id = targetStringCounter;
        
        targetStringGroup.appendChild(label);
        targetStringGroup.appendChild(textarea);
        targetStringGroup.appendChild(removeBtn);
        
        targetStringsContainer.appendChild(targetStringGroup);
        
        // Add input event listener for auto-resizing and calculating edit distance
        textarea.addEventListener('input', () => {
            autoResizeTextarea(textarea);
            calculateAllEditDistances();
        });
        
        // Add event listener for the remove button
        removeBtn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const groupToRemove = document.querySelector(`.target-string-group[data-id="${id}"]`);
            if (groupToRemove) {
                targetStringsContainer.removeChild(groupToRemove);
                calculateAllEditDistances(); // Recalculate after removing a target string
            }
        });
        
        return textarea;
    }

    // Add event listener for the add string button
    addStringBtn.addEventListener('click', () => {
        addTargetStringInput();
        calculateAllEditDistances(); // Recalculate after adding a new target string
    });

    // Add event listeners for existing remove buttons
    document.querySelectorAll('.remove-string-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Only allow removal if there's more than one target string
            if (document.querySelectorAll('.target-string-group').length > 1) {
                const id = e.target.dataset.id;
                const groupToRemove = document.querySelector(`.target-string-group[data-id="${id}"]`);
                if (groupToRemove) {
                    targetStringsContainer.removeChild(groupToRemove);
                    calculateAllEditDistances(); // Recalculate after removing a target string
                }
            } else {
                alert('You must have at least one target string.');
            }
        });
    });

    // Calculate edit distance using dynamic programming (Levenshtein distance)
    function calculateEditDistance(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        
        // Create a matrix of size (m+1) x (n+1)
        const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
        
        // Initialize the matrix
        for (let i = 0; i <= m; i++) {
            dp[i][0] = i; // If str2 is empty, we need i deletions
        }
        
        for (let j = 0; j <= n; j++) {
            dp[0][j] = j; // If str1 is empty, we need j insertions
        }
        
        // Fill the matrix
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    // Characters match
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    // Take the minimum of three operations: insertion, deletion, substitution
                    dp[i][j] = 1 + Math.min(
                        dp[i][j - 1],     // Insertion
                        dp[i - 1][j],     // Deletion
                        dp[i - 1][j - 1]  // Substitution
                    );
                }
            }
        }
        
        // Backtrack to find the operations
        const operations = backtrackOperations(dp, str1, str2);
        
        return {
            distance: dp[m][n],
            operations: operations
        };
    }

    // Backtrack through the DP matrix to find the sequence of operations
    function backtrackOperations(dp, str1, str2) {
        let i = str1.length;
        let j = str2.length;
        const operations = [];
        
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && str1[i - 1] === str2[j - 1]) {
                // Match
                operations.unshift({
                    type: 'match',
                    char1: str1[i - 1],
                    char2: str2[j - 1],
                    i: i - 1,
                    j: j - 1
                });
                i--;
                j--;
            } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
                // Substitution
                operations.unshift({
                    type: 'substitution',
                    char1: str1[i - 1],
                    char2: str2[j - 1],
                    i: i - 1,
                    j: j - 1
                });
                i--;
                j--;
            } else if (j > 0 && (i === 0 || dp[i][j] === dp[i][j - 1] + 1)) {
                // Insertion
                operations.unshift({
                    type: 'insertion',
                    char1: null,
                    char2: str2[j - 1],
                    i: i,
                    j: j - 1
                });
                j--;
            } else if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + 1)) {
                // Deletion
                operations.unshift({
                    type: 'deletion',
                    char1: str1[i - 1],
                    char2: null,
                    i: i - 1,
                    j: j
                });
                i--;
            }
        }
        
        return operations;
    }

    // Visualize the operations for a single comparison
    function visualizeOperations(str1, str2, operations, visualizationContainer) {
        visualizationContainer.innerHTML = '';
        
        // Determine if we need to use compact mode for long strings
        const isLongString = str1.length > 50 || str2.length > 50;
        const boxSize = isLongString ? '16px' : '20px';
        const fontSize = isLongString ? '10px' : '12px';
        
        // Calculate how many characters can fit in a row
        // Estimate container width (accounting for padding and labels)
        const containerWidth = visualizationContainer.clientWidth - 100; // Subtract label width and padding
        const charWidth = parseInt(boxSize) + 2; // Add 2px for gap
        
        // Make charsPerRow responsive to container width
        let charsPerRow;
        if (window.innerWidth <= 480) {
            // For mobile devices
            charsPerRow = Math.max(4, Math.floor(containerWidth / charWidth));
        } else if (window.innerWidth <= 768) {
            // For tablets
            charsPerRow = Math.max(6, Math.floor(containerWidth / charWidth));
        } else {
            // For desktops
            charsPerRow = Math.max(8, Math.floor(containerWidth / charWidth));
        }
        
        // Calculate how many rows we need
        const totalRows = Math.ceil(operations.length / charsPerRow);
        
        // Create row containers for each row of characters
        const rowContainers = [];
        for (let row = 0; row < totalRows; row++) {
            // Create a container for this row
            const rowContainer = document.createElement('div');
            rowContainer.className = 'visualization-row';
            rowContainer.style.marginBottom = '20px';
            
            // Create rows for the two strings in this row
            const str1Row = document.createElement('div');
            str1Row.className = 'char-row';
            
            const str2Row = document.createElement('div');
            str2Row.className = 'char-row';
            
            // Calculate start and end indices for this row
            const startIdx = row * charsPerRow;
            const endIdx = Math.min(startIdx + charsPerRow, operations.length);
            
            // Process operations for this row
            for (let i = startIdx; i < endIdx; i++) {
                const op = operations[i];
                
                const char1Box = document.createElement('div');
                char1Box.className = `char-box ${op.type}`;
                char1Box.style.minWidth = boxSize;
                char1Box.style.fontSize = fontSize;
                
                const char2Box = document.createElement('div');
                char2Box.className = `char-box ${op.type}`;
                char2Box.style.minWidth = boxSize;
                char2Box.style.fontSize = fontSize;
                
                // Set content based on operation type
                switch (op.type) {
                    case 'match':
                        char1Box.textContent = op.char1;
                        char2Box.textContent = op.char2;
                        break;
                    case 'insertion':
                        char1Box.textContent = '-';
                        char2Box.textContent = op.char2;
                        break;
                    case 'deletion':
                        char1Box.textContent = op.char1;
                        char2Box.textContent = '-';
                        break;
                    case 'substitution':
                        char1Box.textContent = op.char1;
                        char2Box.textContent = op.char2;
                        break;
                }
                
                str1Row.appendChild(char1Box);
                str2Row.appendChild(char2Box);
            }
            
            // Add row number label if there are multiple rows
            let rowLabel = '';
            if (totalRows > 1) {
                rowLabel = `[${startIdx + 1}-${endIdx}]: `;
            }
            
            // Add labels
            const str1Label = document.createElement('div');
            str1Label.textContent = `Reference${rowLabel}`;
            str1Label.style.fontWeight = 'bold';
            str1Label.style.minWidth = '150px';
            str1Label.style.width = 'fit-content';
            str1Label.style.backgroundColor = '#f9f9f9';
            str1Label.style.whiteSpace = 'nowrap';
            
            const str2Label = document.createElement('div');
            str2Label.textContent = `Target${rowLabel}`;
            str2Label.style.fontWeight = 'bold';
            str2Label.style.minWidth = '150px';
            str2Label.style.width = 'fit-content';
            str2Label.style.backgroundColor = '#f9f9f9';
            str2Label.style.whiteSpace = 'nowrap';
            
            // Create wrapper divs with labels
            const str1Wrapper = document.createElement('div');
            str1Wrapper.className = 'char-row-wrapper';
            str1Wrapper.style.display = 'flex';
            str1Wrapper.style.flexWrap = 'wrap';
            str1Wrapper.style.alignItems = 'center';
            str1Wrapper.appendChild(str1Label);
            str1Wrapper.appendChild(str1Row);
            
            const str2Wrapper = document.createElement('div');
            str2Wrapper.className = 'char-row-wrapper';
            str2Wrapper.style.display = 'flex';
            str2Wrapper.style.flexWrap = 'wrap';
            str2Wrapper.style.alignItems = 'center';
            str2Wrapper.appendChild(str2Label);
            str2Wrapper.appendChild(str2Row);
            
            // Add rows to the row container
            rowContainer.appendChild(str1Wrapper);
            rowContainer.appendChild(str2Wrapper);
            
            // Add this row container to the visualization
            rowContainers.push(rowContainer);
        }
        
        // Add all row containers to the visualization
        rowContainers.forEach(container => {
            visualizationContainer.appendChild(container);
        });
        
        // Add explanation of the edit distance
        const explanation = document.createElement('div');
        explanation.className = 'operation-details';
        
        // For long strings, show a summary instead of all operations
        if (operations.length > 50) {
            const summary = document.createElement('div');
            summary.innerHTML = `<h3>Edit Operations Summary:</h3>`;
            
            // Count operation types
            const counts = {
                match: 0,
                insertion: 0,
                deletion: 0,
                substitution: 0
            };
            
            operations.forEach(op => {
                counts[op.type]++;
            });
            
            const summaryList = document.createElement('ul');
            
            Object.entries(counts).forEach(([type, count]) => {
                if (count > 0) {
                    const li = document.createElement('li');
                    li.className = type;
                    li.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)}s: ${count}`;
                    summaryList.appendChild(li);
                }
            });
            
            summary.appendChild(summaryList);
            explanation.appendChild(summary);
        } else {
            explanation.innerHTML = `<h3>Edit Operations:</h3>`;
            
            const operationsList = document.createElement('ol');
            operations.forEach((op, index) => {
                const li = document.createElement('li');
                li.className = `operation-step ${op.type}`;
                
                switch (op.type) {
                    case 'match':
                        li.textContent = `Character '${op.char1}' matches at positions ${op.i + 1} and ${op.j + 1}`;
                        break;
                    case 'insertion':
                        li.textContent = `Insert character '${op.char2}' at position ${op.i + 1}`;
                        break;
                    case 'deletion':
                        li.textContent = `Delete character '${op.char1}' at position ${op.i + 1}`;
                        break;
                    case 'substitution':
                        li.textContent = `Substitute character '${op.char1}' with '${op.char2}' at position ${op.i + 1}`;
                        break;
                }
                
                operationsList.appendChild(li);
            });
            
            explanation.appendChild(operationsList);
        }
        
        visualizationContainer.appendChild(explanation);
    }

    // Function to create a result item for a target string
    function createResultItem(targetId, targetString, distance, operations, referenceString) {
        // Create a simple result header with target string info and distance
        const resultHeader = document.createElement('div');
        resultHeader.className = 'result-header';
        
        const resultTitle = document.createElement('h3');
        resultTitle.className = 'result-title';
        resultTitle.textContent = `Target String ${targetId}`;
        
        const distanceBadge = document.createElement('span');
        distanceBadge.className = 'distance-badge';
        distanceBadge.textContent = `Edit Distance: ${distance}`;
        
        resultHeader.appendChild(resultTitle);
        resultHeader.appendChild(distanceBadge);
        
        return {
            header: resultHeader,
            targetString,
            operations,
            distance
        };
    }

    // Function to visualize all target strings in a single line-by-line view
    function visualizeAllOperations(referenceString, targetResults, visualizationContainer) {
        visualizationContainer.innerHTML = '';
        
        // Create a header for the visualization
        const visualizationHeader = document.createElement('div');
        visualizationHeader.className = 'visualization-header';
        visualizationHeader.innerHTML = '<h3>Line-by-Line Visualization</h3>';
        visualizationContainer.appendChild(visualizationHeader);
        
        // Determine if we need to use compact mode for long strings
        const isLongString = referenceString.length > 50 || 
            targetResults.some(result => result.targetString.length > 50);
        const boxSize = isLongString ? '16px' : '20px';
        const fontSize = isLongString ? '10px' : '12px';
        
        // Calculate how many characters can fit in a row
        const containerWidth = visualizationContainer.clientWidth - 100;
        const charWidth = parseInt(boxSize) + 2;
        
        // Fix the length per line to be 40 characters
        const charsPerRow = 40;
        
        // Find the maximum length of operations across all target strings
        const maxOperationsLength = Math.max(...targetResults.map(result => result.operations.length));
        
        // Calculate how many rows we need
        const totalRows = Math.ceil(maxOperationsLength / charsPerRow);
        
        // Create row containers for each row of characters
        for (let row = 0; row < totalRows; row++) {
            // Create a container for this row
            const rowContainer = document.createElement('div');
            rowContainer.className = 'visualization-row';
            rowContainer.style.marginBottom = '20px';
            
            // Calculate start and end indices for this row
            const startIdx = row * charsPerRow;
            const endIdx = Math.min(startIdx + charsPerRow, maxOperationsLength);
            
            // Add row number label if there are multiple rows
            let rowLabel = '';
            if (totalRows > 1) {
                rowLabel = `[${startIdx + 1}-${endIdx}]: `;
            }
            
            // First, add the reference string row
            const refWrapper = document.createElement('div');
            refWrapper.className = 'char-row-wrapper';
            refWrapper.style.display = 'flex';
            refWrapper.style.flexWrap = 'wrap';
            refWrapper.style.alignItems = 'center';
            
            const refLabel = document.createElement('div');
            refLabel.textContent = `Reference${rowLabel}`;
            refLabel.style.fontWeight = 'bold';
            refLabel.style.minWidth = '150px';
            refLabel.style.width = 'fit-content';
            refLabel.style.textAlign = 'right';
            refLabel.style.paddingRight = '10px';
            refLabel.style.padding = '5px';
            refLabel.style.backgroundColor = '#f9f9f9';
            refLabel.style.whiteSpace = 'nowrap';
            
            const refRow = document.createElement('div');
            refRow.className = 'char-row';
            
            // Use the first target's operations for the reference string
            // (all should show the same reference string)
            if (targetResults.length > 0) {
                const firstTargetOps = targetResults[0].operations;
                
                for (let i = startIdx; i < endIdx && i < firstTargetOps.length; i++) {
                    const op = firstTargetOps[i];
                    
                    const charBox = document.createElement('div');
                    charBox.className = 'char-box match';
                    charBox.style.minWidth = boxSize;
                    charBox.style.fontSize = fontSize;
                    
                    if (op.type === 'insertion') {
                        charBox.textContent = '-';
                    } else {
                        charBox.textContent = op.char1;
                    }
                    
                    refRow.appendChild(charBox);
                }
            }
            
            refWrapper.appendChild(refLabel);
            refWrapper.appendChild(refRow);
            rowContainer.appendChild(refWrapper);
            
            // Then add each target string row
            targetResults.forEach((result, index) => {
                const targetWrapper = document.createElement('div');
                targetWrapper.className = 'char-row-wrapper';
                targetWrapper.style.display = 'flex';
                targetWrapper.style.flexWrap = 'wrap';
                
                const targetLabel = document.createElement('div');
                targetLabel.textContent = `Target ${index + 1}${rowLabel}`;
                targetLabel.style.fontWeight = 'bold';
                targetLabel.style.width = '150px';
                targetLabel.style.textAlign = 'right';
                targetLabel.style.paddingRight = '10px';
                targetLabel.style.padding = '5px';
                targetLabel.style.backgroundColor = '#f9f9f9';
                
                const targetRow = document.createElement('div');
                targetRow.className = 'char-row';
                
                for (let i = startIdx; i < endIdx && i < result.operations.length; i++) {
                    const op = result.operations[i];
                    
                    const charBox = document.createElement('div');
                    charBox.className = `char-box ${op.type}`;
                    charBox.style.minWidth = boxSize;
                    charBox.style.fontSize = fontSize;
                    
                    if (op.type === 'deletion') {
                        charBox.textContent = '-';
                    } else {
                        charBox.textContent = op.char2;
                    }
                    
                    targetRow.appendChild(charBox);
                }
                
                targetWrapper.appendChild(targetLabel);
                targetWrapper.appendChild(targetRow);
                rowContainer.appendChild(targetWrapper);
            });
            
            visualizationContainer.appendChild(rowContainer);
        }
        
        // Add a summary of edit distances
        const summaryContainer = document.createElement('div');
        summaryContainer.className = 'operation-details';
        summaryContainer.innerHTML = '<h3>Edit Distance Summary:</h3>';
        
        const summaryList = document.createElement('ul');
        targetResults.forEach((result, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>Target ${index + 1}:</strong> Edit Distance = ${result.distance}`;
            summaryList.appendChild(li);
        });
        
        summaryContainer.appendChild(summaryList);
        visualizationContainer.appendChild(summaryContainer);
    }

    // Function to calculate edit distances for all target strings
    function calculateAllEditDistances() {
        const referenceString = referenceStringTextarea.value.trim();
        
        if (!referenceString) {
            alert('Please enter a reference string');
            return;
        }
        
        const targetStrings = [];
        document.querySelectorAll('.target-string').forEach(textarea => {
            const value = textarea.value.trim();
            if (value) {
                const id = textarea.id.split('-')[2]; // Extract ID from the textarea ID
                targetStrings.push({ id, value });
            }
        });
        
        if (targetStrings.length === 0) {
            alert('Please enter at least one target string');
            return;
        }
        
        // Clear previous results
        resultsContainer.innerHTML = '';
        
        // Create a single container for all results
        const allResultsContainer = document.createElement('div');
        allResultsContainer.className = 'result-item';
        
        // Create a container for the target string headers
        const headersContainer = document.createElement('div');
        headersContainer.className = 'target-headers-container';
        
        // Create a container for the visualization
        const visualizationContainer = document.createElement('div');
        visualizationContainer.className = 'visualization-container';
        visualizationContainer.style.display = 'block'; // Show by default
        
        // Calculate edit distance for each target string and collect results
        const targetResults = [];
        
        targetStrings.forEach(target => {
            const { distance, operations } = calculateEditDistance(referenceString, target.value);
            
            const resultData = createResultItem(
                target.id,
                target.value,
                distance,
                operations,
                referenceString
            );
            
            // Add the header to the headers container
            headersContainer.appendChild(resultData.header);
            
            // Store the result data for visualization
            targetResults.push(resultData);
        });
        
        // Add headers container to the results container
        allResultsContainer.appendChild(headersContainer);
        
        // Add visualization container
        allResultsContainer.appendChild(visualizationContainer);
        
        // Generate the line-by-line visualization for all target strings
        visualizeAllOperations(referenceString, targetResults, visualizationContainer);
        
        // Add the results container to the page
        resultsContainer.appendChild(allResultsContainer);
        
        // No longer auto-scroll to results on every calculation
        // resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    // No longer need the calculate button event listener as calculation happens on input
    // calculateBtn.addEventListener('click', calculateAllEditDistances);

    // Initialize textareas when the page loads
    function initializeTextareas() {
        // Set initial values
        referenceStringTextarea.value = "kitten";
        document.getElementById('target-string-1').value = "sitting";
        
        // Resize textareas to fit content
        autoResizeTextarea(referenceStringTextarea);
        autoResizeTextarea(document.getElementById('target-string-1'));
    }
    
    // Initialize the app
    initializeTextareas();
    
    // Calculate initial edit distances
    calculateAllEditDistances();
    
    // Add window resize event listener to recalculate visualization if needed
    window.addEventListener('resize', () => {
        // Only recalculate if there's a visualization
        const visualizationContainer = document.querySelector('.visualization-container');
        if (visualizationContainer && visualizationContainer.innerHTML !== '') {
            // Use a debounce to prevent excessive recalculations during resize
            if (window.resizeTimeout) {
                clearTimeout(window.resizeTimeout);
            }
            
            window.resizeTimeout = setTimeout(() => {
                // Get all target results
                const targetResults = [];
                const referenceString = referenceStringTextarea.value.trim();
                
                document.querySelectorAll('.target-string').forEach(textarea => {
                    const value = textarea.value.trim();
                    if (value) {
                        const id = textarea.id.split('-')[2];
                        const { distance, operations } = calculateEditDistance(referenceString, value);
                        
                        targetResults.push({
                            targetString: value,
                            operations,
                            distance
                        });
                    }
                });
                
                // Regenerate the visualization
                if (targetResults.length > 0) {
                    visualizeAllOperations(referenceString, targetResults, visualizationContainer);
                }
            }, 250); // Wait 250ms after resize ends before recalculating
        }
    });
});
