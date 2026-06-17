// Application State
let state = {
    releases: [],
    filteredReleases: [],
    selectedItem: null,
    searchQuery: '',
    activeType: 'all',
    activeMonth: 'all',
    sortBy: 'desc',
    currentTemplateIdx: 0
};

// UI Elements
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = refreshBtn.querySelector('.refresh-icon');
const searchInput = document.getElementById('search-input');
const clearSearch = document.getElementById('clear-search');
const monthFilter = document.getElementById('month-filter');
const sortSelect = document.getElementById('sort-select');
const feedContent = document.getElementById('feed-content');
const skeletonLoader = document.getElementById('skeleton-loader');
const emptyState = document.getElementById('empty-state');
const resetFiltersBtn = document.getElementById('reset-filters-btn');
const visibleCount = document.getElementById('visible-count');
const totalCount = document.getElementById('total-count');

// Selection Bar Elements
const selectionBar = document.getElementById('selection-bar');
const selectedTypeBadge = document.getElementById('selected-type-badge');
const selectedDateLbl = document.getElementById('selected-date-lbl');
const composeTweetBtn = document.getElementById('compose-tweet-btn');
const clearSelectionBtn = document.getElementById('clear-selection-btn');

// Composer Modal Elements
const composerModal = document.getElementById('composer-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
const postTweetBtn = document.getElementById('post-tweet-btn');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCountNum = document.getElementById('char-count-num');
const progressRingCircle = document.getElementById('char-progress-ring');
const warningMsg = document.getElementById('warning-msg');
const templatePills = document.querySelectorAll('.template-pill');

// Progress ring initialization
const ringRadius = progressRingCircle.r.baseVal.value;
const ringCircumference = ringRadius * 2 * Math.PI;
progressRingCircle.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
progressRingCircle.style.strokeDashoffset = ringCircumference;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    fetchReleases();
    setupEventListeners();
});

// Fetch Release Notes
async function fetchReleases(forceRefresh = false) {
    showLoading();
    state.selectedItem = null;
    updateSelectionBar();
    
    try {
        const url = forceRefresh ? '/api/releases?refresh=true' : '/api/releases';
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            state.releases = result.data;
            populateFilterOptions();
            updateStatsBadges();
            applyFiltersAndRender();
        } else {
            alert(`Error: ${result.error || 'Failed to fetch release notes'}`);
            hideLoading();
        }
    } catch (error) {
        console.error('Error fetching release notes:', error);
        alert('An error occurred while fetching release notes. Please check the server connection.');
        hideLoading();
    }
}

// Show/Hide Loading Skeleton
function showLoading() {
    skeletonLoader.style.display = 'block';
    feedContent.style.display = 'none';
    emptyState.style.display = 'none';
    refreshIcon.classList.add('spinning');
    refreshBtn.disabled = true;
}

function hideLoading() {
    skeletonLoader.style.display = 'none';
    refreshIcon.classList.remove('spinning');
    refreshBtn.disabled = false;
}

// Setup Event Listeners
function setupEventListeners() {
    // Refresh Notes
    refreshBtn.addEventListener('click', () => fetchReleases(true));
    
    // Search Filter
    searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        clearSearch.style.display = state.searchQuery ? 'block' : 'none';
        applyFiltersAndRender();
    });
    
    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        state.searchQuery = '';
        clearSearch.style.display = 'none';
        applyFiltersAndRender();
        searchInput.focus();
    });
    
    // Type Filters
    document.querySelectorAll('.filter-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-type-btn').forEach(b => b.classList.remove('active'));
            const clickedBtn = e.currentTarget;
            clickedBtn.classList.add('active');
            state.activeType = clickedBtn.dataset.type;
            applyFiltersAndRender();
        });
    });
    
    // Month Filter
    monthFilter.addEventListener('change', (e) => {
        state.activeMonth = e.target.value;
        applyFiltersAndRender();
    });
    
    // Sort Filter
    sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        applyFiltersAndRender();
    });
    
    // Reset Filters button
    resetFiltersBtn.addEventListener('click', resetAllFilters);
    
    // Selection Bar Buttons
    clearSelectionBtn.addEventListener('click', () => {
        state.selectedItem = null;
        updateSelectionBar();
        document.querySelectorAll('.release-card').forEach(card => card.classList.remove('selected'));
    });
    
    composeTweetBtn.addEventListener('click', openComposerModal);
    
    // Modal Close
    closeModalBtn.addEventListener('click', closeComposerModal);
    cancelTweetBtn.addEventListener('click', closeComposerModal);
    
    // Close modal on click outside
    composerModal.addEventListener('click', (e) => {
        if (e.target === composerModal) {
            closeComposerModal();
        }
    });
    
    // Character Counter on Textarea
    tweetTextarea.addEventListener('input', updateCharCounter);
    
    // Template Pill selection
    templatePills.forEach(pill => {
        pill.addEventListener('click', (e) => {
            templatePills.forEach(p => p.classList.remove('active'));
            const clickedPill = e.currentTarget;
            clickedPill.classList.add('active');
            state.currentTemplateIdx = parseInt(clickedPill.dataset.templateIdx);
            
            // Re-draft with the selected template
            if (state.selectedItem) {
                tweetTextarea.value = generateTweetDraft(state.selectedItem, state.currentTemplateIdx);
                updateCharCounter();
            }
        });
    });
    
    // Post Tweet Intent Link
    postTweetBtn.addEventListener('click', () => {
        const text = tweetTextarea.value;
        if (text.length > 280) {
            alert('Cannot post: Tweet text exceeds the 280-character limit.');
            return;
        }
        const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(intentUrl, '_blank', 'noopener,noreferrer');
        closeComposerModal();
    });
}

// Reset all filtering parameters
function resetAllFilters() {
    searchInput.value = '';
    state.searchQuery = '';
    clearSearch.style.display = 'none';
    
    state.activeType = 'all';
    document.querySelectorAll('.filter-type-btn').forEach(btn => {
        if (btn.dataset.type === 'all') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    state.activeMonth = 'all';
    monthFilter.value = 'all';
    
    state.sortBy = 'desc';
    sortSelect.value = 'desc';
    
    applyFiltersAndRender();
}

// Extract unique months for select dropdown
function populateFilterOptions() {
    // Gather all months from release notes
    const months = new Set();
    
    state.releases.forEach(item => {
        if (item.date) {
            const parts = item.date.split(',');
            if (parts.length >= 2) {
                // "June 15" -> "June", " 2026"
                const monthDay = parts[0].trim(); // "June 15"
                const year = parts[1].trim(); // "2026"
                const monthName = monthDay.split(' ')[0]; // "June"
                months.add(`${monthName} ${year}`);
            }
        }
    });
    
    // Convert to sorted list or preserve feed reverse chronological order
    // Since the feed is chronological, we just sort them in descending order of dates
    const sortedMonths = Array.from(months);
    
    // Clear and build month filter
    monthFilter.innerHTML = '<option value="all">All Months</option>';
    sortedMonths.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        monthFilter.appendChild(opt);
    });
}

// Update the type counts in the sidebar
function updateStatsBadges() {
    const counts = {
        all: state.releases.length,
        Feature: 0,
        Announcement: 0,
        Issue: 0,
        Changed: 0,
        Deprecated: 0,
        Update: 0
    };
    
    state.releases.forEach(item => {
        const type = item.type;
        if (counts.hasOwnProperty(type)) {
            counts[type]++;
        } else {
            counts['Update']++;
        }
    });
    
    document.getElementById('count-all').textContent = counts.all;
    document.getElementById('count-feature').textContent = counts.Feature;
    document.getElementById('count-announcement').textContent = counts.Announcement;
    document.getElementById('count-issue').textContent = counts.Issue;
    document.getElementById('count-changed').textContent = counts.Changed;
    document.getElementById('count-deprecated').textContent = counts.Deprecated;
    document.getElementById('count-other').textContent = counts.Update;
}

// Apply searches, filters, and sorts
function applyFiltersAndRender() {
    let results = [...state.releases];
    
    // 1. Text Search Filter
    if (state.searchQuery) {
        const q = state.searchQuery;
        results = results.filter(item => {
            return (item.text && item.text.toLowerCase().includes(q)) ||
                   (item.type && item.type.toLowerCase().includes(q)) ||
                   (item.date && item.date.toLowerCase().includes(q));
        });
    }
    
    // 2. Type Filter
    if (state.activeType !== 'all') {
        results = results.filter(item => item.type === state.activeType);
    }
    
    // 3. Month Filter
    if (state.activeMonth !== 'all') {
        results = results.filter(item => {
            if (!item.date) return false;
            const parts = item.date.split(',');
            if (parts.length >= 2) {
                const monthDay = parts[0].trim();
                const year = parts[1].trim();
                const monthName = monthDay.split(' ')[0];
                return `${monthName} ${year}` === state.activeMonth;
            }
            return false;
        });
    }
    
    // 4. Sort Date
    results.sort((a, b) => {
        // Simple string parsing or standard Date parsing
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        if (state.sortBy === 'asc') {
            return dateA - dateB;
        } else {
            return dateB - dateA;
        }
    });
    
    state.filteredReleases = results;
    
    // Render Results
    renderReleases();
}

// Render release cards in the feed
function renderReleases() {
    feedContent.innerHTML = '';
    
    totalCount.textContent = state.releases.length;
    visibleCount.textContent = state.filteredReleases.length;
    
    if (state.filteredReleases.length === 0) {
        feedContent.style.display = 'none';
        emptyState.style.display = 'block';
        hideLoading();
        return;
    }
    
    emptyState.style.display = 'none';
    feedContent.style.display = 'block';
    
    state.filteredReleases.forEach(item => {
        const card = document.createElement('div');
        card.className = `release-card ${state.selectedItem && state.selectedItem.id === item.id ? 'selected' : ''}`;
        card.dataset.id = item.id;
        
        const typeClass = item.type.toLowerCase();
        
        card.innerHTML = `
            <div class="card-header">
                <div class="badge-and-date">
                    <span class="type-badge ${typeClass}">${item.type}</span>
                    <span class="card-date">${item.date}</span>
                </div>
                <div class="selection-indicator">
                    <i class="fa-solid fa-check"></i>
                </div>
            </div>
            <div class="card-body">
                ${item.html}
            </div>
        `;
        
        // Handle Card Selection (clicking anywhere selects it)
        card.addEventListener('click', () => toggleCardSelection(item));
        
        feedContent.appendChild(card);
    });
    
    hideLoading();
}

// Toggle selection state of a card
function toggleCardSelection(item) {
    if (state.selectedItem && state.selectedItem.id === item.id) {
        state.selectedItem = null; // Deselect
    } else {
        state.selectedItem = item; // Select
    }
    
    // Re-render feed cards to update active styling (selected borders)
    document.querySelectorAll('.release-card').forEach(card => {
        if (card.dataset.id === (state.selectedItem ? state.selectedItem.id : '')) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    
    updateSelectionBar();
}

// Update the visibility and content of the bottom floating bar
function updateSelectionBar() {
    if (state.selectedItem) {
        selectedTypeBadge.textContent = state.selectedItem.type;
        // Apply type-specific colors to selection bar text badge
        selectedTypeBadge.className = 'type-badge ' + state.selectedItem.type.toLowerCase();
        selectedDateLbl.textContent = state.selectedItem.date;
        selectionBar.classList.add('active');
    } else {
        selectionBar.classList.remove('active');
    }
}

// Helper to truncate text intelligently to fit character limits
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    // Look for a space near the limit to avoid cutting words
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength - 30) {
        return truncated.substring(0, lastSpace) + '...';
    }
    return truncated.substring(0, maxLength - 3) + '...';
}

// Generate X/Twitter post draft contents based on template selections
function generateTweetDraft(item, templateIdx) {
    const date = item.date;
    const type = item.type;
    const bodyText = item.text;
    
    // Base components
    let hashtags = '#BigQuery #GoogleCloud';
    if (type === 'Feature') hashtags = '#BigQuery #DataAnalytics #GCP';
    if (type === 'Issue') hashtags = '#BigQuery #DataOps';
    
    let draft = '';
    
    if (templateIdx === 0) {
        // Standard template
        const prefix = `🚀 New BigQuery ${type} (${date}): `;
        const suffix = `\n\n${hashtags}`;
        const allowedBodyLen = 280 - (prefix.length + suffix.length);
        const truncatedBody = truncateText(bodyText, allowedBodyLen);
        draft = `${prefix}${truncatedBody}${suffix}`;
    } 
    else if (templateIdx === 1) {
        // Summary template
        const prefix = `💡 `;
        const suffix = `\n\n- GCP BigQuery update (${date})\n${hashtags}`;
        const allowedBodyLen = 280 - (prefix.length + suffix.length);
        const truncatedBody = truncateText(bodyText, allowedBodyLen);
        draft = `${prefix}${truncatedBody}${suffix}`;
    } 
    else {
        // Quick Announcement template
        const prefix = `📢 BigQuery Update | ${date}\n\n`;
        const suffix = `\n\n#GoogleCloud`;
        const allowedBodyLen = 280 - (prefix.length + suffix.length);
        const truncatedBody = truncateText(bodyText, allowedBodyLen);
        draft = `${prefix}${truncatedBody}${suffix}`;
    }
    
    return draft;
}

// Open Composer Modal
function openComposerModal() {
    if (!state.selectedItem) return;
    
    // Reset templates and load first template as default
    state.currentTemplateIdx = 0;
    templatePills.forEach((pill, idx) => {
        if (idx === 0) pill.classList.add('active');
        else pill.classList.remove('active');
    });
    
    // Fill text area
    tweetTextarea.value = generateTweetDraft(state.selectedItem, 0);
    
    // Open Modal display
    composerModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Lock background scrolling
    
    // Auto-focus and size composer
    tweetTextarea.focus();
    updateCharCounter();
}

// Close Composer Modal
function closeComposerModal() {
    composerModal.style.display = 'none';
    document.body.style.overflow = ''; // Unlock background scrolling
}

// Update character counter and progress ring SVG
function updateCharCounter() {
    const len = tweetTextarea.value.length;
    const limit = 280;
    const remaining = limit - len;
    
    charCountNum.textContent = remaining;
    
    // Ring progress calculation
    const percent = Math.min(100, (len / limit) * 100);
    const strokeDashoffset = ringCircumference - (percent / 100 * ringCircumference);
    progressRingCircle.style.strokeDashoffset = strokeDashoffset;
    
    // Style adjustments based on remaining limits
    if (remaining < 0) {
        // Exceeded
        progressRingCircle.style.stroke = '#f87171'; // Red
        charCountNum.className = 'char-count-num danger';
        warningMsg.style.display = 'inline';
        postTweetBtn.disabled = true;
        postTweetBtn.style.opacity = '0.5';
        postTweetBtn.style.cursor = 'not-allowed';
    } else if (remaining < 20) {
        // Warning
        progressRingCircle.style.stroke = '#fb923c'; // Orange
        charCountNum.className = 'char-count-num warning';
        warningMsg.style.display = 'none';
        postTweetBtn.disabled = false;
        postTweetBtn.style.opacity = '1';
        postTweetBtn.style.cursor = 'pointer';
    } else {
        // Safe
        progressRingCircle.style.stroke = '#1d9bf0'; // X Blue
        charCountNum.className = 'char-count-num';
        warningMsg.style.display = 'none';
        postTweetBtn.disabled = false;
        postTweetBtn.style.opacity = '1';
        postTweetBtn.style.cursor = 'pointer';
    }
}
