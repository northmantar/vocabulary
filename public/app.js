// API base URL - uses the same host and port as the frontend
const API_BASE_URL = window.location.origin;

// State management
let currentTab = 'vocabulary';
let vocabularyPage = 1;
let grammarPage = 1;
const pageSize = 10;

// Modal navigation state
let currentItemList = [];
let currentItemIndex = 0;
let currentItemType = '';

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  setupTabs();
  setupModal();
  loadVocabulary(vocabularyPage);
});

// Tab switching functionality
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach((button) => {
    button.addEventListener('click', function () {
      const tabName = this.getAttribute('data-tab');

      // Remove active class from all buttons and contents
      tabButtons.forEach((btn) => btn.classList.remove('active'));
      tabContents.forEach((content) => content.classList.remove('active'));

      // Add active class to clicked button and corresponding content
      this.classList.add('active');
      document.getElementById(`${tabName}-tab`).classList.add('active');

      // Update current tab and load data
      currentTab = tabName;
      if (tabName === 'vocabulary') {
        loadVocabulary(vocabularyPage);
      } else {
        loadGrammar(grammarPage);
      }
    });
  });
}

// Modal setup
function setupModal() {
  const modal = document.getElementById('card-modal');
  const closeBtn = document.querySelector('.close');

  closeBtn.onclick = function () {
    modal.classList.remove('show');
  };

  window.onclick = function (event) {
    if (event.target === modal) {
      modal.classList.remove('show');
    }
  };
}

// File upload functionality
async function uploadFile(type) {
  const fileInput = document.getElementById(`${type}-file`);
  const statusDiv = document.getElementById(`${type}-upload-status`);
  const file = fileInput.files[0];

  if (!file) {
    showStatus(statusDiv, 'Please select a file', 'error');
    return;
  }

  if (!file.name.endsWith('.csv')) {
    showStatus(statusDiv, 'Please select a CSV file', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    showStatus(statusDiv, 'Uploading...', '');

    const response = await fetch(`${API_BASE_URL}/${type}`, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      showStatus(statusDiv, 'File uploaded successfully!', 'success');
      fileInput.value = '';

      // Reload the list after successful upload
      if (type === 'vocabulary') {
        loadVocabulary(vocabularyPage);
      } else {
        loadGrammar(grammarPage);
      }
    } else {
      const error = await response.text();
      showStatus(statusDiv, `Upload failed: ${error}`, 'error');
    }
  } catch (error) {
    showStatus(statusDiv, `Upload failed: ${error.message}`, 'error');
  }
}

function showStatus(element, message, type) {
  element.textContent = message;
  element.className = `upload-status ${type}`;
}

// Load vocabulary list
async function loadVocabulary(pageNumber) {
  const listDiv = document.getElementById('vocabulary-list');
  const paginationDiv = document.getElementById('vocabulary-pagination');

  try {
    listDiv.innerHTML = '<div class="loading">Loading...</div>';

    const response = await fetch(`${API_BASE_URL}/vocabulary?pageNumber=${pageNumber}&pageSize=${pageSize}`);

    if (!response.ok) {
      throw new Error('Failed to load vocabulary');
    }

    const data = await response.json();
    vocabularyPage = pageNumber;

    if (!data.data || data.data.length === 0) {
      listDiv.innerHTML = '<div class="empty">No vocabulary data available. Upload a CSV file to get started.</div>';
      paginationDiv.innerHTML = '';
      return;
    }

    // Render vocabulary items
    listDiv.innerHTML = data.data
      .map(
        (item) => `
            <div class="item-card" onclick="showVocabularyCard(${item.id})">
                <div class="main-text">${escapeHtml(item.kanji)}</div>
                <div class="sub-text">${escapeHtml(item.furigana)}</div>
                <div class="meaning">${escapeHtml(item.meaning)}</div>
            </div>
        `,
      )
      .join('');

    // Render pagination
    renderPagination(paginationDiv, data.meta, pageNumber, loadVocabulary);
  } catch (error) {
    listDiv.innerHTML = `<div class="error">Error loading vocabulary: ${error.message}</div>`;
    paginationDiv.innerHTML = '';
  }
}

// Load grammar list
async function loadGrammar(pageNumber) {
  const listDiv = document.getElementById('grammar-list');
  const paginationDiv = document.getElementById('grammar-pagination');

  try {
    listDiv.innerHTML = '<div class="loading">Loading...</div>';

    const response = await fetch(`${API_BASE_URL}/grammar?pageNumber=${pageNumber}&pageSize=${pageSize}`);

    if (!response.ok) {
      throw new Error('Failed to load grammar');
    }

    const data = await response.json();
    grammarPage = pageNumber;

    if (!data.data || data.data.length === 0) {
      listDiv.innerHTML = '<div class="empty">No grammar data available. Upload a CSV file to get started.</div>';
      paginationDiv.innerHTML = '';
      return;
    }

    // Render grammar items
    listDiv.innerHTML = data.data
      .map(
        (item) => `
            <div class="item-card" onclick="showGrammarCard(${item.id})">
                <div class="main-text">${escapeHtml(item.grammar)}</div>
                <div class="meaning">${escapeHtml(item.meaning)}</div>
            </div>
        `,
      )
      .join('');

    // Render pagination
    renderPagination(paginationDiv, data.meta, pageNumber, loadGrammar);
  } catch (error) {
    listDiv.innerHTML = `<div class="error">Error loading grammar: ${error.message}</div>`;
    paginationDiv.innerHTML = '';
  }
}

// Render pagination controls
function renderPagination(container, meta, currentPage, loadFunction) {
  const { lastPage, hasPreviousPage, hasNextPage } = meta;

  container.innerHTML = `
        <button onclick="${loadFunction.name}(${currentPage - 1})" ${!hasPreviousPage ? 'disabled' : ''}>
            Previous
        </button>
        <span class="page-info">Page ${currentPage} of ${lastPage}</span>
        <button onclick="${loadFunction.name}(${currentPage + 1})" ${!hasNextPage ? 'disabled' : ''}>
            Next
        </button>
    `;
}

// Show vocabulary card in modal
async function showVocabularyCard(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/vocabulary?pageNumber=1&pageSize=1000`);
    const data = await response.json();

    currentItemList = data.data;
    currentItemType = 'vocabulary';
    currentItemIndex = currentItemList.findIndex((v) => v.id === id);

    if (currentItemIndex === -1) {
      alert('Vocabulary item not found');
      return;
    }

    displayCurrentCard();
    updateNavigationButtons();
    document.getElementById('card-modal').classList.add('show');
  } catch (error) {
    alert('Error loading vocabulary card: ' + error.message);
  }
}

// Show grammar card in modal
async function showGrammarCard(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/grammar?pageNumber=1&pageSize=1000`);
    const data = await response.json();

    currentItemList = data.data;
    currentItemType = 'grammar';
    currentItemIndex = currentItemList.findIndex((g) => g.id === id);

    if (currentItemIndex === -1) {
      alert('Grammar item not found');
      return;
    }

    displayCurrentCard();
    updateNavigationButtons();
    document.getElementById('card-modal').classList.add('show');
  } catch (error) {
    alert('Error loading grammar card: ' + error.message);
  }
}

// Display current card content
function displayCurrentCard() {
  const item = currentItemList[currentItemIndex];
  const cardContent = document.getElementById('card-content');

  if (currentItemType === 'vocabulary') {
    cardContent.innerHTML = `
      <div class="card-title">${escapeHtml(item.kanji)}</div>
      <div class="card-subtitle">${escapeHtml(item.furigana)}</div>
      <div class="card-meaning">${escapeHtml(item.meaning)}</div>
    `;
  } else if (currentItemType === 'grammar') {
    cardContent.innerHTML = `
      <div class="card-title">${escapeHtml(item.grammar)}</div>
      <div class="card-meaning">${escapeHtml(item.meaning)}</div>
      ${item.memo ? `<div class="card-memo">${escapeHtml(item.memo)}</div>` : ''}
    `;
  }
}

// Update navigation button states
function updateNavigationButtons() {
  const prevButton = document.getElementById('prev-arrow');
  const nextButton = document.getElementById('next-arrow');

  prevButton.disabled = currentItemIndex === 0;
  nextButton.disabled = currentItemIndex === currentItemList.length - 1;
}

// Navigate to previous or next card
function navigateCard(direction) {
  const newIndex = currentItemIndex + direction;

  if (newIndex >= 0 && newIndex < currentItemList.length) {
    currentItemIndex = newIndex;
    displayCurrentCard();
    updateNavigationButtons();
  }
}

// Utility function to escape HTML and prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
