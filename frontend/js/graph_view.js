/**
 * Deep Research Assistant - Multi-Agent Workflow Visualizer
 */

const GraphVisualizer = {
  nodes: {
    scope: document.getElementById('graphNodeScope'),
    supervisor: document.getElementById('graphNodeSupervisor'),
    workers: document.getElementById('graphNodeWorkers'),
    writer: document.getElementById('graphNodeWriter'),
  },

  reset() {
    this.setActiveNode('scope');
  },

  setActiveNode(activeKey) {
    const sequence = ['scope', 'supervisor', 'workers', 'writer'];
    const activeIndex = sequence.indexOf(activeKey);

    sequence.forEach((key, idx) => {
      const el = document.getElementById(
        `graphNode${key.charAt(0).toUpperCase() + key.slice(1)}`
      );
      if (!el) return;

      const badge = el.querySelector('.node-status-badge');
      const iconContainer = el.querySelector('.node-icon');

      el.classList.remove('active', 'completed');

      if (idx < activeIndex) {
        // Node is completed
        el.classList.add('completed');
        if (badge) badge.textContent = 'Done';
        if (iconContainer) {
          iconContainer.className = 'node-icon bg-emerald-500 text-white';
        }
      } else if (idx === activeIndex) {
        // Node is currently active
        el.classList.add('active');
        if (badge) badge.textContent = 'Active';
        if (iconContainer) {
          iconContainer.className = 'node-icon bg-blue-600 text-white';
        }
      } else {
        // Node is pending
        if (badge) badge.textContent = 'Waiting';
        if (iconContainer) {
          iconContainer.className =
            'node-icon bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400';
        }
      }
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  markAllComplete() {
    ['scope', 'supervisor', 'workers', 'writer'].forEach((key) => {
      const el = document.getElementById(
        `graphNode${key.charAt(0).toUpperCase() + key.slice(1)}`
      );
      if (!el) return;
      el.classList.remove('active');
      el.classList.add('completed');
      const badge = el.querySelector('.node-status-badge');
      if (badge) badge.textContent = 'Done';
      const iconContainer = el.querySelector('.node-icon');
      if (iconContainer) {
        iconContainer.className = 'node-icon bg-emerald-500 text-white';
      }
    });
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },
};
