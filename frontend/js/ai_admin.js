(function() {
  const { authFetch, requireAuth, API_BASE } = window.BrainVaultAuth || {};
  
  let generatedProblems = [];

  // Initialize the page
  document.addEventListener('DOMContentLoaded', function() {
    requireAuth();
    initializeAIAdmin();
    setupEventListeners();
    loadAIStats();
  });

  async function initializeAIAdmin() {
    try {
      // Load AI capabilities and stats
      await loadAIStats();
      
      // Setup generation type toggle
      setupGenerationTypeToggle();
      
      console.log('AI Admin interface initialized');
    } catch (error) {
      console.error('Failed to initialize AI Admin:', error);
      showNotification('Failed to initialize AI interface', 'error');
    }
  }

  async function loadAIStats() {
    try {
      const response = await authFetch(`${API_BASE}/ai/stats`);
      if (response.ok) {
        const stats = await response.json();
        document.getElementById('totalFormulas').textContent = stats.total_formulas;
        console.log('AI Stats loaded:', stats);
      }
    } catch (error) {
      console.error('Failed to load AI stats:', error);
    }
  }

  function setupEventListeners() {
    // Generation button
    document.getElementById('generateBtn').addEventListener('click', handleGeneration);
    
    // Batch generation button
    document.getElementById('batchBtn').addEventListener('click', handleBatchGeneration);
    
    // Clear results button
    document.getElementById('clearBtn').addEventListener('click', clearResults);
    
    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportToJSON);
    
    // Add to database button
    document.getElementById('addToDbBtn').addEventListener('click', addToDatabase);
    
    // Preview button
    document.getElementById('previewBtn').addEventListener('click', previewProblems);
    
    // Generation type radio buttons
    document.querySelectorAll('input[name="genType"]').forEach(radio => {
      radio.addEventListener('change', handleGenerationTypeChange);
    });
  }

  function setupGenerationTypeToggle() {
    const singleRadio = document.querySelector('input[value="single"]');
    const batchRadio = document.querySelector('input[value="batch"]');
    const generateBtn = document.getElementById('generateBtn');
    const batchBtn = document.getElementById('batchBtn');
    const problemCountInput = document.getElementById('problemCount');

    function updateInterface() {
      if (singleRadio.checked) {
        generateBtn.style.display = 'inline-block';
        batchBtn.style.display = 'none';
        problemCountInput.disabled = false;
      } else {
        generateBtn.style.display = 'none';
        batchBtn.style.display = 'inline-block';
        problemCountInput.disabled = true;
      }
    }

    singleRadio.addEventListener('change', updateInterface);
    batchRadio.addEventListener('change', updateInterface);
    
    updateInterface(); // Initialize
  }

  function handleGenerationTypeChange(event) {
    const isType = event.target.value;
    console.log('Generation type changed to:', isType);
  }

  async function handleGeneration() {
    const branch = document.getElementById('branchSelect').value;
    const difficulty = document.getElementById('difficultySelect').value;
    const count = parseInt(document.getElementById('problemCount').value);

    if (count < 1 || count > 10) {
      showNotification('Please enter a number between 1 and 10', 'error');
      return;
    }

    const params = {
      branch: branch || null,
      difficulty,
      count
    };

    await generateProblems(params, false);
  }

  async function handleBatchGeneration() {
    const params = {
      count: 20
    };

    await generateProblems(params, true);
  }

  async function generateProblems(params, isBatch = false) {
    const generateBtn = document.getElementById('generateBtn');
    const batchBtn = document.getElementById('batchBtn');
    const statusDisplay = document.getElementById('generationStatus');
    const resultsContainer = document.getElementById('resultsContainer');

    try {
      // Show loading state
      generateBtn.disabled = true;
      batchBtn.disabled = true;
      statusDisplay.style.display = 'block';
      resultsContainer.style.display = 'none';

      const startTime = Date.now();
      
      // Call appropriate API endpoint
      const endpoint = isBatch ? '/ai/batch' : '/ai/generate';
      const response = await authFetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      const endTime = Date.now();
      const generationTime = endTime - startTime;

      // Store generated problems
      generatedProblems = result.problems;

      // Hide loading and show results
      statusDisplay.style.display = 'none';
      displayResults(result.problems, generationTime);

      showNotification(`Successfully generated ${result.problems.length} problems!`, 'success');

    } catch (error) {
      console.error('Generation failed:', error);
      statusDisplay.style.display = 'none';
      showNotification(`Generation failed: ${error.message}`, 'error');
    } finally {
      generateBtn.disabled = false;
      batchBtn.disabled = false;
    }
  }

  function displayResults(problems, generationTime) {
    const resultsContainer = document.getElementById('resultsContainer');
    const problemsList = document.getElementById('problemsList');
    const resultsCount = document.getElementById('resultsCount');
    const generationTimeEl = document.getElementById('generationTime');

    // Update summary
    resultsCount.textContent = problems.length;
    generationTimeEl.textContent = generationTime;

    // Clear previous results
    problemsList.innerHTML = '';

    // Display each problem
    problems.forEach((problem, index) => {
      const problemCard = createProblemCard(problem, index);
      problemsList.appendChild(problemCard);
    });

    // Show results container
    resultsContainer.style.display = 'block';
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
  }

  function createProblemCard(problem, index) {
    const card = document.createElement('div');
    card.className = 'problem-card card';
    
    const difficultyColor = {
      'Easy': '#10b981',
      'Medium': '#f59e0b',
      'Hard': '#ef4444',
      'Expert': '#8b5cf6'
    };

    card.innerHTML = `
      <div class="problem-header">
        <div class="problem-meta">
          <span class="problem-id">#${index + 1}</span>
          <span class="problem-branch">${problem.branch}</span>
          <span class="problem-difficulty" style="background-color: ${difficultyColor[problem.difficulty]}">
            ${problem.difficulty} (${problem.xp_reward} XP)
          </span>
        </div>
        <div class="problem-actions">
          <button class="btn-mini" onclick="toggleProblemDetails(${index})">
            👁️ Details
          </button>
          <button class="btn-mini" onclick="testProblem(${index})">
            🧪 Test
          </button>
        </div>
      </div>
      
      <div class="problem-content">
        <div class="problem-question">
          <strong>Question:</strong>
          <p>${problem.question}</p>
        </div>
        
        <div class="problem-details" id="problemDetails${index}" style="display: none;">
          <div class="detail-section">
            <strong>Given Values:</strong>
            <ul>
              ${Object.entries(problem.given).map(([key, value]) => 
                `<li><code>${key} = ${value}</code></li>`
              ).join('')}
            </ul>
          </div>
          
          <div class="detail-section">
            <strong>Answer:</strong>
            <p><code>${problem.answer.formula}</code></p>
            <p><strong>Value:</strong> ${problem.answer.value} ${problem.answer.unit}</p>
          </div>
          
          <div class="detail-section">
            <strong>Hints:</strong>
            <ol>
              ${problem.hints.map(hint => `<li>${hint}</li>`).join('')}
            </ol>
          </div>
          
          <div class="detail-section">
            <strong>AI Metadata:</strong>
            <ul>
              <li><strong>Formula Used:</strong> ${problem.ai_metadata.formula_used}</li>
              <li><strong>Target Variable:</strong> ${problem.ai_metadata.target_variable}</li>
              <li><strong>Context:</strong> ${JSON.stringify(problem.ai_metadata.context)}</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    return card;
  }

  function clearResults() {
    generatedProblems = [];
    document.getElementById('resultsContainer').style.display = 'none';
    document.getElementById('problemsList').innerHTML = '';
    showNotification('Results cleared', 'info');
  }

  function exportToJSON() {
    if (generatedProblems.length === 0) {
      showNotification('No problems to export', 'warning');
      return;
    }

    const dataStr = JSON.stringify(generatedProblems, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `brainvault-ai-problems-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    showNotification('Problems exported to JSON', 'success');
  }

  async function addToDatabase() {
    if (generatedProblems.length === 0) {
      showNotification('No problems to add to database', 'warning');
      return;
    }

    try {
      // This would typically save to a database
      // For now, we'll just simulate the process
      showNotification('Database integration not implemented yet', 'info');
      
      // In a real implementation, you might do:
      // const response = await authFetch(`${API_BASE}/problems/bulk`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ problems: generatedProblems })
      // });
      
    } catch (error) {
      console.error('Failed to add to database:', error);
      showNotification('Failed to add problems to database', 'error');
    }
  }

  function previewProblems() {
    if (generatedProblems.length === 0) {
      showNotification('No problems to preview', 'warning');
      return;
    }

    const modal = document.getElementById('previewModal');
    const content = document.getElementById('previewContent');
    
    // Create preview content
    content.innerHTML = `
      <div class="preview-summary">
        <h3>📊 Generation Summary</h3>
        <ul>
          <li><strong>Total Problems:</strong> ${generatedProblems.length}</li>
          <li><strong>Branches:</strong> ${[...new Set(generatedProblems.map(p => p.branch))].join(', ')}</li>
          <li><strong>Difficulties:</strong> ${[...new Set(generatedProblems.map(p => p.difficulty))].join(', ')}</li>
          <li><strong>Total XP Value:</strong> ${generatedProblems.reduce((sum, p) => sum + p.xp_reward, 0)} XP</li>
        </ul>
      </div>
      
      <div class="preview-problems">
        <h3>🧮 Problem Samples</h3>
        ${generatedProblems.slice(0, 3).map((problem, index) => `
          <div class="preview-problem">
            <strong>${problem.branch} - ${problem.difficulty}</strong>
            <p>${problem.question}</p>
            <small>Answer: ${problem.answer.value} ${problem.answer.unit}</small>
          </div>
        `).join('')}
        ${generatedProblems.length > 3 ? `<p><em>... and ${generatedProblems.length - 3} more problems</em></p>` : ''}
      </div>
    `;
    
    modal.style.display = 'flex';
  }

  // Global functions for button clicks
  window.toggleProblemDetails = function(index) {
    const detailsEl = document.getElementById(`problemDetails${index}`);
    if (detailsEl.style.display === 'none') {
      detailsEl.style.display = 'block';
    } else {
      detailsEl.style.display = 'none';
    }
  };

  window.testProblem = function(index) {
    const problem = generatedProblems[index];
    showNotification(`Testing problem: ${problem.question.substring(0, 50)}...`, 'info');
    
    // Here you could implement problem validation logic
    console.log('Testing problem:', problem);
  };

  window.closePreview = function() {
    document.getElementById('previewModal').style.display = 'none';
  };

  // Utility function for notifications
  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">
          ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
        </span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

})();