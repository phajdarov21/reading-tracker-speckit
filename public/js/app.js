import {
  search, addBook, listBooks, updateBook, getStats, removeBook,
} from './api.js';

const searchForm = document.getElementById('search-form');
const searchQueryInput = document.getElementById('search-query');
const searchErrorEl = document.getElementById('search-error');
const searchResultsEl = document.getElementById('search-results');
const bookListEl = document.getElementById('book-list');
const listErrorEl = document.getElementById('list-error');
const categoryFilterEl = document.getElementById('category-filter');
const statsPanelEl = document.getElementById('stats-panel');
const removeDialogEl = document.getElementById('remove-confirm-dialog');
const removeMessageEl = document.getElementById('remove-confirm-message');
const removeYesButton = document.getElementById('remove-confirm-yes');
const removeCancelButton = document.getElementById('remove-confirm-cancel');

let pendingRemoveId = null;

function openRemoveConfirm(book) {
  pendingRemoveId = book.id;
  removeMessageEl.textContent = `Remove "${book.title}" from your list?`;
  removeDialogEl.hidden = false;
}

function closeRemoveConfirm() {
  pendingRemoveId = null;
  removeDialogEl.hidden = true;
}

const CATEGORY_LABELS = {
  want_to_read: 'Want to read',
  reading: 'Reading',
  finished: 'Finished',
};

function showError(el, message) {
  el.textContent = message;
  el.hidden = false;
}

function clearError(el) {
  el.textContent = '';
  el.hidden = true;
}

function createCategorySelect(selectedValue) {
  const select = document.createElement('select');
  for (const [value, label] of Object.entries(CATEGORY_LABELS)) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    if (value === selectedValue) option.selected = true;
    select.appendChild(option);
  }
  return select;
}

function hasUsablePageCount(result) {
  return Number.isInteger(result.pageCount) && result.pageCount > 0;
}

function createResultCard(result) {
  const li = document.createElement('li');
  li.className = 'result-card';

  if (result.coverUrl) {
    const img = document.createElement('img');
    img.src = result.coverUrl;
    img.alt = '';
    li.appendChild(img);
  }

  const details = document.createElement('div');
  details.className = 'result-details';

  const titleEl = document.createElement('p');
  titleEl.textContent = result.firstPublishYear
    ? `${result.title} by ${result.author} (${result.firstPublishYear})`
    : `${result.title} by ${result.author}`;
  details.appendChild(titleEl);

  const form = document.createElement('form');
  form.className = 'add-form';

  const categoryLabel = document.createElement('label');
  categoryLabel.textContent = 'Category';
  const categorySelect = createCategorySelect('want_to_read');
  categoryLabel.appendChild(categorySelect);
  form.appendChild(categoryLabel);

  // Open Library already reported a usable page count for this result (FR-004),
  // so no manual "Total pages" field is shown; otherwise fall back to manual
  // entry with the same validation as before (FR-004a).
  const autoFilled = hasUsablePageCount(result);
  let pagesInput = null;
  if (!autoFilled) {
    const pagesLabel = document.createElement('label');
    pagesLabel.textContent = 'Total pages';
    pagesInput = document.createElement('input');
    pagesInput.type = 'number';
    pagesInput.min = '1';
    pagesInput.required = true;
    pagesLabel.appendChild(pagesInput);
    form.appendChild(pagesLabel);
  }

  const addButton = document.createElement('button');
  addButton.type = 'submit';
  addButton.textContent = 'Add to list';
  form.appendChild(addButton);

  const errorEl = document.createElement('p');
  errorEl.className = 'error';
  errorEl.hidden = true;
  form.appendChild(errorEl);

  details.appendChild(form);
  li.appendChild(details);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearError(errorEl);
    const totalPages = autoFilled ? result.pageCount : Number(pagesInput.value);

    try {
      await addBook({
        openLibraryWorkId: result.openLibraryWorkId,
        title: result.title,
        author: result.author,
        firstPublishYear: result.firstPublishYear,
        coverUrl: result.coverUrl,
        category: categorySelect.value,
        totalPages,
      });
      addButton.disabled = true;
      addButton.textContent = 'Added';
      await refreshAll();
    } catch (err) {
      showError(errorEl, err.message);
    }
  });

  return li;
}

function renderSearchResults(results) {
  searchResultsEl.innerHTML = '';
  for (const result of results) {
    searchResultsEl.appendChild(createResultCard(result));
  }
}

function createProgressBar(percent) {
  const wrapper = document.createElement('div');
  wrapper.className = 'progress-bar';
  const fill = document.createElement('div');
  fill.className = 'progress-bar-fill';
  fill.style.width = `${percent}%`;
  wrapper.appendChild(fill);
  return wrapper;
}

function createBookCard(book) {
  const li = document.createElement('li');
  li.className = 'book-card';

  if (book.coverUrl) {
    const img = document.createElement('img');
    img.src = book.coverUrl;
    img.alt = '';
    li.appendChild(img);
  }

  const details = document.createElement('div');
  details.className = 'book-details';

  const titleEl = document.createElement('p');
  titleEl.textContent = `${book.title} by ${book.author}`;
  details.appendChild(titleEl);

  const categoryLabel = document.createElement('label');
  categoryLabel.textContent = 'Category';
  const categorySelect = createCategorySelect(book.category);
  categoryLabel.appendChild(categorySelect);
  details.appendChild(categoryLabel);

  const progressText = document.createElement('p');
  progressText.textContent = `Progress: ${book.progressPercent}% (page ${book.currentPage} of ${book.totalPages})`;
  details.appendChild(progressText);
  details.appendChild(createProgressBar(book.progressPercent));

  const pageLabel = document.createElement('label');
  pageLabel.textContent = 'Current page';
  const pageInput = document.createElement('input');
  pageInput.type = 'number';
  pageInput.min = '0';
  pageInput.max = String(book.totalPages);
  pageInput.value = String(book.currentPage);
  pageLabel.appendChild(pageInput);
  details.appendChild(pageLabel);

  const updatePageButton = document.createElement('button');
  updatePageButton.type = 'button';
  updatePageButton.textContent = 'Update page';
  details.appendChild(updatePageButton);

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.textContent = 'Remove';
  removeButton.addEventListener('click', () => {
    openRemoveConfirm(book);
  });
  details.appendChild(removeButton);

  const errorEl = document.createElement('p');
  errorEl.className = 'error';
  errorEl.hidden = true;
  details.appendChild(errorEl);

  categorySelect.addEventListener('change', async () => {
    clearError(errorEl);
    try {
      await updateBook(book.id, { category: categorySelect.value });
      await refreshAll();
    } catch (err) {
      showError(errorEl, err.message);
      categorySelect.value = book.category;
    }
  });

  updatePageButton.addEventListener('click', async () => {
    clearError(errorEl);
    const currentPage = Number(pageInput.value);
    try {
      await updateBook(book.id, { currentPage });
      await refreshAll();
    } catch (err) {
      showError(errorEl, err.message);
    }
  });

  li.appendChild(details);
  return li;
}

function renderBookList(books) {
  bookListEl.innerHTML = '';
  for (const book of books) {
    bookListEl.appendChild(createBookCard(book));
  }
}

async function refreshBookList() {
  const category = categoryFilterEl ? categoryFilterEl.value : 'all';
  try {
    const { books } = await listBooks(category);
    clearError(listErrorEl);
    renderBookList(books);
  } catch (err) {
    showError(listErrorEl, err.message);
  }
}

function renderStats(stats) {
  statsPanelEl.innerHTML = '';
  const rows = [
    ['Want to read', stats.countsByCategory.want_to_read],
    ['Reading', stats.countsByCategory.reading],
    ['Finished', stats.countsByCategory.finished],
    ['Total finished', stats.totalFinished],
    ['Average progress (reading)', `${stats.averageReadingProgress}%`],
  ];
  for (const [label, value] of rows) {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = String(value);
    statsPanelEl.append(dt, dd);
  }
}

async function refreshStats() {
  try {
    const stats = await getStats();
    renderStats(stats);
  } catch (err) {
    // Statistics are supplementary; list/search sections already surface their own errors.
  }
}

async function refreshAll() {
  await Promise.all([refreshBookList(), refreshStats()]);
}

if (categoryFilterEl) {
  categoryFilterEl.addEventListener('change', () => {
    refreshBookList();
  });
}

if (removeCancelButton) {
  removeCancelButton.addEventListener('click', () => {
    closeRemoveConfirm();
  });
}

if (removeYesButton) {
  removeYesButton.addEventListener('click', async () => {
    const id = pendingRemoveId;
    closeRemoveConfirm();
    if (id == null) return;
    try {
      await removeBook(id);
      await refreshAll();
    } catch (err) {
      showError(listErrorEl, err.message);
    }
  });
}

refreshAll();

if (searchForm) {
  searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearError(searchErrorEl);
    searchResultsEl.innerHTML = '';

    try {
      const { results } = await search(searchQueryInput.value);
      if (results.length === 0) {
        showError(searchErrorEl, 'No books matched your search.');
      }
      renderSearchResults(results);
    } catch (err) {
      showError(searchErrorEl, err.message);
    }
  });
}
