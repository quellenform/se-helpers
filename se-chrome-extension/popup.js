document.addEventListener('DOMContentLoaded', function () {
  fetch('comments.json')
    .then(response => response.json())
    .then(data => {
      initializeComments(data);
    }).catch(error => console.error('Error fetching comments:', error));

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
  content.style.display = (content.style.display === 'none' || content.style.display === '') ? 'block' : 'none';
}

function toggleItemContentDisplay() {
  const content = this.nextElementSibling;
  const copyButton = content.querySelector('.copy-button');
  const isVisible = content.style.display === 'block';
  content.style.display = isVisible ? 'none' : 'block';
  copyButton.style.display = isVisible ? 'none' : 'inline';
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
      const itemTitle = listItem.querySelector('.expandable-item').textContent.toLowerCase();
      const itemContent = listItem.querySelector('.item-content').textContent.toLowerCase();
      if (itemTitle.includes(query.toLowerCase()) || itemContent.includes(query.toLowerCase())) {
        listItem.style.display = 'block';
        matchFound = true;
        highlightText(listItem, query);
        listItem.querySelector('.item-content').style.display = 'block';
        listItem.querySelector('.copy-button').style.display = 'inline';
      } else {
        listItem.style.display = 'none';
        removeHighlight(listItem);
      }
    });
    content.style.display = matchFound ? 'block' : 'none';
  });
}

function highlightText(element, query) {
  removeHighlight(element);
  const regex = new RegExp(`(${query})`, 'gi');
  element.innerHTML = element.innerHTML.replace(regex, '<span style="background-color: yellow;">$1</span>');
}

function removeHighlight(element) {
  element.innerHTML = element.innerHTML.replace(/<span style="background-color: yellow;">(.*?)<\/span>/gi, '$1');
}

function resetComments() {
  document.querySelectorAll('.content').forEach(content => {
    content.style.display = 'none';
    content.querySelectorAll('li').forEach(listItem => {
      listItem.style.display = 'block';
      listItem.querySelector('.item-content').style.display = 'none';
      listItem.querySelector('.copy-button').style.display = 'none';
      removeHighlight(listItem);
    });
  });
  addExpandableListeners();
}
