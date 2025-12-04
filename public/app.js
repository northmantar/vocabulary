// API base URL - uses the same host and port as the frontend
const API_BASE_URL = window.location.origin;

// State management
let currentTab = 'vocabulary';
let vocabularyPage = 1;
let grammarPage = 1;
let reviewVocabularyPage = 1;
let reviewGrammarPage = 1;
const pageSize = 10;
let isLoadingVocabulary = false;
let hasMoreVocabulary = true;
let isLoadingGrammar = false;
let hasMoreGrammar = true;
let isLoadingReviewVocabulary = false;
let hasMoreReviewVocabulary = true;
let isLoadingReviewGrammar = false;
let hasMoreReviewGrammar = true;
let vocabularySearchKeyword = '';
let grammarSearchKeyword = '';

// Modal navigation state
let currentItemList = [];
let currentItemIndex = 0;
let currentItemType = '';
let isReviewMode = false;
let isRevealed = false;
let isEditMode = false;
let originalItemData = null;

// Honorific data cache
let honorificData = {
  UP: [],
  DOWN: [],
  NORMAL: []
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  setupTabs();
  setupModal();
  setupScrollListeners();
  setupSearchListeners();
  setupCreateModal();
  setupFAB();
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
      } else if (tabName === 'grammar') {
        loadGrammar(grammarPage);
      } else if (tabName === 'honorific') {
        loadAllHonorifics();
      } else if (tabName === 'review') {
        loadReviewVocabulary(reviewVocabularyPage);
        loadReviewGrammar(reviewGrammarPage);
      }
    });
  });
}

// Modal setup
function setupModal() {
  const modal = document.getElementById('card-modal');
  const closeBtn = document.querySelector('.close');

  closeBtn.onclick = function () {
    resetEditMode();
    modal.classList.remove('show');
  };

  // Close modal when clicking on the background (modal overlay)
  modal.addEventListener('click', function (event) {
    if (event.target === modal) {
      resetEditMode();
      modal.classList.remove('show');
    }
  });
}

// Reset edit mode when closing modal
function resetEditMode() {
  if (isEditMode) {
    isEditMode = false;
    originalItemData = null;
    document.getElementById('edit-button').style.display = 'inline-block';
    document.getElementById('save-button').style.display = 'none';
    document.getElementById('cancel-button').style.display = 'none';
  }
  // Show edit button again for non-honorific items
  if (currentItemType !== 'honorific') {
    document.getElementById('edit-button').style.display = 'inline-block';
  }
}

// Setup search input listeners for Enter key
function setupSearchListeners() {
  const vocabularySearchInput = document.getElementById('vocabulary-search');
  const grammarSearchInput = document.getElementById('grammar-search');

  vocabularySearchInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
      searchVocabulary();
    }
  });

  grammarSearchInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
      searchGrammar();
    }
  });
}

// Setup scroll listeners for infinite scroll
function setupScrollListeners() {
  const vocabularyList = document.getElementById('vocabulary-list');
  const grammarList = document.getElementById('grammar-list');
  const reviewVocabularyList = document.getElementById('review-vocabulary-list');
  const reviewGrammarList = document.getElementById('review-grammar-list');

  vocabularyList.addEventListener('scroll', function () {
    const { scrollTop, scrollHeight, clientHeight } = vocabularyList;

    // Load more when user scrolls to within 100px of the bottom
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      if (!isLoadingVocabulary && hasMoreVocabulary) {
        loadVocabulary(vocabularyPage + 1, true);
      }
    }
  });

  grammarList.addEventListener('scroll', function () {
    const { scrollTop, scrollHeight, clientHeight } = grammarList;

    // Load more when user scrolls to within 100px of the bottom
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      if (!isLoadingGrammar && hasMoreGrammar) {
        loadGrammar(grammarPage + 1, true);
      }
    }
  });

  reviewVocabularyList.addEventListener('scroll', function () {
    const { scrollTop, scrollHeight, clientHeight } = reviewVocabularyList;

    // Load more when user scrolls to within 100px of the bottom
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      if (!isLoadingReviewVocabulary && hasMoreReviewVocabulary) {
        loadReviewVocabulary(reviewVocabularyPage + 1, true);
      }
    }
  });

  reviewGrammarList.addEventListener('scroll', function () {
    const { scrollTop, scrollHeight, clientHeight } = reviewGrammarList;

    // Load more when user scrolls to within 100px of the bottom
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      if (!isLoadingReviewGrammar && hasMoreReviewGrammar) {
        loadReviewGrammar(reviewGrammarPage + 1, true);
      }
    }
  });
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

    const response = await fetch(`${API_BASE_URL}/${type}/csv`, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      showStatus(statusDiv, 'File uploaded successfully!', 'success');
      fileInput.value = '';

      // Reset pagination state and reload the list after successful upload
      if (type === 'vocabulary') {
        vocabularyPage = 1;
        hasMoreVocabulary = true;
        loadVocabulary(1, false);
      } else {
        grammarPage = 1;
        hasMoreGrammar = true;
        loadGrammar(1, false);
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
async function loadVocabulary(pageNumber, append = false) {
  const listDiv = document.getElementById('vocabulary-list');
  const loadingDiv = document.getElementById('vocabulary-loading');

  if (isLoadingVocabulary) return;

  try {
    isLoadingVocabulary = true;

    if (!append) {
      listDiv.innerHTML = '<div class="loading">Loading...</div>';
    } else {
      loadingDiv.style.display = 'block';
    }

    const keywordParam = vocabularySearchKeyword ? `&keyword=${encodeURIComponent(vocabularySearchKeyword)}` : '';
    const response = await fetch(`${API_BASE_URL}/vocabulary?pageNumber=${pageNumber}&pageSize=${pageSize}${keywordParam}`);

    if (!response.ok) {
      throw new Error('Failed to load vocabulary');
    }

    const data = await response.json();
    vocabularyPage = pageNumber;
    hasMoreVocabulary = data.meta.hasNextPage;

    if (!data.data || data.data.length === 0) {
      if (!append) {
        listDiv.innerHTML = '<div class="empty">No vocabulary data available. Upload a CSV file to get started.</div>';
      }
      hasMoreVocabulary = false;
      return;
    }

    // Render vocabulary items
    const itemsHtml = data.data
      .map(
        (item) => `
            <div class="item-card" onclick="showVocabularyCard(${item.id})">
                <button class="star-button ${item.star ? 'starred' : ''}"
                        onclick="event.stopPropagation(); toggleStar('vocabulary', ${item.id}, this)"
                        aria-label="Star this item">
                    ${item.star ? '★' : '☆'}
                </button>
                <div class="main-text">${escapeHtml(item.kanji)}</div>
                <div class="sub-text">${escapeHtml(item.furigana)}</div>
                <div class="meaning">${escapeHtml(item.meaning)}</div>
            </div>
        `,
      )
      .join('');

    if (append) {
      listDiv.insertAdjacentHTML('beforeend', itemsHtml);
    } else {
      listDiv.innerHTML = itemsHtml;
    }
  } catch (error) {
    if (!append) {
      listDiv.innerHTML = `<div class="error">Error loading vocabulary: ${error.message}</div>`;
    }
  } finally {
    isLoadingVocabulary = false;
    loadingDiv.style.display = 'none';
  }
}

// Load grammar list
async function loadGrammar(pageNumber, append = false) {
  const listDiv = document.getElementById('grammar-list');
  const loadingDiv = document.getElementById('grammar-loading');

  if (isLoadingGrammar) return;

  try {
    isLoadingGrammar = true;

    if (!append) {
      listDiv.innerHTML = '<div class="loading">Loading...</div>';
    } else {
      loadingDiv.style.display = 'block';
    }

    const keywordParam = grammarSearchKeyword ? `&keyword=${encodeURIComponent(grammarSearchKeyword)}` : '';
    const response = await fetch(`${API_BASE_URL}/grammar?pageNumber=${pageNumber}&pageSize=${pageSize}${keywordParam}`);

    if (!response.ok) {
      throw new Error('Failed to load grammar');
    }

    const data = await response.json();
    grammarPage = pageNumber;
    hasMoreGrammar = data.meta.hasNextPage;

    if (!data.data || data.data.length === 0) {
      if (!append) {
        listDiv.innerHTML = '<div class="empty">No grammar data available. Upload a CSV file to get started.</div>';
      }
      hasMoreGrammar = false;
      return;
    }

    // Render grammar items
    const itemsHtml = data.data
      .map(
        (item) => `
            <div class="item-card" onclick="showGrammarCard(${item.id})">
                <button class="star-button ${item.star ? 'starred' : ''}"
                        onclick="event.stopPropagation(); toggleStar('grammar', ${item.id}, this)"
                        aria-label="Star this item">
                    ${item.star ? '★' : '☆'}
                </button>
                <div class="main-text">${escapeHtml(item.grammar)}</div>
                <div class="sub-text">${escapeHtml(item.furigana || '')}</div>
                <div class="meaning">${escapeHtml(item.meaning)}</div>
            </div>
        `,
      )
      .join('');

    if (append) {
      listDiv.insertAdjacentHTML('beforeend', itemsHtml);
    } else {
      listDiv.innerHTML = itemsHtml;
    }
  } catch (error) {
    if (!append) {
      listDiv.innerHTML = `<div class="error">Error loading grammar: ${error.message}</div>`;
    }
  } finally {
    isLoadingGrammar = false;
    loadingDiv.style.display = 'none';
  }
}

// Load review vocabulary list (starred items)
async function loadReviewVocabulary(pageNumber, append = false) {
  const listDiv = document.getElementById('review-vocabulary-list');
  const loadingDiv = document.getElementById('review-vocabulary-loading');

  if (isLoadingReviewVocabulary) return;

  try {
    isLoadingReviewVocabulary = true;

    if (!append) {
      listDiv.innerHTML = '<div class="loading">Loading...</div>';
    } else {
      loadingDiv.style.display = 'block';
    }

    const response = await fetch(`${API_BASE_URL}/vocabulary?pageNumber=${pageNumber}&pageSize=${pageSize}&starred=true`);

    if (!response.ok) {
      throw new Error('Failed to load starred vocabulary');
    }

    const data = await response.json();
    reviewVocabularyPage = pageNumber;
    hasMoreReviewVocabulary = data.meta.hasNextPage;

    if (!data.data || data.data.length === 0) {
      if (!append) {
        listDiv.innerHTML = '<div class="empty">No starred vocabulary items yet. Star some items to review them here.</div>';
      }
      hasMoreReviewVocabulary = false;
      return;
    }

    // Render vocabulary items
    const itemsHtml = data.data
      .map(
        (item) => `
            <div class="item-card" onclick="showVocabularyCard(${item.id}, true)">
                <button class="star-button ${item.star ? 'starred' : ''}"
                        onclick="event.stopPropagation(); toggleStarAndRefreshReview('vocabulary', ${item.id}, this)"
                        aria-label="Star this item">
                    ${item.star ? '★' : '☆'}
                </button>
                <div class="main-text">${escapeHtml(item.kanji)}</div>
                <div class="sub-text">${escapeHtml(item.furigana)}</div>
                <div class="meaning">${escapeHtml(item.meaning)}</div>
            </div>
        `,
      )
      .join('');

    if (append) {
      listDiv.insertAdjacentHTML('beforeend', itemsHtml);
    } else {
      listDiv.innerHTML = itemsHtml;
    }
  } catch (error) {
    if (!append) {
      listDiv.innerHTML = `<div class="error">Error loading starred vocabulary: ${error.message}</div>`;
    }
  } finally {
    isLoadingReviewVocabulary = false;
    loadingDiv.style.display = 'none';
  }
}

// Load review grammar list (starred items)
async function loadReviewGrammar(pageNumber, append = false) {
  const listDiv = document.getElementById('review-grammar-list');
  const loadingDiv = document.getElementById('review-grammar-loading');

  if (isLoadingReviewGrammar) return;

  try {
    isLoadingReviewGrammar = true;

    if (!append) {
      listDiv.innerHTML = '<div class="loading">Loading...</div>';
    } else {
      loadingDiv.style.display = 'block';
    }

    const response = await fetch(`${API_BASE_URL}/grammar?pageNumber=${pageNumber}&pageSize=${pageSize}&starred=true`);

    if (!response.ok) {
      throw new Error('Failed to load starred grammar');
    }

    const data = await response.json();
    reviewGrammarPage = pageNumber;
    hasMoreReviewGrammar = data.meta.hasNextPage;

    if (!data.data || data.data.length === 0) {
      if (!append) {
        listDiv.innerHTML = '<div class="empty">No starred grammar items yet. Star some items to review them here.</div>';
      }
      hasMoreReviewGrammar = false;
      return;
    }

    // Render grammar items
    const itemsHtml = data.data
      .map(
        (item) => `
            <div class="item-card" onclick="showGrammarCard(${item.id}, true)">
                <button class="star-button ${item.star ? 'starred' : ''}"
                        onclick="event.stopPropagation(); toggleStarAndRefreshReview('grammar', ${item.id}, this)"
                        aria-label="Star this item">
                    ${item.star ? '★' : '☆'}
                </button>
                <div class="main-text">${escapeHtml(item.grammar)}</div>
                <div class="sub-text">${escapeHtml(item.furigana || '')}</div>
                <div class="meaning">${escapeHtml(item.meaning)}</div>
            </div>
        `,
      )
      .join('');

    if (append) {
      listDiv.insertAdjacentHTML('beforeend', itemsHtml);
    } else {
      listDiv.innerHTML = itemsHtml;
    }
  } catch (error) {
    if (!append) {
      listDiv.innerHTML = `<div class="error">Error loading starred grammar: ${error.message}</div>`;
    }
  } finally {
    isLoadingReviewGrammar = false;
    loadingDiv.style.display = 'none';
  }
}


// Load all honorifics
async function loadAllHonorifics() {
  loadHonorifics('UP');
  loadHonorifics('DOWN');
  loadHonorifics('NORMAL');
}

// Load honorifics by type
async function loadHonorifics(type) {
  const listDiv = document.getElementById(`honorific-${type.toLowerCase()}-list`);

  try {
    listDiv.innerHTML = '<div class="loading">Loading...</div>';

    const response = await fetch(`${API_BASE_URL}/honorific?type=${type}`);

    if (!response.ok) {
      throw new Error('Failed to load honorifics');
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      listDiv.innerHTML = '<div class="empty">No honorifics available for this type.</div>';
      return;
    }

    // Store data for modal navigation
    honorificData[type] = data;

    // Render honorific items
    const itemsHtml = data
      .map(
        (item, index) => `
          <div class="honorific-item" onclick="showHonorificCard('${type}', ${index})">
            <div class="honorific-row">
              <div class="honorific-label">Plain:</div>
              <div class="honorific-value">
                <span class="honorific-text">${escapeHtml(item.plain)}</span>
                ${item.plainFurigana ? `<span class="honorific-furigana">${escapeHtml(item.plainFurigana)}</span>` : ''}
              </div>
            </div>
            <div class="honorific-arrow">→</div>
            <div class="honorific-row">
              <div class="honorific-label">Honorific:</div>
              <div class="honorific-value">
                <span class="honorific-text honorific-text-honorific">${escapeHtml(item.honorific)}</span>
                ${item.honorificFurigana ? `<span class="honorific-furigana">${escapeHtml(item.honorificFurigana)}</span>` : ''}
              </div>
            </div>
            ${item.meaning ? `<div class="honorific-meaning">${escapeHtml(item.meaning)}</div>` : ''}
          </div>
        `,
      )
      .join('');

    listDiv.innerHTML = itemsHtml;
  } catch (error) {
    listDiv.innerHTML = `<div class="error">Error loading honorifics: ${error.message}</div>`;
  }
}

// Show honorific card in modal
function showHonorificCard(type, index) {
  currentItemList = honorificData[type];
  currentItemType = 'honorific';
  currentItemIndex = index;
  isReviewMode = false;
  isRevealed = false;

  if (!currentItemList || currentItemList.length === 0) {
    alert('No honorific data available.');
    return;
  }

  displayCurrentCard();
  updateNavigationButtons();
  document.getElementById('card-modal').classList.add('show');
}

// Show vocabulary card in modal
async function showVocabularyCard(id, reviewMode = false) {
  try {
    const response = await fetch(`${API_BASE_URL}/vocabulary?pageNumber=1&pageSize=1000`);
    const data = await response.json();

    currentItemList = data.data;
    currentItemType = 'vocabulary';
    currentItemIndex = currentItemList.findIndex((v) => v.id === id);
    isReviewMode = reviewMode;
    isRevealed = false;

    if (currentItemIndex === -1) {
      alert('단어를 찾을 수 없습니다.');
      return;
    }

    displayCurrentCard();
    updateNavigationButtons();
    document.getElementById('card-modal').classList.add('show');
  } catch (error) {
    console.error(error);
    alert('단어 카드 로딩에 실패했습니다.');
  }
}

// Show grammar card in modal
async function showGrammarCard(id, reviewMode = false) {
  try {
    const response = await fetch(`${API_BASE_URL}/grammar?pageNumber=1&pageSize=1000`);
    const data = await response.json();

    currentItemList = data.data;
    currentItemType = 'grammar';
    currentItemIndex = currentItemList.findIndex((g) => g.id === id);
    isReviewMode = reviewMode;
    isRevealed = false;

    if (currentItemIndex === -1) {
      alert('문법을 찾을 수 없습니다.');
      return;
    }

    displayCurrentCard();
    updateNavigationButtons();
    document.getElementById('card-modal').classList.add('show');
  } catch (error) {
    console.error(error);
    alert('문법 카드 로딩에 실패했습니다.');
  }
}

// Display current card content
function displayCurrentCard() {
  const item = currentItemList[currentItemIndex];
  const cardContent = document.getElementById('card-content');

  if (currentItemType === 'honorific') {
    // Honorific items don't have edit mode or star functionality
    cardContent.innerHTML = `
      <div class="honorific-card">
        <div class="honorific-card-section">
          <div class="honorific-card-label">Plain Form (普通形)</div>
          <div class="card-title">${escapeHtml(item.plain)}</div>
          ${item.plainFurigana ? `<div class="card-subtitle">${escapeHtml(item.plainFurigana)}</div>` : ''}
        </div>
        <div class="honorific-card-arrow">↓</div>
        <div class="honorific-card-section">
          <div class="honorific-card-label">Honorific Form (敬語形)</div>
          <div class="card-title honorific-card-honorific">${escapeHtml(item.honorific)}</div>
          ${item.honorificFurigana ? `<div class="card-subtitle">${escapeHtml(item.honorificFurigana)}</div>` : ''}
        </div>
        ${item.meaning ? `<div class="card-memo">${escapeHtmlWithNewlines(item.meaning)}</div>` : ''}
      </div>
    `;

    // Hide edit button for honorifics
    document.getElementById('edit-button').style.display = 'none';
    document.getElementById('save-button').style.display = 'none';
    document.getElementById('cancel-button').style.display = 'none';
  } else if (currentItemType === 'vocabulary') {
    const shouldHideFurigana = isReviewMode && !isRevealed;

    if (isEditMode) {
      cardContent.innerHTML = `
        <button class="star-button-large ${item.star ? 'starred' : ''}"
                onclick="toggleStarInModal('vocabulary', ${item.id}, this)"
                aria-label="Star this item">
          ${item.star ? '★' : '☆'}
        </button>
        <div class="edit-field">
          <label>Kanji:</label>
          <input type="text" id="edit-kanji" value="${escapeHtml(item.kanji)}" />
        </div>
        <div class="edit-field">
          <label>Furigana:</label>
          <input type="text" id="edit-furigana" value="${escapeHtml(item.furigana)}" />
        </div>
        <div class="edit-field">
          <label>Meaning:</label>
          <textarea id="edit-meaning">${escapeHtml(item.meaning)}</textarea>
        </div>
      `;
    } else {
      cardContent.innerHTML = `
        <button class="star-button-large ${item.star ? 'starred' : ''}"
                onclick="toggleStarInModal('vocabulary', ${item.id}, this)"
                aria-label="Star this item">
          ${item.star ? '★' : '☆'}
        </button>
        <div class="card-title">${escapeHtml(item.kanji)}</div>
        <div class="card-subtitle ${shouldHideFurigana ? 'hidden revealable' : ''}"
             ${shouldHideFurigana ? 'onclick="revealContent()"' : ''}>
          ${shouldHideFurigana ? 'Click to reveal' : escapeHtml(item.furigana)}
        </div>
        <div class="card-meaning">${escapeHtmlWithNewlines(item.meaning)}</div>
      `;
    }
  } else if (currentItemType === 'grammar') {
    const shouldHideMeaning = isReviewMode && !isRevealed;

    if (isEditMode) {
      cardContent.innerHTML = `
        <button class="star-button-large ${item.star ? 'starred' : ''}"
                onclick="toggleStarInModal('grammar', ${item.id}, this)"
                aria-label="Star this item">
          ${item.star ? '★' : '☆'}
        </button>
        <div class="edit-field">
          <label>Grammar:</label>
          <input type="text" id="edit-grammar" value="${escapeHtml(item.grammar)}" />
        </div>
        <div class="edit-field">
          <label>Furigana:</label>
          <input type="text" id="edit-grammar-furigana" value="${escapeHtml(item.furigana || '')}" />
        </div>
        <div class="edit-field">
          <label>Meaning:</label>
          <textarea id="edit-meaning">${escapeHtml(item.meaning)}</textarea>
        </div>
        <div class="edit-field">
          <label>Memo:</label>
          <textarea id="edit-memo">${escapeHtml(item.memo || '')}</textarea>
        </div>
      `;
    } else {
      cardContent.innerHTML = `
        <button class="star-button-large ${item.star ? 'starred' : ''}"
                onclick="toggleStarInModal('grammar', ${item.id}, this)"
                aria-label="Star this item">
          ${item.star ? '★' : '☆'}
        </button>
        <div class="card-title">${escapeHtml(item.grammar)}</div>
        ${item.furigana ? `<div class="card-subtitle">${escapeHtml(item.furigana)}</div>` : ''}
        <div class="card-meaning ${shouldHideMeaning ? 'hidden revealable' : ''}"
             ${shouldHideMeaning ? 'onclick="revealContent()"' : ''}>
          ${shouldHideMeaning ? 'Click to reveal' : escapeHtmlWithNewlines(item.meaning)}
        </div>
        ${item.memo ? `<div class="card-memo">${escapeHtmlWithNewlines(item.memo)}</div>` : ''}
      `;
    }
  }
}

// Reveal hidden content in review mode
function revealContent() {
  isRevealed = true;
  displayCurrentCard();
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
  if (isEditMode) {
    return; // Don't allow navigation while in edit mode
  }

  const newIndex = currentItemIndex + direction;

  if (newIndex >= 0 && newIndex < currentItemList.length) {
    currentItemIndex = newIndex;
    isRevealed = false; // Reset reveal state when navigating
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

// Utility function to escape HTML and preserve newlines
function escapeHtmlWithNewlines(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/\n/g, '<br>');
}

// Toggle upload section visibility
function toggleUploadSection(type) {
  const uploadSection = document.getElementById(`${type}-upload-section`);
  const expandButton = document.getElementById(`${type}-expand-button`);

  if (uploadSection.style.display === 'none') {
    // Show the upload section
    uploadSection.style.display = 'block';
    expandButton.style.display = 'none';
  } else {
    // Hide the upload section
    uploadSection.style.display = 'none';
    expandButton.style.display = 'block';
  }
}

// Search vocabulary
function searchVocabulary() {
  const searchInput = document.getElementById('vocabulary-search');
  vocabularySearchKeyword = searchInput.value.trim();
  vocabularyPage = 1;
  hasMoreVocabulary = true;
  loadVocabulary(1, false);
}

// Clear vocabulary search
function clearVocabularySearch() {
  const searchInput = document.getElementById('vocabulary-search');
  searchInput.value = '';
  vocabularySearchKeyword = '';
  vocabularyPage = 1;
  hasMoreVocabulary = true;
  loadVocabulary(1, false);
}

// Search grammar
function searchGrammar() {
  const searchInput = document.getElementById('grammar-search');
  grammarSearchKeyword = searchInput.value.trim();
  grammarPage = 1;
  hasMoreGrammar = true;
  loadGrammar(1, false);
}

// Clear grammar search
function clearGrammarSearch() {
  const searchInput = document.getElementById('grammar-search');
  searchInput.value = '';
  grammarSearchKeyword = '';
  grammarPage = 1;
  hasMoreGrammar = true;
  loadGrammar(1, false);
}

// Toggle star for items in the list
async function toggleStar(type, id, buttonElement) {
  // Store current state for rollback if needed
  const wasStarred = buttonElement.classList.contains('starred');

  // Immediately update UI (optimistic update)
  if (wasStarred) {
    buttonElement.classList.remove('starred');
    buttonElement.textContent = '☆';
  } else {
    buttonElement.classList.add('starred');
    buttonElement.textContent = '★';
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${type}/${id}/star`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to toggle star');
    }

    // Server returns {success: true}, so we keep the optimistic update
    // No need to verify since we trust the toggle worked
  } catch (error) {
    console.error('Error toggling star:', error);

    // Rollback to previous state on error
    if (wasStarred) {
      buttonElement.classList.add('starred');
      buttonElement.textContent = '★';
    } else {
      buttonElement.classList.remove('starred');
      buttonElement.textContent = '☆';
    }

    alert('즐겨찾기 상태 업데이트에 실패했습니다.');
  }
}

// Toggle star for items in the modal
async function toggleStarInModal(type, id, buttonElement) {
  // Store current state for rollback if needed
  const wasStarred = buttonElement.classList.contains('starred');

  // Immediately update UI (optimistic update)
  if (wasStarred) {
    buttonElement.classList.remove('starred');
    buttonElement.textContent = '☆';
  } else {
    buttonElement.classList.add('starred');
    buttonElement.textContent = '★';
  }

  // Also immediately update the list item
  updateListItemStar(type, id, !wasStarred);

  try {
    // Toggle star status
    const starResponse = await fetch(`${API_BASE_URL}/${type}/${id}/star`, {
      method: 'POST',
    });

    if (!starResponse.ok) {
      throw new Error('Failed to toggle star');
    }

    // Fetch the updated single element
    const elementResponse = await fetch(`${API_BASE_URL}/${type}/${id}`);

    if (!elementResponse.ok) {
      throw new Error('Failed to fetch updated element');
    }

    const updatedItem = await elementResponse.json();

    // Update current item in the list
    currentItemList[currentItemIndex] = updatedItem;

    // Verify the state matches the server response
    if (updatedItem.star) {
      buttonElement.classList.add('starred');
      buttonElement.textContent = '★';
    } else {
      buttonElement.classList.remove('starred');
      buttonElement.textContent = '☆';
    }

    // Update the corresponding item in the visible list with confirmed state
    updateListItemStar(type, id, updatedItem.star);
  } catch (error) {
    console.error('Error toggling star:', error);

    // Rollback to previous state on error
    if (wasStarred) {
      buttonElement.classList.add('starred');
      buttonElement.textContent = '★';
    } else {
      buttonElement.classList.remove('starred');
      buttonElement.textContent = '☆';
    }

    // Rollback list item as well
    updateListItemStar(type, id, wasStarred);

    alert('즐겨찾기 상태 업데이트에 실패했습니다.');
  }
}

// Update star status in the visible list without reloading
function updateListItemStar(type, id, isStarred) {
  const listDiv = document.getElementById(`${type}-list`);
  const cards = listDiv.querySelectorAll('.item-card');

  cards.forEach((card) => {
    const starButton = card.querySelector('.star-button');
    if (starButton && starButton.onclick.toString().includes(`${id},`)) {
      if (isStarred) {
        starButton.classList.add('starred');
        starButton.textContent = '★';
      } else {
        starButton.classList.remove('starred');
        starButton.textContent = '☆';
      }
    }
  });
}

// Update item content in the visible list without reloading
function updateListItem(type, id, updatedItem) {
  const listDiv = document.getElementById(`${type}-list`);
  const reviewListDiv = document.getElementById(`review-${type}-list`);

  // Update in main list
  updateItemInList(listDiv, type, id, updatedItem);

  // Update in review list if it exists
  if (currentTab === 'review') {
    updateItemInList(reviewListDiv, type, id, updatedItem);
  }
}

// Helper function to update a specific item card in a list
function updateItemInList(listDiv, type, id, updatedItem) {
  const cards = listDiv.querySelectorAll('.item-card');

  cards.forEach((card) => {
    // Check if this card matches the item ID by examining the onclick attribute
    const onclickAttr = card.getAttribute('onclick');
    if (onclickAttr && onclickAttr.includes(`(${id}`)) {
      // Found the matching card - update its content
      if (type === 'vocabulary') {
        const mainText = card.querySelector('.main-text');
        const subText = card.querySelector('.sub-text');
        const meaning = card.querySelector('.meaning');

        if (mainText) mainText.textContent = updatedItem.kanji;
        if (subText) subText.textContent = updatedItem.furigana;
        if (meaning) meaning.textContent = updatedItem.meaning;
      } else if (type === 'grammar') {
        const mainText = card.querySelector('.main-text');
        const subText = card.querySelector('.sub-text');
        const meaning = card.querySelector('.meaning');

        if (mainText) mainText.textContent = updatedItem.grammar;
        if (subText) subText.textContent = updatedItem.furigana || '';
        if (meaning) meaning.textContent = updatedItem.meaning;
      }
    }
  });
}

// Toggle star and refresh review tab if active
async function toggleStarAndRefreshReview(type, id, buttonElement) {
  // Store current state for rollback if needed
  const wasStarred = buttonElement.classList.contains('starred');

  // Immediately update UI (optimistic update)
  if (wasStarred) {
    buttonElement.classList.remove('starred');
    buttonElement.textContent = '☆';
  } else {
    buttonElement.classList.add('starred');
    buttonElement.textContent = '★';
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${type}/${id}/star`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to toggle star');
    }

    // Refresh the review lists
    reviewVocabularyPage = 1;
    reviewGrammarPage = 1;
    hasMoreReviewVocabulary = true;
    hasMoreReviewGrammar = true;
    loadReviewVocabulary(1, false);
    loadReviewGrammar(1, false);
  } catch (error) {
    console.error('Error toggling star:', error);

    // Rollback to previous state on error
    if (wasStarred) {
      buttonElement.classList.add('starred');
      buttonElement.textContent = '★';
    } else {
      buttonElement.classList.remove('starred');
      buttonElement.textContent = '☆';
    }

    alert('즐겨찾기 상태 업데이트에 실패했습니다.');
  }
}

// Toggle edit mode
function toggleEditMode() {
  if (!isEditMode) {
    // Entering edit mode - save original data
    const item = currentItemList[currentItemIndex];
    originalItemData = { ...item };
    isEditMode = true;

    // Update button visibility
    document.getElementById('edit-button').style.display = 'none';
    document.getElementById('save-button').style.display = 'inline-block';
    document.getElementById('cancel-button').style.display = 'inline-block';
    document.getElementById('prev-arrow').disabled = true;
    document.getElementById('next-arrow').disabled = true;

    displayCurrentCard();
  }
}

// Cancel edit mode
function cancelEdit() {
  if (isEditMode) {
    // Restore original data
    if (originalItemData) {
      currentItemList[currentItemIndex] = { ...originalItemData };
      originalItemData = null;
    }

    isEditMode = false;

    // Update button visibility
    document.getElementById('edit-button').style.display = 'inline-block';
    document.getElementById('save-button').style.display = 'none';
    document.getElementById('cancel-button').style.display = 'none';
    document.getElementById('prev-arrow').disabled = currentItemIndex === 0;
    document.getElementById('next-arrow').disabled = currentItemIndex === currentItemList.length - 1;

    displayCurrentCard();
  }
}

// Save changes
async function saveChanges() {
  const item = currentItemList[currentItemIndex];
  const id = item.id;

  let updatedData = {};

  try {
    if (currentItemType === 'vocabulary') {
      const kanji = document.getElementById('edit-kanji').value.trim();
      const furigana = document.getElementById('edit-furigana').value.trim();
      const meaning = document.getElementById('edit-meaning').value.trim();

      if (!kanji || !meaning) {
        alert('한자와 뜻을 입력해주세요.');
        return;
      }

      updatedData = { kanji, furigana, meaning };
    } else if (currentItemType === 'grammar') {
      const grammar = document.getElementById('edit-grammar').value.trim();
      const furigana = document.getElementById('edit-grammar-furigana').value.trim();
      const meaning = document.getElementById('edit-meaning').value.trim();
      const memo = document.getElementById('edit-memo').value.trim();

      if (!grammar || !meaning) {
        alert('문법과 뜻을 입력해주세요.');
        return;
      }

      updatedData = { grammar, furigana, meaning, memo };
    }

    // Send PUT request
    const response = await fetch(`${API_BASE_URL}/${currentItemType}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      throw new Error('Failed to save changes');
    }

    // Update the item in the current list
    Object.assign(currentItemList[currentItemIndex], updatedData);

    // Exit edit mode
    isEditMode = false;
    originalItemData = null;

    // Update button visibility
    document.getElementById('edit-button').style.display = 'inline-block';
    document.getElementById('save-button').style.display = 'none';
    document.getElementById('cancel-button').style.display = 'none';
    document.getElementById('prev-arrow').disabled = currentItemIndex === 0;
    document.getElementById('next-arrow').disabled = currentItemIndex === currentItemList.length - 1;

    // Refresh display
    displayCurrentCard();

    // Update the specific item in the visible list without reloading
    updateListItem(currentItemType, id, currentItemList[currentItemIndex]);

    alert('수정 완료!');
  } catch (error) {
    console.error('Error saving changes:', error);
    alert('수정에 실패했습니다.');
  }
}

// Floating Action Button functionality
function setupFAB() {
  // Close FAB menu when clicking outside
  document.addEventListener('click', function (event) {
    const fabContainer = document.querySelector('.fab-container');
    const fabMenu = document.getElementById('fab-menu');
    const fabButton = document.getElementById('fab-button');

    if (!fabContainer.contains(event.target)) {
      fabMenu.classList.remove('show');
      fabButton.classList.remove('active');
    }
  });
}

function toggleFabMenu() {
  const fabMenu = document.getElementById('fab-menu');
  const fabButton = document.getElementById('fab-button');

  fabMenu.classList.toggle('show');
  fabButton.classList.toggle('active');
}

// Create Modal functionality
function setupCreateModal() {
  const createModal = document.getElementById('create-modal');

  // Close modal when clicking on the background
  createModal.addEventListener('click', function (event) {
    if (event.target === createModal) {
      closeCreateModal();
    }
  });
}

function openCreateModal(type) {
  const modal = document.getElementById('create-modal');
  const title = document.getElementById('create-modal-title');
  const formContent = document.getElementById('create-form-content');

  // Close FAB menu
  document.getElementById('fab-menu').classList.remove('show');
  document.getElementById('fab-button').classList.remove('active');

  if (type === 'vocabulary') {
    title.textContent = '단어 추가';
    formContent.innerHTML = `
      <div class="create-form">
        <div class="form-field">
          <label for="create-kanji">Kanji (漢字) <span style="color: #e74c3c;">*</span></label>
          <input type="text" id="create-kanji" placeholder="例: 勉強" required />
        </div>
        <div class="form-field">
          <label for="create-furigana">Furigana (ふりがな)</label>
          <input type="text" id="create-furigana" placeholder="例: べんきょう" />
        </div>
        <div class="form-field">
          <label for="create-meaning">Meaning (의미) <span style="color: #e74c3c;">*</span></label>
          <input type="text" id="create-meaning" placeholder="例: 공부" required />
        </div>
        <div class="form-actions">
          <button class="submit-button" onclick="submitCreate('vocabulary')">Add</button>
          <button class="cancel-form-button" onclick="closeCreateModal()">Cancel</button>
        </div>
      </div>
    `;
  } else if (type === 'grammar') {
    title.textContent = '문법 추가';
    formContent.innerHTML = `
      <div class="create-form">
        <div class="form-field">
          <label for="create-grammar">Grammar (文法) <span style="color: #e74c3c;">*</span></label>
          <input type="text" id="create-grammar" placeholder="例: ～ために" required />
        </div>
        <div class="form-field">
          <label for="create-grammar-furigana">Furigana (ふりがな)</label>
          <input type="text" id="create-grammar-furigana" placeholder="例: ～ために" />
        </div>
        <div class="form-field">
          <label for="create-grammar-meaning">Meaning (의미) <span style="color: #e74c3c;">*</span></label>
          <textarea id="create-grammar-meaning" placeholder="例: ~하기 위해서, ~때문에" required></textarea>
        </div>
        <div class="form-field">
          <label for="create-memo">Memo (メモ)</label>
          <textarea id="create-memo" placeholder="例: 用法: V辞書形/Nの + ために"></textarea>
        </div>
        <div class="form-actions">
          <button class="submit-button" onclick="submitCreate('grammar')">Add</button>
          <button class="cancel-form-button" onclick="closeCreateModal()">Cancel</button>
        </div>
      </div>
    `;
  }

  modal.classList.add('show');
}

function closeCreateModal() {
  const modal = document.getElementById('create-modal');
  modal.classList.remove('show');
}

async function submitCreate(type) {
  let createData = {};

  try {
    if (type === 'vocabulary') {
      const kanji = document.getElementById('create-kanji').value.trim();
      const furigana = document.getElementById('create-furigana').value.trim();
      const meaning = document.getElementById('create-meaning').value.trim();

      if (!kanji || !meaning) {
        alert('한자와 뜻을 입력해주세요.');
        return;
      }

      createData = { kanji, furigana, meaning };
    } else if (type === 'grammar') {
      const grammar = document.getElementById('create-grammar').value.trim();
      const furigana = document.getElementById('create-grammar-furigana').value.trim();
      const meaning = document.getElementById('create-grammar-meaning').value.trim();
      const memo = document.getElementById('create-memo').value.trim();

      if (!grammar || !meaning) {
        alert('문법과 뜻을 입력해주세요.');
        return;
      }

      createData = { grammar, furigana, meaning, memo };
    }

    // Send POST request
    const response = await fetch(`${API_BASE_URL}/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create item');
    }

    // Close modal
    closeCreateModal();

    // Reload the appropriate list
    if (type === 'vocabulary') {
      vocabularyPage = 1;
      hasMoreVocabulary = true;
      loadVocabulary(1, false);
    } else if (type === 'grammar') {
      grammarPage = 1;
      hasMoreGrammar = true;
      loadGrammar(1, false);
    }

    alert('추가 완료!');
  } catch (error) {
    console.error('Error creating item:', error);
    alert(`추가에 실패했습니다`);
  }
}
