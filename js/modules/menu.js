/*jshint esversion: 8 */
/*global  */

import { pages } from "./pages.js";

export const generateDropdownUL = (id) => {

  const items = pages.map((item) => {
    const li_class_map = {
      'all': '',
      'mobile': 'mobile-only',
      'desktop': 'desktop-only'
    }
    const divider_map = {
      'normal': "<hr class='item dropdown-divider'></hr>",
      'wide': "<hr class='item dropdown-divider wide'></hr>"
    }

    let contents = '';
    let disabled = 'disabled';
    let selected = '';
    let fragment = '';

    switch (item.type) {
    case 'divider':
      if (item.size == 'wide') {
        contents = divider_map['wide'];
      } else {
        contents = divider_map['normal'];
      }
      break;

    case 'popup':
      contents = `
          <div class='item ${item.type}' data-bs-toggle="offcanvas" href="#aboutThoreau" role="button" aria-controls="offcanvasExample">
            ${item.name}
          </div>`;
      break;

    case 'link':
    case 'artifact':
      if (item.enabled) {
        disabled = '';
      }
      if (item.id == id) {
        selected = 'selected';
      }

      if (item.fragment == true) {
        fragment = `#${id}`;
      }

      contents = `<div class='item'>
          <a class="dropdown-item ${disabled} ${selected}" href="${item.location}${fragment}">${item.name}</a>
        </div>`;

      if (item.type == 'artifact' && !item.enabled) {
        contents = '';
      }

      break;
    }

    const li = `
    <li class='${li_class_map[item.dropdownMenu]}'>
      ${contents}
    </li>
    `
    return li;
  })

  const dropdownmenu = document.getElementById('explore-another-object');

  const dropDownUl = `<ul id="dropdown-menu" class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton1">
    <div class='close mobile-only'>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" stroke="currentColor" stroke-width="4" stroke-linecap="round" viewBox="0 0 16 16">
        <path class="outline" d="M0 0 L16 16 M0 16 L16 0" </path>
      </svg>
    </div>
    ${items.join('')}
  </ul>`
  dropdownmenu.insertAdjacentHTML('beforeend', dropDownUl);
}

export const generateFooterItems = () => {

  const items = pages.filter(i => i.footerItem).map((item) => {
    let contents = '';

    switch (item.type) {
    case 'link':
      contents = `<div class='item ${item.type}'>
         <a href="${item.location}" target="_blank">${item.name}</a>
       </div>`;
      break;
    case 'popup':
      contents = `
        <div class='item ${item.type}' data-bs-toggle="offcanvas" href="#aboutThoreau" role="button" aria-controls="offcanvasExample">
          ${item.name}
        </div>`;
      break;
    }
    return contents;
  })

  const unmuteFooter = document.getElementById('unmute-footer');

  const footerItems = `<div class="footer-items">
    ${items.join('')}
  </div>`

  unmuteFooter.insertAdjacentHTML('afterbegin', footerItems);

}
