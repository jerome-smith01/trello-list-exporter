(function () {
  const statusBadge = document.getElementById('status-badge');
  const fallback = document.getElementById('fallback');
  const capabilityCopy = document.getElementById('capability-copy');

  function setStatus(text, tone) {
    statusBadge.textContent = text;
    statusBadge.dataset.tone = tone;
  }

  function showFallback(message) {
    document.body.classList.add('has-fallback');
    fallback.textContent = message;
  }

  function popupCallback(t) {
    return async function () {
      const context = t.getContext();
      const [list, board] = await Promise.all([
        t.list('name', 'id').catch(function () {
          return null;
        }),
        t.board('name', 'id').catch(function () {
          return null;
        }),
      ]);

      const listName = (list && list.name) || 'Selected list';
      const boardName = (board && board.name) || 'Selected board';

      return t.popup({
        title: `Export ${listName}`,
        url: TrelloPowerUp.util.relativeUrl('popup.html'),
        args: {
          listId: context.list || '',
          boardId: context.board || '',
          listName: listName,
          boardName: boardName,
        },
        height: 340,
      });
    };
  }

  function initializePowerUp() {
    if (!window.TrelloPowerUp) {
      showFallback('Trello Power-Up client library is not available.');
      setStatus('Client library missing', 'warning');
      return;
    }

    TrelloPowerUp.initialize({
      'list-actions': function (t) {
        document.body.classList.remove('has-fallback');
        setStatus('List action registered', 'ok');
        capabilityCopy.textContent =
          'The list menu action opens a popup shell. Export logic arrives in MVP 2.';

        return [
          {
            text: 'Export list...',
            callback: popupCallback(t),
          },
        ];
      },
    });

    setStatus('Connector ready', 'ok');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePowerUp);
  } else {
    initializePowerUp();
  }
})();
