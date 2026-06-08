(function () {
  const app = document.getElementById('app');
  const fallback = document.getElementById('fallback');
  const title = document.getElementById('title');
  const subtitle = document.getElementById('subtitle');
  const boardNameEl = document.getElementById('board-name');
  const listNameEl = document.getElementById('list-name');
  const listIdEl = document.getElementById('list-id');
  const closeButton = document.getElementById('close-button');

  function setFallback(message) {
    document.body.classList.add('no-trello');
    fallback.querySelector('p').textContent = message;
  }

  function fillEmpty(value, fallbackValue) {
    return value && String(value).trim() ? value : fallbackValue;
  }

  async function render() {
    if (!window.TrelloPowerUp) {
      setFallback('Trello Power-Up client library is not available.');
      return;
    }

    const t = window.TrelloPowerUp.iframe();
    const listId = t.arg('listId', '');
    const boardId = t.arg('boardId', '');
    const listName = t.arg('listName', '');
    const boardName = t.arg('boardName', '');

    const resolved = await Promise.all([
      t.list('name', 'id').catch(function () {
        return null;
      }),
      t.board('name', 'id').catch(function () {
        return null;
      }),
    ]);

    const resolvedList = resolved[0];
    const resolvedBoard = resolved[1];
    const effectiveListName = fillEmpty(
      (resolvedList && resolvedList.name) || listName,
      'Selected list'
    );
    const effectiveBoardName = fillEmpty(
      (resolvedBoard && resolvedBoard.name) || boardName,
      'Selected board'
    );
    const effectiveListId = fillEmpty(
      (resolvedList && resolvedList.id) || listId,
      'Unavailable'
    );

    title.textContent = `Export ${effectiveListName}`;
    subtitle.textContent = 'Export controls are not enabled until MVP 2.';
    boardNameEl.textContent = effectiveBoardName;
    listNameEl.textContent = effectiveListName;
    listIdEl.textContent = effectiveListId;

    closeButton.onclick = function () {
      t.closePopup();
    };

    await t.sizeTo(app);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
