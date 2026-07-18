type FilterState = { type: string; status: string; year: string };
type Cleanup = () => void;

const allValue = 'all';
const filterCleanups = new WeakMap<ParentNode, Cleanup>();

export function initProjectFilters(root: ParentNode = document): Cleanup {
  filterCleanups.get(root)?.();

  const container = root.querySelector<HTMLElement>('[data-project-filters]');
  if (!container) return () => {};

  const typeButtons = Array.from(container.querySelectorAll<HTMLButtonElement>('[data-project-type]'));
  const statusSelect = container.querySelector<HTMLSelectElement>('[data-project-status]');
  const yearSelect = container.querySelector<HTMLSelectElement>('[data-project-year]');
  const resetButton = container.querySelector<HTMLButtonElement>('[data-project-reset]');
  const cards = Array.from(container.querySelectorAll<HTMLElement>('[data-project-card]'));
  const resultCount = container.querySelector<HTMLElement>('[data-project-result-count]');
  const noResults = container.querySelector<HTMLElement>('[data-project-no-results]');
  let state: FilterState = { type: allValue, status: allValue, year: allValue };

  const render = () => {
    let visible = 0;
    for (const card of cards) {
      const matches =
        (state.type === allValue || card.dataset.projectKind === state.type) &&
        (state.status === allValue || card.dataset.projectStatus === state.status) &&
        (state.year === allValue || card.dataset.projectYear === state.year);
      card.hidden = !matches;
      if (matches) visible += 1;
    }
    if (resultCount) resultCount.textContent = `显示 ${visible} 个项目`;
    if (noResults) noResults.hidden = visible !== 0;
  };

  const setType = (type: string) => {
    state = { ...state, type };
    for (const button of typeButtons) button.setAttribute('aria-pressed', String(button.dataset.projectType === type));
    render();
  };

  const onTypeClick = (event: Event) =>
    setType((event.currentTarget as HTMLButtonElement).dataset.projectType ?? allValue);
  const onTypeKeydown = (event: KeyboardEvent) => {
    const activeIndex = typeButtons.indexOf(event.currentTarget as HTMLButtonElement);
    if (activeIndex < 0) return;
    const targetIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? typeButtons.length - 1
          : event.key === 'ArrowLeft'
            ? (activeIndex - 1 + typeButtons.length) % typeButtons.length
            : event.key === 'ArrowRight'
              ? (activeIndex + 1) % typeButtons.length
              : -1;
    if (targetIndex < 0) return;
    event.preventDefault();
    const target = typeButtons[targetIndex];
    target?.focus();
    setType(target?.dataset.projectType ?? allValue);
  };
  const onStatusChange = () => {
    state = { ...state, status: statusSelect?.value || allValue };
    render();
  };
  const onYearChange = () => {
    state = { ...state, year: yearSelect?.value || allValue };
    render();
  };
  const onReset = () => {
    state = { type: allValue, status: allValue, year: allValue };
    if (statusSelect) statusSelect.value = allValue;
    if (yearSelect) yearSelect.value = allValue;
    setType(allValue);
  };

  for (const button of typeButtons) {
    button.addEventListener('click', onTypeClick);
    button.addEventListener('keydown', onTypeKeydown);
  }
  statusSelect?.addEventListener('change', onStatusChange);
  yearSelect?.addEventListener('change', onYearChange);
  resetButton?.addEventListener('click', onReset);
  render();

  const cleanup = () => {
    for (const button of typeButtons) {
      button.removeEventListener('click', onTypeClick);
      button.removeEventListener('keydown', onTypeKeydown);
    }
    statusSelect?.removeEventListener('change', onStatusChange);
    yearSelect?.removeEventListener('change', onYearChange);
    resetButton?.removeEventListener('click', onReset);
    if (filterCleanups.get(root) === cleanup) filterCleanups.delete(root);
  };
  filterCleanups.set(root, cleanup);
  return cleanup;
}
