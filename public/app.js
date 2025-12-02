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

// Modal navigation state
let currentItemList = [];
let currentItemIndex = 0;
let currentItemType = '';
let isReviewMode = false;
let isRevealed = false;
let isEditMode = false;
let originalItemData = null;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  setupTabs();
  setupModal();
  setupScrollListeners();
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

  window.onclick = function (event) {
    if (event.target === modal) {
      resetEditMode();
      modal.classList.remove('show');
    }
  };
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

    const response = await fetch(`${API_BASE_URL}/${type}`, {
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

    const response = await fetch(`${API_BASE_URL}/vocabulary?pageNumber=${pageNumber}&pageSize=${pageSize}`);

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

    const response = await fetch(`${API_BASE_URL}/grammar?pageNumber=${pageNumber}&pageSize=${pageSize}`);

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
        <div class="card-meaning">${escapeHtml(item.meaning)}</div>
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
        <div class="card-meaning ${shouldHideMeaning ? 'hidden revealable' : ''}"
             ${shouldHideMeaning ? 'onclick="revealContent()"' : ''}>
          ${shouldHideMeaning ? 'Click to reveal' : escapeHtml(item.meaning)}
        </div>
        ${item.memo ? `<div class="card-memo">${escapeHtml(item.memo)}</div>` : ''}
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

    alert('Failed to update star status');
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

    alert('Failed to update star status');
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
  updateItemInList(listDiv, type, id, updatedItem, false);

  // Update in review list if it exists
  if (currentTab === 'review') {
    updateItemInList(reviewListDiv, type, id, updatedItem, true);
  }
}

// Helper function to update a specific item card in a list
function updateItemInList(listDiv, type, id, updatedItem, isReview) {
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
        const meaning = card.querySelector('.meaning');

        if (mainText) mainText.textContent = updatedItem.grammar;
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

    alert('Failed to update star status');
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

      if (!kanji || !furigana || !meaning) {
        alert('All fields are required');
        return;
      }

      updatedData = { kanji, furigana, meaning };
    } else if (currentItemType === 'grammar') {
      const grammar = document.getElementById('edit-grammar').value.trim();
      const meaning = document.getElementById('edit-meaning').value.trim();
      const memo = document.getElementById('edit-memo').value.trim();

      if (!grammar || !meaning) {
        alert('Grammar and meaning fields are required');
        return;
      }

      updatedData = { grammar, meaning, memo };
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

    alert('Changes saved successfully!');
  } catch (error) {
    console.error('Error saving changes:', error);
    alert('Failed to save changes: ' + error.message);
  }
}
