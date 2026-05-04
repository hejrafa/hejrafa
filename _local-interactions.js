(() => {
  const JSON_ROOT = '/_json/56a93e7a-33f5-4a52-b53e-05eb587a9a8a';
  const pageFromPath = () => {
    const path = window.location.pathname.replace(/\/+$/, '');
    if (!path || path === '') return '_index';
    return path.split('/').filter(Boolean).pop() || '_index';
  };

  const firstClickAction = (node) => {
    for (const interaction of node.interactions || []) {
      if (interaction?.event?.interactionType !== 'ON_CLICK') continue;
      for (const action of interaction.actions || []) {
        if (action.connectionURL) return action;
      }
    }
    return null;
  };

  const walk = (nodes, id, actions) => {
    const node = nodes[id];
    if (!node) return;
    const action = firstClickAction(node);
    const name = node.name || '';
    if (action && name !== 'hej_logo' && name !== 'link') {
      actions.push({
        href: action.connectionURL,
        external: action.connectionType === 'URL' || action.openUrlInNewTab === true,
      });
    }
    for (const child of node.children || []) walk(nodes, child, actions);
  };

  const candidateElements = () => Array.from(document.querySelectorAll('[role="link"]')).filter((el) => {
    if (el.closest('header')) return false;
    if (el.closest('a[href]')) return false;
    if (el.classList.contains('textContents') || el.closest('.textContents')) return false;
    return true;
  });

  const navigate = (action) => {
    if (!action?.href) return;
    if (action.external) {
      window.open(action.href, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = action.href;
    }
  };

  const enhance = async () => {
    const page = pageFromPath();
    const response = await fetch(`${JSON_ROOT}/${page}.json`);
    if (!response.ok) return;
    const data = await response.json();
    const nodes = data.nodeById || {};
    const actions = [];
    const breakpointIds = Array.from(document.querySelectorAll('[data-breakpoint-id]'))
      .map((el) => el.getAttribute('data-breakpoint-id').replace(/^node-/, '').replace(/_/g, ':'))
      .filter((id, index, all) => all.indexOf(id) === index);

    if (breakpointIds.length) {
      for (const id of breakpointIds) walk(nodes, id, actions);
    } else {
      for (const id of data.roots || []) walk(nodes, id, actions);
    }

    const elements = candidateElements();
    elements.forEach((el, index) => {
      const action = actions[index];
      if (!action?.href) return;
      el.dataset.localHref = action.href;
      el.setAttribute('aria-label', el.getAttribute('aria-label') || action.href);
      el.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        navigate(action);
      });
      el.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        navigate(action);
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhance, { once: true });
  } else {
    enhance();
  }
})();
