(function () {
  const app = document.getElementById('app');
  const fallback = document.getElementById('fallback');
  const title = document.getElementById('title');
  const subtitle = document.getElementById('subtitle');
  const boardNameEl = document.getElementById('board-name');
  const listNameEl = document.getElementById('list-name');
  const listIdEl = document.getElementById('list-id');
  const cardCountEl = document.getElementById('card-count');
  const downloadButton = document.getElementById('download-json-button');
  const closeButton = document.getElementById('close-button');
  const statusEl = document.getElementById('status');

  function setFallback(message) {
    document.body.classList.add('no-trello');
    fallback.querySelector('p').textContent = message;
  }

  function fillEmpty(value, fallbackValue) {
    return value && String(value).trim() ? value : fallbackValue;
  }

  function setStatus(message) {
    statusEl.textContent = message;
  }

  function safeFilenameComponent(value) {
    return String(value || '')
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'export';
  }

  function buildFilename(boardName, listName) {
    const board = safeFilenameComponent(boardName || 'board');
    const list = safeFilenameComponent(listName || 'list');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${board}_${list}_${timestamp}.json`;
  }

  function normalizeLabel(label) {
    return {
      id: label && label.id ? label.id : '',
      name: label && label.name ? label.name : '',
      color: label && label.color ? label.color : '',
    };
  }

  function normalizeMember(member) {
    if (!member) {
      return {id: '', fullName: '', username: ''};
    }
    return {
      id: member.id || '',
      fullName: member.fullName || member.fullName || member.username || '',
      username: member.username || '',
    };
  }

  function normalizeCard(card) {
    return {
      id: card.id || '',
      idShort: card.idShort || null,
      name: card.name || '',
      desc: card.desc || '',
      labels: Array.isArray(card.labels)
        ? card.labels.map(normalizeLabel)
        : [],
      members: Array.isArray(card.members)
        ? card.members.map(normalizeMember)
        : Array.isArray(card.idMembers)
        ? card.idMembers.slice()
        : [],
      start: card.start || null,
      due: card.due || null,
      dueComplete: !!card.dueComplete,
      url: card.url || '',
      pos: card.pos || null,
      dateLastActivity: card.dateLastActivity || null,
    };
  }

  async function resolveListCards(t) {
    let list = null;
    let cards = [];

    try {
      const listData = await t.list('name', 'id', 'cards', 'all');
      if (listData && Array.isArray(listData.cards)) {
        list = listData;
        cards = listData.cards;
        return {list, cards};
      }
    } catch (error) {
      // Continue to fallback strategy.
    }

    try {
      cards = await t.cards('all');
      list = await t.list('name', 'id').catch(function () {
        return null;
      });
      return {list, cards: Array.isArray(cards) ? cards : []};
    } catch (error) {
      return {list: null, cards: []};
    }
  }

  function createExportPayload(board, list, cards) {
    return {
      exportedAt: new Date().toISOString(),
      board: {
        id: board && board.id ? board.id : '',
        name: board && board.name ? board.name : '',
      },
      list: {
        id: list && list.id ? list.id : '',
        name: list && list.name ? list.name : '',
      },
      cards: cards.map(normalizeCard),
    };
  }

  function downloadJSON(payload) {
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], {type: 'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = buildFilename(payload.board.name, payload.list.name);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus(`Downloaded ${payload.cards.length} cards as JSON.`);
  }

  async function render() {
    if (!window.TrelloPowerUp) {
      setFallback('Trello Power-Up client library is not available.');
      return;
    }

    const t = window.TrelloPowerUp.iframe();
    const listId = t.arg('listId', 'Unavailable');
    const listNameArg = t.arg('listName', 'Selected list');
    const boardNameArg = t.arg('boardName', 'Selected board');

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
      (resolvedList && resolvedList.name) || listNameArg,
      'Selected list'
    );
    const effectiveBoardName = fillEmpty(
      (resolvedBoard && resolvedBoard.name) || boardNameArg,
      'Selected board'
    );
    const effectiveListId = fillEmpty(
      (resolvedList && resolvedList.id) || listId,
      'Unavailable'
    );

    title.textContent = `Export ${effectiveListName}`;
    subtitle.textContent = 'Download the selected list as JSON.';
    boardNameEl.textContent = effectiveBoardName;
    listNameEl.textContent = effectiveListName;
    listIdEl.textContent = effectiveListId;
    cardCountEl.textContent = 'Loading…';

    setStatus('Fetching list details…');
    downloadButton.disabled = true;

    const {list, cards} = await resolveListCards(t);
    const resolvedListName = fillEmpty(
      (list && list.name) || effectiveListName,
      effectiveListName
    );
    const resolvedBoardName = fillEmpty(
      (resolvedBoard && resolvedBoard.name) || effectiveBoardName,
      effectiveBoardName
    );

    boardNameEl.textContent = resolvedBoardName;
    listNameEl.textContent = resolvedListName;
    cardCountEl.textContent = String(cards.length);

    if (!list) {
      setStatus('Could not resolve list details from Trello. JSON export is unavailable.');
      return;
    }

    setStatus(`Ready to export ${cards.length} card${cards.length === 1 ? '' : 's'}.`);
    downloadButton.disabled = false;

    downloadButton.onclick = function () {
      const payload = createExportPayload(resolvedBoard || {}, list, cards);
      downloadJSON(payload);
    };

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
