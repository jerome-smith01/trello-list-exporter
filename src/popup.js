(function () {
  const app = document.getElementById('app');
  const fallback = document.getElementById('fallback');
  const title = document.getElementById('title');
  const subtitle = document.getElementById('subtitle');
  const boardNameEl = document.getElementById('board-name');
  const listNameEl = document.getElementById('list-name');
  const cardCountEl = document.getElementById('card-count');
  const downloadButton = document.getElementById('download-json-button');
  const downloadCSVButton = document.getElementById('download-csv-button');
  const downloadMarkdownButton = document.getElementById('download-markdown-button');
  const copyListIdButton = document.getElementById('copy-list-id-button');
  const closeButton = document.getElementById('close-button');
  const statusEl = document.getElementById('status');
  const visibleOnlyCheckbox = document.getElementById('visible-only-checkbox');

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

  function setStatusLoading(message) {
    statusEl.textContent = message;
    statusEl.className = 'status loading';
  }

  function setStatusSuccess(message) {
    statusEl.textContent = message;
    statusEl.className = 'status success';
    setTimeout(function () {
      statusEl.className = 'status';
    }, 2500);
  }

  function setStatusError(message) {
    statusEl.textContent = message;
    statusEl.className = 'status error';
  }

  function safeFilenameComponent(value) {
    return String(value || '')
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'export';
  }

  function buildFilename(boardName, listName) {
    return buildCSVFilename(boardName, listName, 'json');
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
      attachments: Array.isArray(card.attachments)
        ? card.attachments.map(function (attachment) {
            return {
              id: attachment && attachment.id ? attachment.id : '',
              name: attachment && attachment.name ? attachment.name : '',
              url: attachment && attachment.url ? attachment.url : '',
              mimeType: attachment && attachment.mimeType ? attachment.mimeType : '',
              isUpload: !!(attachment && attachment.isUpload),
              bytes:
                attachment && typeof attachment.bytes === 'number'
                  ? attachment.bytes
                  : null,
              preview: attachment && attachment.preview ? attachment.preview : null,
            };
          })
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
      const listMeta = await t.list('name', 'id').catch(function () { return null; });
      const allCards = await t.cards('all');
      list = listMeta;
      // Safety: if t.cards('all') returns board-wide cards, restrict to this list.
      if (listMeta && listMeta.id && Array.isArray(allCards)) {
        cards = allCards.filter(function (c) { return c.idList === listMeta.id; });
      } else {
        cards = Array.isArray(allCards) ? allCards : [];
      }
      return {list, cards};
    } catch (error) {
      return {list: null, cards: []};
    }
  }

  function createExportPayload(board, list, cards, visibleOnly) {
    return {
      exportedAt: new Date().toISOString(),
      visibleOnly: visibleOnly,
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
    link.download = buildCSVFilename(payload.board.name, payload.list.name, 'json');
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatusSuccess(`✓ Downloaded ${payload.cards.length} card${payload.cards.length === 1 ? '' : 's'} as JSON.`);
  }

  function escapeCSVCell(value) {
    if (value === null || value === undefined) {
      return '';
    }
    const str = String(value);
    if (/^[=+\-@]/.test(str)) {
      return `'${str}`;
    }
    if (/["\n\r,]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function buildCSVRow(values) {
    return values.map(escapeCSVCell).join(',');
  }

  function createCSVContent(board, list, cards) {
    const rows = [];
    const headers = [
      'Card ID',
      'Card Short ID',
      'Card Name',
      'Description',
      'Labels',
      'Members',
      'Start Date',
      'Due Date',
      'Due Completion',
      'Card URL',
      'Last Activity',
      'Attachments',
    ];
    rows.push(buildCSVRow(headers));
    cards.forEach(function (card) {
      const labels = Array.isArray(card.labels)
        ? card.labels
            .map(function (label) {
              return label && label.name ? label.name : '';
            })
            .join(';')
        : '';
      const members = Array.isArray(card.members)
        ? card.members
            .map(function (member) {
              return member && member.username ? member.username : '';
            })
            .join(';')
        : '';
      const attachments = Array.isArray(card.attachments)
        ? card.attachments
            .map(function (attachment) {
              if (!attachment) {
                return '';
              }
              const label = attachment.name || attachment.url || '';
              if (attachment.name && attachment.url) {
                return `${attachment.name} <${attachment.url}>`;
              }
              return label;
            })
            .filter(Boolean)
            .join('; ')
        : '';
      const row = [
        card.id || '',
        card.idShort || '',
        card.name || '',
        card.desc || '',
        labels,
        members,
        card.start || '',
        card.due || '',
        card.dueComplete ? 'Yes' : 'No',
        card.url || '',
        card.dateLastActivity || '',
        attachments,
      ];
      rows.push(buildCSVRow(row));
    });
    const csvContent = rows.join('\n');
    const bomChar = '\uFEFF';
    return bomChar + csvContent;
  }

  function downloadCSV(board, list, cards, filename) {
    const csvContent = createCSVContent(board, list, cards);
    const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatusSuccess(`✓ Downloaded ${cards.length} card${cards.length === 1 ? '' : 's'} as CSV.`);
  }

  function getLocalTimestamp() {
    const now = new Date();
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  }

  function buildCSVFilename(boardName, listName, format) {
    const board = safeFilenameComponent(boardName || 'board');
    const list = safeFilenameComponent(listName || 'list');
    const timestamp = getLocalTimestamp();
    return `${board}_${list}_${timestamp}.${format}`;
  }

  function buildHandoffFilename(boardName, listName) {
    const board = safeFilenameComponent(boardName || 'board');
    const list = safeFilenameComponent(listName || 'list');
    const timestamp = getLocalTimestamp();
    return `${board}_${list}_${timestamp}.md`;
  }

  function formatCardForHandoff(card) {
    const lines = [];
    lines.push(`## ${card.name || 'Untitled Card'}`);
    lines.push('');
    if (card.labels && card.labels.length > 0) {
      const labelNames = card.labels
        .map(function (label) {
          return label && label.name ? label.name : '';
        })
        .filter(Boolean);
      if (labelNames.length > 0) {
        lines.push(`**Labels:** ${labelNames.join(', ')}`);
      }
    }
    if (card.due) {
      const dueDate = new Date(card.due);
      const dueDateStr = dueDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      lines.push(`**Due:** ${dueDateStr}${card.dueComplete ? ' (Complete)' : ''}`);
    }
    if (card.url) {
      lines.push(`**Trello URL:** ${card.url}`);
    }
    lines.push('');
    if (card.desc && card.desc.trim()) {
      lines.push('### Description');
      lines.push(card.desc);
      lines.push('');
    }
    if (card.members && card.members.length > 0) {
      const memberNames = card.members
        .map(function (member) {
          return member && member.fullName
            ? member.fullName
            : member.username || '';
        })
        .filter(Boolean);
      if (memberNames.length > 0) {
        lines.push('### Assigned To');
        memberNames.forEach(function (name) {
          lines.push(`- ${name}`);
        });
        lines.push('');
      }
    }
    if (card.attachments && card.attachments.length > 0) {
      lines.push('### Attachments');
      card.attachments.forEach(function (attachment) {
        const attachmentName = attachment && attachment.name ? attachment.name : 'Attachment';
        const attachmentUrl = attachment && attachment.url ? attachment.url : '';
        const attachmentMime = attachment && attachment.mimeType ? attachment.mimeType : '';
        const attachmentIsUpload = attachment && attachment.isUpload ? 'Yes' : 'No';
        const attachmentPreview = attachment && attachment.preview ? 'Yes' : 'No';

        if (attachmentUrl) {
          lines.push(`- [${attachmentName}](${attachmentUrl})`);
        } else {
          lines.push(`- ${attachmentName}`);
        }
        if (attachmentMime || attachmentIsUpload || attachmentPreview) {
          if (attachmentMime) {
            lines.push(`  - MIME type: ${attachmentMime}`);
          }
          lines.push(`  - Uploaded: ${attachmentIsUpload}`);
          lines.push(`  - Preview available: ${attachmentPreview}`);
          if (attachment && attachment.bytes !== null) {
            lines.push(`  - Size: ${attachment.bytes} bytes`);
          }
        }
      });
      lines.push('');
    }
    return lines.join('\n');
  }

  function createHandoffMarkdown(board, list, cards, totalCards, visibleOnly) {
    const lines = [];
    lines.push('# Trello List Export');
    lines.push('');
    lines.push('## Antigravity Handoff');
    lines.push('');
    lines.push('## Export Metadata');
    lines.push('');
    lines.push(`- Exported: ${new Date().toISOString()}`);
    lines.push(`- Board: ${board && board.name ? board.name : 'Unknown Board'}`);
    lines.push(`- List: ${list && list.name ? list.name : 'Unknown List'}`);
    lines.push(`- Visible only filter applied: ${visibleOnly ? 'Yes' : 'No'}`);
    lines.push(`- Cards exported: ${cards.length}`);
    if (typeof totalCards === 'number' && totalCards !== cards.length) {
      lines.push(`- Total cards in list: ${totalCards}`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Privacy & Usage');
    lines.push('');
    lines.push(
      'This handoff was generated locally in your browser. Share only with authorized team members.'
    );
    lines.push('');
    if (cards.length > 0) {
      lines.push('## Cards');
      lines.push('');
      cards.forEach(function (card, index) {
        if (index > 0) {
          lines.push('---');
          lines.push('');
        }
        lines.push(formatCardForHandoff(card));
      });
    } else {
      lines.push('## No Cards');
      lines.push('');
      lines.push('This list contains no cards to export.');
      lines.push('');
    }
    return lines.join('\n');
  }

  async function render() {
    if (!window.TrelloPowerUp) {
      setFallback('Trello Power-Up client library is not available.');
      return;
    }

    const t = window.TrelloPowerUp.iframe();
    t.render(function () {
      t.sizeTo(app).done();
    });

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
    boardNameEl.title = effectiveBoardName;
    listNameEl.textContent = effectiveListName;
    listNameEl.title = effectiveListName;
    cardCountEl.textContent = 'Loading…';

    setStatus('Fetching list details…');
    downloadButton.disabled = true;
    downloadCSVButton.disabled = true;

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
    boardNameEl.title = resolvedBoardName;
    listNameEl.textContent = resolvedListName;
    listNameEl.title = resolvedListName;

    // Wire up Copy List ID button
    copyListIdButton.disabled = false;
    copyListIdButton.addEventListener('click', function () {
      navigator.clipboard.writeText(effectiveListId).then(function () {
        var original = copyListIdButton.textContent.trim();
        copyListIdButton.textContent = 'Copied!';
        setTimeout(function () { copyListIdButton.textContent = original; }, 1500);
      });
    });
    
    if (!list) {
      setStatusError('Error: Could not load list data from Trello.');
      return;
    }
    
    // Filter cards based on checkbox.
    // Note: Trello's Power-Up API does not expose the board's active filter
    // state from within a popup iframe. "Visible only" reliably excludes
    // archived (closed) cards, which is the behaviour the checkbox controls.
    function getExportCards() {
      if (visibleOnlyCheckbox.checked) {
        return cards.filter(function (card) {
          return !card.closed;
        });
      }
      return cards;
    }
    
    function updateCardCount() {
      const exportCards = getExportCards();
      const totalCards = cards.length;
      const archivedCount = totalCards - exportCards.length;
      
      if (visibleOnlyCheckbox.checked && archivedCount > 0) {
        cardCountEl.textContent = String(exportCards.length) + ' (' + String(totalCards) + ' total)';
      } else {
        cardCountEl.textContent = String(totalCards);
      }
      
      if (exportCards.length === 0) {
        setStatus('No cards to export.');
        downloadButton.disabled = true;
        downloadCSVButton.disabled = true;
        downloadMarkdownButton.disabled = true;
      } else {
        setStatus(`Ready to export ${exportCards.length} card${exportCards.length === 1 ? '' : 's'}.`);
        downloadButton.disabled = false;
        downloadCSVButton.disabled = false;
        downloadMarkdownButton.disabled = false;
      }
    }
    
    visibleOnlyCheckbox.addEventListener('change', updateCardCount);
    updateCardCount();

    downloadButton.onclick = function () {
      const exportCards = getExportCards();
      const payload = createExportPayload(resolvedBoard || {}, list, exportCards, visibleOnlyCheckbox.checked);
      downloadJSON(payload);
    };

    downloadCSVButton.onclick = function () {
      const exportCards = getExportCards();
      const filename = buildCSVFilename(resolvedBoardName, resolvedListName, 'csv');
      downloadCSV(resolvedBoard || {}, list, exportCards, filename);
    };

    downloadMarkdownButton.onclick = function () {
      const exportCards = getExportCards();
      const markdownContent = createHandoffMarkdown(resolvedBoard || {}, list, exportCards, cards.length, visibleOnlyCheckbox.checked);
      const filename = buildHandoffFilename(resolvedBoardName, resolvedListName);
      const blob = new Blob([markdownContent], {type: 'text/markdown;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatusSuccess(`\u2713 Downloaded ${exportCards.length} card${exportCards.length === 1 ? '' : 's'} as markdown.`);
    };

    closeButton.onclick = function () {
      t.closePopup();
    };

    // Tooltip handling for mobile touch and icon trigger
    function setupTooltip(triggerElement) {
      var wrapper = triggerElement.parentElement;

      triggerElement.addEventListener('touchstart', function (e) {
        e.preventDefault();
        var isShowing = wrapper.classList.contains('show-tooltip');
        if (isShowing) {
          wrapper.classList.remove('show-tooltip');
        } else {
          wrapper.classList.add('show-tooltip');
        }
      }, { passive: false });

      triggerElement.addEventListener('click', function (e) {
        e.stopPropagation();
        wrapper.classList.toggle('show-tooltip');
      });

      triggerElement.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          wrapper.classList.toggle('show-tooltip');
        }
      });
    }

    setupTooltip(document.querySelector('#download-json-button + .tooltip-trigger'));
    setupTooltip(document.querySelector('#download-csv-button + .tooltip-trigger'));
    setupTooltip(document.querySelector('#download-markdown-button + .tooltip-trigger'));
    setupTooltip(document.querySelector('#copy-list-id-button + .tooltip-trigger'));

    // Close tooltip when clicking elsewhere
    document.addEventListener('click', function (e) {
      var wrappers = document.querySelectorAll('.button-wrapper');
      wrappers.forEach(function (wrapper) {
        if (!wrapper.contains(e.target)) {
          wrapper.classList.remove('show-tooltip');
        }
      });
    });

    await t.sizeTo(app);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
