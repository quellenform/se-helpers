document.addEventListener('DOMContentLoaded', function () {
  fetch('comments.json')
    .then(response => response.json())
    .then(data => {
      initializeComments(data);
    })
    .catch(error => console.error('Error fetching comments:', error));

  const searchInput = document.getElementById('search');
  const clearButton = document.getElementById('clear-search');
  searchInput.addEventListener('input', handleInputChange);
  clearButton.addEventListener('click', handleClearClick);
});

function initializeComments(data) {
  loadComments('question-comments', data.questions);
  loadComments('answer-comments', data.answers);
  loadComments('misc-comments', data.miscellaneous);
  loadComments('others-comments', data.others);
  addExpandableListeners();
}

function loadComments(containerId, comments) {
  const container = document.getElementById(containerId);
  const list = document.createElement('ul');

  comments.forEach(comment => {
    const listItem = createListItem(comment);
    list.appendChild(listItem);
  });

  container.appendChild(list);
  addExpandableListeners();
}

function createListItem(comment) {
  const listItem = document.createElement('li');
  const expandableItem = document.createElement('span');
  expandableItem.classList.add('expandable-item');
  expandableItem.textContent = comment.title;
  const itemContent = document.createElement('div');
  itemContent.classList.add('item-content');
  itemContent.innerHTML = `${comment.description} <span class="copy-button">Copy</span>`;
  listItem.appendChild(expandableItem);
  listItem.appendChild(itemContent);
  return listItem;
}

function addExpandableListeners() {
  document.querySelectorAll('.expandable').forEach(expandable => {
    expandable.addEventListener('click', toggleContentDisplay);
  });

  document.querySelectorAll('.expandable-item').forEach(item => {
    item.addEventListener('click', toggleItemContentDisplay);
  });

  document.addEventListener('click', handleCopyButtonClick);
}

function toggleContentDisplay() {
  const content = this.nextElementSibling;
  if (content) {
    content.style.display = (content.style.display === 'none' || content.style.display === '') ? 'block' : 'none';
  }
}

function toggleItemContentDisplay() {
  const content = this.nextElementSibling;
  if (content) {
    const copyButton = content.querySelector('.copy-button');
    const isVisible = content.style.display === 'block';
    content.style.display = isVisible ? 'none' : 'block';
    if (copyButton) {
      copyButton.style.display = isVisible ? 'none' : 'inline';
    }
  }
}

function handleCopyButtonClick(event) {
  if (event.target.classList.contains('copy-button')) {
    const textToCopy = event.target.parentElement.textContent.replace('Copy', '').trim();
    navigator.clipboard.writeText(textToCopy).then(() => {
      console.log('Text copied to clipboard: ' + textToCopy);
    }).catch(err => {
      console.error('Error in copying text: ', err);
    });
  }
}

function handleInputChange() {
  const query = this.value.trim();
  if (query === '') {
    resetComments();
  } else if (query.length > 1 && !/^\s+$/.test(query)) {
    searchComments(query);
  } else {
    resetComments();
  }
}

function handleClearClick() {
  const searchInput = document.getElementById('search');
  searchInput.value = '';
  resetComments();
  searchInput.focus();
}

function searchComments(query) {
  document.querySelectorAll('.content').forEach(content => {
    let matchFound = false;
    content.querySelectorAll('li').forEach(listItem => {
      const expandableItem = listItem.querySelector('.expandable-item');
      const itemContent = listItem.querySelector('.item-content');
      const copyButton = itemContent ? itemContent.querySelector('.copy-button') : null;
      const itemTitle = expandableItem ? expandableItem.textContent.toLowerCase() : '';
      const itemContentText = itemContent ? itemContent.textContent.replace('Copy', '').toLowerCase() : '';

      if (itemTitle.includes(query.toLowerCase()) || itemContentText.includes(query.toLowerCase())) {
        listItem.style.display = 'block';
        matchFound = true;
        if (itemContent) {
          itemContent.style.display = 'block';
          highlightText(itemContent, query);
        }
        if (copyButton) {
          copyButton.style.display = 'inline'; // Ensure button is visible
        }
      } else {
        listItem.style.display = 'none';
        if (itemContent) {
          itemContent.style.display = 'none';
          removeHighlight(itemContent);
        }
        if (copyButton) {
          copyButton.style.display = 'none';
        }
      }
    });
    content.style.display = matchFound ? 'block' : 'none';
  });
}

function highlightText(contentElement, query) {
  let innerHTML = contentElement.innerHTML;
  innerHTML = innerHTML.replace(/<span style="background-color: yellow;">(.*?)<\/span>/gi, '$1');
  const regex = new RegExp(`(${query})(?![^<]*>)`, 'gi'); // Negative lookahead to exclude HTML tags
  innerHTML = innerHTML.replace(regex, '<span style="background-color: yellow;">$1</span>');
  contentElement.innerHTML = innerHTML;
}

function removeHighlight(contentElement) {
  let innerHTML = contentElement.innerHTML;
  innerHTML = innerHTML.replace(/<span style="background-color: yellow;">(.*?)<\/span>/gi, '$1');
  contentElement.innerHTML = innerHTML;
}

function resetComments() {
  document.querySelectorAll('.content').forEach(content => {
    content.style.display = 'none';
    content.querySelectorAll('li').forEach(listItem => {
      listItem.style.display = 'block';
      const itemContent = listItem.querySelector('.item-content');
      if (itemContent) {
        itemContent.style.display = 'none';
        removeHighlight(itemContent);
      }
      const copyButton = listItem.querySelector('.copy-button');
      if (copyButton) {
        copyButton.style.display = 'inline'; // Ensure button is visible on reset
      }
    });
  });
  addExpandableListeners(); // Reapply listeners after reset
}
