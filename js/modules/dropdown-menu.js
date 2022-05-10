export const addDropdownMenuListeners = () => {

  const onMobile = () => {
    const li = document.querySelector('li.mobile-only');
    const style = getComputedStyle(li);
    return style.display != 'none';
  }

  const dropdownMenu = document.getElementById('explore-another-object')
  const arrow = document.querySelector('div.arrow-scroll-down');
  const unmute = document.getElementById('background-track');

  dropdownMenu.addEventListener('shown.bs.dropdown', () => {
    if (onMobile()) {
      arrow.classList.add('hide');
      unmute.classList.add('hide');
    }
  })

  dropdownMenu.addEventListener('hide.bs.dropdown', () => {
    if (onMobile()) {
      arrow.classList.remove('hide');
      unmute.classList.remove('hide');
    }
  })
}
