document.addEventListener('DOMContentLoaded', function () {
    fetch('comments.json')
      .then(response => response.json())
      .then(data => {
        loadComments('question-comments', data.questions);
        loadComments('answer-comments', data.answers);
        loadComments('misc-comments', data.miscellaneous);
        loadComments('others-comments', data.others);
        addExpandableListeners();
      });
  });

  function loadComments(containerId, comments) {
    const container = document.getElementById(containerId);
    const list = document.createElement('ul');
    comments.forEach(comment => {
      const listItem = document.createElement('li');
      const expandableItem = document.createElement('span');
      expandableItem.classList.add('expandable-item');
      expandableItem.textContent = comment.title;
      const itemContent = document.createElement('div');
      itemContent.classList.add('item-content');
      itemContent.innerHTML = `${comment.description} <span class="copy-button">Copy</span>`;
      listItem.appendChild(expandableItem);
      listItem.appendChild(itemContent);
      list.appendChild(listItem);
    });
    container.appendChild(list);
  }

  function addExpandableListeners() {
    document.querySelectorAll('.expandable').forEach(function(expandable) {
      expandable.addEventListener('click', function() {
        var content = this.nextElementSibling;
        if (content.style.display === 'none' || content.style.display === '') {
          content.style.display = 'block';
        } else {
          content.style.display = 'none';
        }
      });
    });

    document.querySelectorAll('.expandable-item').forEach(function(item) {
      item.addEventListener('click', function() {
        var content = this.nextElementSibling;
        var copyButton = content.querySelector('.copy-button');
        if (content.style.display === 'none' || content.style.display === '') {
          content.style.display = 'block';
          copyButton.style.display = 'inline';
        } else {
          content.style.display = 'none';
          copyButton.style.display = 'none';
        }
      });
    });

    document.querySelectorAll('.copy-button').forEach(function(button) {
      button.addEventListener('click', function() {
        var textToCopy = this.parentElement.textContent.replace('Copy', '').trim();
        navigator.clipboard.writeText(textToCopy);
      });
    });
  }
